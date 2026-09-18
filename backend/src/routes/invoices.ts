import { prisma } from "../utils/prisma";
import { Router, Response } from "express";
import { authenticate, authorize, AuthRequest } from "../middleware/auth";
import { logAudit } from "../utils/auditLog";
import { notifyStudent, notifyAdmins } from "../utils/notify";

const router = Router();

// Valid status transitions for fee approval workflow
const VALID_TRANSITIONS: Record<string, string[]> = {
  UNPAID: ["VERIFIED"],
  VERIFIED: ["APPROVED", "UNPAID"], // can reject back to UNPAID
  APPROVED: ["PAID", "VERIFIED"],   // can reject back to VERIFIED
  PARTIAL: ["PAID"],
  PAID: [], // terminal state
};

// GET /api/v1/invoices
router.get("/", authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const where: any = { student: { deletedAt: null } };
    if (req.user?.role === "STUDENT" || req.user?.role === "PARENT") {
      const student = await prisma.student.findFirst({ where: { userId: req.user.id } });
      // If a student/parent has no linked Student record, they must see NOTHING
      // (never fall through to the unfiltered all-invoices query).
      if (!student) { res.json({ status: "success", data: [] }); return; }
      where.studentId = student.id;
    }
    const invoices = await prisma.invoice.findMany({
      where,
      include: { student: { include: { user: { select: { firstName: true, lastName: true, email: true } } } }, payments: true },
      orderBy: { dueDate: "desc" },
    });
    res.json({ status: "success", data: invoices });
  } catch (err: any) { res.status(500).json({ status: "error", message: err.message }); }
});

// POST /api/v1/invoices — create invoice
router.post("/", authenticate, authorize("ADMIN", "SUPER_ADMIN", "BILLING", "STAFF", "TEACHER"), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { studentId, totalAmount, dueDate } = req.body;
    if (!studentId || !totalAmount || !dueDate) {
      res.status(400).json({ status: "error", message: "studentId, totalAmount, dueDate required." }); return;
    }
    const invoice = await prisma.invoice.create({
      data: { studentId, totalAmount: parseFloat(totalAmount), dueDate: new Date(dueDate), status: "UNPAID" },
    });
    logAudit({ module: "invoices", action: "CREATE", entityId: invoice.id, newValue: { studentId, totalAmount, dueDate } }, req);
    res.status(201).json({ status: "success", data: invoice });
  } catch (err: any) { res.status(500).json({ status: "error", message: err.message }); }
});

// PATCH /api/v1/invoices/:id — general update
router.patch("/:id", authenticate, authorize("ADMIN"), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const prev = await prisma.invoice.findUnique({ where: { id: req.params.id } });
    const invoice = await prisma.invoice.update({ where: { id: req.params.id }, data: req.body });
    logAudit({ module: "invoices", action: "UPDATE", entityId: invoice.id, previousValue: { status: prev?.status }, newValue: req.body }, req);
    res.json({ status: "success", data: invoice });
  } catch (err: any) { res.status(500).json({ status: "error", message: err.message }); }
});

// POST /api/v1/invoices/:id/approve — advance status in approval workflow
router.post("/:id/approve", authenticate, authorize("ADMIN"), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { newStatus, reason } = req.body;
    if (!newStatus) { res.status(400).json({ status: "error", message: "newStatus is required." }); return; }

    const invoice = await prisma.invoice.findUnique({ where: { id: req.params.id } });
    if (!invoice) { res.status(404).json({ status: "error", message: "Invoice not found." }); return; }

    // Validate transition
    const allowed = VALID_TRANSITIONS[invoice.status] || [];
    if (!allowed.includes(newStatus)) {
      res.status(400).json({
        status: "error",
        message: `Invalid transition: ${invoice.status} → ${newStatus}. Allowed: ${allowed.join(", ") || "none (terminal state)"}`,
      });
      return;
    }

    const updated = await prisma.invoice.update({
      where: { id: req.params.id },
      data: { status: newStatus, ...(newStatus === "PAID" ? { paidAt: new Date() } : {}) },
    });

    const action = ["UNPAID", "VERIFIED"].includes(newStatus) ? "REJECT" : "APPROVE";
    logAudit({
      module: "invoices",
      action,
      entityId: invoice.id,
      previousValue: { status: invoice.status },
      newValue: { status: newStatus, reason },
    }, req);

    res.json({ status: "success", data: updated, transition: `${invoice.status} → ${newStatus}` });
  } catch (err: any) { res.status(500).json({ status: "error", message: err.message }); }
});

// POST /api/v1/invoices/:id/pay — record payment (only allowed when APPROVED or PARTIAL)
router.post("/:id/pay", authenticate, authorize("ADMIN"), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const invoice = await prisma.invoice.findUnique({ where: { id: req.params.id }, include: { payments: true } });
    if (!invoice) { res.status(404).json({ status: "error", message: "Invoice not found." }); return; }

    // Payment only allowed on APPROVED or PARTIAL invoices
    if (!["APPROVED", "PARTIAL", "UNPAID"].includes(invoice.status)) {
      res.status(400).json({ status: "error", message: `Cannot record payment on invoice with status "${invoice.status}". Must be APPROVED or PARTIAL.` });
      return;
    }

    const { amount, paymentMethod, transactionReference } = req.body;
    if (!amount) { res.status(400).json({ status: "error", message: "amount is required." }); return; }

    const payment = await prisma.payment.create({
      data: { invoiceId: req.params.id, amount: parseFloat(amount), paymentMethod: paymentMethod || "CASH", transactionReference: transactionReference || null },
    });

    const totalPaid = invoice.payments.reduce((s, p) => s + Number(p.amount), 0) + parseFloat(amount);
    const newStatus = totalPaid >= Number(invoice.totalAmount) ? "PAID" : "PARTIAL";
    await prisma.invoice.update({ where: { id: req.params.id }, data: { status: newStatus, ...(newStatus === "PAID" ? { paidAt: new Date() } : {}) } });

    logAudit({ module: "invoices", action: "CREATE", entityId: payment.id, newValue: { amount, paymentMethod, invoiceId: req.params.id, resultStatus: newStatus } }, req);

    // ── Notify the student (payment received) + admins (fee collected) ──
    const paidAmt = Number(parseFloat(amount)).toLocaleString("en-IN");
    const remaining = Math.max(0, Number(invoice.totalAmount) - totalPaid);
    notifyStudent(invoice.studentId, {
      title: "Payment Received",
      message: `We received your fee payment of ₹${paidAmt}.${newStatus === "PAID" ? " Your fees are fully paid. Thank you!" : ` Remaining balance: ₹${remaining.toLocaleString("en-IN")}.`}`,
      type: "FEE",
      priority: "NORMAL",
      link: "/fee-receipt",
    });
    notifyAdmins({
      title: "Fee Payment Recorded",
      message: `₹${paidAmt} received (${paymentMethod || "CASH"}). Invoice is now ${newStatus}.`,
      type: "FEE",
      priority: "LOW",
      link: "/billing",
    });

    res.json({ status: "success", data: payment, invoiceStatus: newStatus });
  } catch (err: any) { res.status(500).json({ status: "error", message: err.message }); }
});

export default router;
