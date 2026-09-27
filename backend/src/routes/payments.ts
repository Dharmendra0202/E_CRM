import { Router, Response } from "express";
import Razorpay from "razorpay";
import crypto from "crypto";
import { prisma } from "../utils/prisma";
import { authenticate, AuthRequest } from "../middleware/auth";
import { logAudit } from "../utils/auditLog";

const router = Router();

// No hardcoded fallbacks: a committed default secret would make payment
// signatures forgeable by anyone who can read the repo. If the gateway isn't
// configured, payment endpoints fail closed (503) instead of running insecurely.
const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;
const gatewayConfigured = Boolean(razorpayKeyId && razorpayKeySecret);

const razorpay = gatewayConfigured
  ? new Razorpay({ key_id: razorpayKeyId!, key_secret: razorpayKeySecret! })
  : null;

/** Guard for every payment route: refuse to operate unconfigured. */
function requireGateway(res: Response): boolean {
  if (!gatewayConfigured || !razorpay) {
    res.status(503).json({
      status: "error",
      message: "Payment gateway is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.",
    });
    return false;
  }
  return true;
}

/**
 * Resolve the Student record belonging to the caller, if any.
 * Used to stop one student from touching another student's invoices.
 */
async function callerStudentId(userId: string): Promise<string | null> {
  const student = await prisma.student.findUnique({ where: { userId }, select: { id: true } });
  return student?.id ?? null;
}

/**
 * Whether `user` may act on `invoice`. Staff can act on any invoice; a student
 * (or parent) may only act on their own.
 */
async function canActOnInvoice(
  user: { id: string; role: string },
  invoiceStudentId: string
): Promise<boolean> {
  const STAFF_ROLES = ["ADMIN", "SUPER_ADMIN", "BILLING", "STAFF"];
  if (STAFF_ROLES.includes(user.role)) return true;
  const ownStudentId = await callerStudentId(user.id);
  return ownStudentId !== null && ownStudentId === invoiceStudentId;
}

// ── GET /api/v1/payments/config — returns public Key ID for checkout popup ──
router.get("/config", authenticate, async (_req: AuthRequest, res: Response): Promise<void> => {
  if (!requireGateway(res)) return;
  res.json({
    status: "success",
    keyId: razorpayKeyId,
    mode: razorpayKeyId!.startsWith("rzp_test") ? "TEST_MODE" : "LIVE_MODE",
  });
});

// ── POST /api/v1/payments/create-order — Create Razorpay Order ──
router.post("/create-order", authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  if (!requireGateway(res)) return;
  try {
    const { invoiceId, amount } = req.body;
    if (!invoiceId || !amount) {
      res.status(400).json({ status: "error", message: "invoiceId and amount required." });
      return;
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { payments: true },
    });
    if (!invoice) {
      res.status(404).json({ status: "error", message: "Invoice not found." });
      return;
    }

    // Authorization: a student may only pay their own invoice.
    if (!(await canActOnInvoice(req.user!, invoice.studentId))) {
      res.status(403).json({ status: "error", message: "Access denied: not your invoice." });
      return;
    }

    // Validate the requested amount: must be positive and must not exceed the
    // outstanding balance. Prevents zero/negative and over-payment abuse.
    const requested = parseFloat(amount);
    if (!Number.isFinite(requested) || requested <= 0) {
      res.status(400).json({ status: "error", message: "amount must be a positive number." });
      return;
    }
    const alreadyPaid = invoice.payments.reduce((s, p) => s + Number(p.amount), 0);
    const outstanding = Number(invoice.totalAmount) - alreadyPaid;
    if (outstanding <= 0) {
      res.status(409).json({ status: "error", message: "Invoice is already settled." });
      return;
    }
    if (requested > outstanding + 0.001) {
      res.status(400).json({
        status: "error",
        message: `amount exceeds the outstanding balance of ${outstanding.toFixed(2)}.`,
      });
      return;
    }

    // Amount in INR converted to paise (1 INR = 100 paise)
    const amountInPaise = Math.round(requested * 100);

    const options = {
      amount: amountInPaise,
      currency: "INR",
      receipt: `rcpt_${invoiceId.substring(0, 8)}_${Date.now().toString().slice(-4)}`,
      notes: {
        invoiceId: invoice.id,
        studentId: invoice.studentId,
      },
    };

    // Fail closed. Previously a gateway failure fabricated a fake "order_test_*"
    // id and still returned success, which let the client later "verify" a
    // payment that never existed.
    let order: any;
    try {
      order = await razorpay!.orders.create(options);
    } catch (err: any) {
      res.status(502).json({
        status: "error",
        message: "Payment gateway rejected the order request. Please try again.",
      });
      return;
    }

    res.json({
      status: "success",
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: razorpayKeyId,
    });
  } catch (err: any) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

// ── POST /api/v1/payments/verify — Verify Signature & Settle Invoice ──
router.post("/verify", authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  if (!requireGateway(res)) return;
  try {
    const { invoiceId, razorpayOrderId, razorpayPaymentId, razorpaySignature, amount } = req.body;

    // ALL four fields are mandatory. Previously the signature check was skipped
    // entirely when orderId/signature were absent, so a client could settle an
    // invoice by simply omitting them.
    if (!invoiceId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      res.status(400).json({
        status: "error",
        message: "invoiceId, razorpayOrderId, razorpayPaymentId and razorpaySignature are all required.",
      });
      return;
    }

    // Mandatory HMAC SHA256 signature verification — no test-mode escape hatch.
    // (The old code skipped this whenever the key id started with "rzp_test",
    // which meant verification was disabled on every test deployment.)
    const generatedSignature = crypto
      .createHmac("sha256", razorpayKeySecret!)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest("hex");

    const expected = Buffer.from(generatedSignature, "utf8");
    const provided = Buffer.from(String(razorpaySignature), "utf8");
    const signatureValid =
      expected.length === provided.length && crypto.timingSafeEqual(expected, provided);

    if (!signatureValid) {
      res.status(400).json({ status: "error", message: "Invalid payment signature." });
      return;
    }

    const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId }, include: { payments: true } });
    if (!invoice) {
      res.status(404).json({ status: "error", message: "Invoice not found." });
      return;
    }

    // Authorization: a student may only settle their own invoice.
    if (!(await canActOnInvoice(req.user!, invoice.studentId))) {
      res.status(403).json({ status: "error", message: "Access denied: not your invoice." });
      return;
    }

    // Idempotency: never record the same gateway payment twice.
    const duplicate = await prisma.payment.findFirst({
      where: { transactionReference: String(razorpayPaymentId) },
      select: { id: true },
    });
    if (duplicate) {
      res.status(409).json({ status: "error", message: "This payment has already been recorded." });
      return;
    }

    const alreadyPaid = invoice.payments.reduce((s, p) => s + Number(p.amount), 0);
    const outstanding = Number(invoice.totalAmount) - alreadyPaid;
    const payAmount = parseFloat(amount ?? String(outstanding));
    if (!Number.isFinite(payAmount) || payAmount <= 0) {
      res.status(400).json({ status: "error", message: "amount must be a positive number." });
      return;
    }
    if (payAmount > outstanding + 0.001) {
      res.status(400).json({
        status: "error",
        message: `amount exceeds the outstanding balance of ${outstanding.toFixed(2)}.`,
      });
      return;
    }

    // Record Payment
    const payment = await prisma.payment.create({
      data: {
        invoiceId,
        amount: payAmount,
        paymentMethod: "CARD",
        transactionReference: razorpayPaymentId,
      },
    });

    const totalPaid = alreadyPaid + payAmount;
    const newStatus = totalPaid >= Number(invoice.totalAmount) ? "PAID" : "PARTIAL";

    await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status: newStatus,
        ...(newStatus === "PAID" ? { paidAt: new Date() } : {}),
      },
    });

    logAudit({
      module: "invoices",
      action: "CREATE",
      entityId: payment.id,
      newValue: {
        amount: payAmount,
        paymentMethod: "RAZORPAY_ONLINE",
        transactionReference: razorpayPaymentId,
        invoiceStatus: newStatus,
      },
    }, req);

    res.json({
      status: "success",
      message: "Razorpay payment verified & invoice settled successfully!",
      paymentId: payment.id,
      invoiceStatus: newStatus,
    });
  } catch (err: any) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

export default router;
