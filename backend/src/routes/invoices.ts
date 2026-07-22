import { Router, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { authenticate, authorize, AuthRequest } from "../middleware/auth";

const router = Router();
const prisma = new PrismaClient();

// GET /api/v1/invoices
router.get("/", authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const where: any = {};
    if (req.user?.role === "STUDENT" || req.user?.role === "PARENT") {
      const student = await prisma.student.findFirst({ where: { userId: req.user.id } });
      if (student) where.studentId = student.id;
    }
    const invoices = await prisma.invoice.findMany({
      where,
      include: { student: { include: { user: { select: { firstName: true, lastName: true, email: true } } } }, payments: true },
      orderBy: { dueDate: "desc" },
    });
    res.json({ status: "success", data: invoices });
  } catch (err: any) { res.status(500).json({ status: "error", message: err.message }); }
});

// POST /api/v1/invoices
router.post("/", authenticate, authorize("ADMIN"), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { studentId, totalAmount, dueDate } = req.body;
    if (!studentId || !totalAmount || !dueDate) {
      res.status(400).json({ status: "error", message: "studentId, totalAmount, dueDate required." }); return;
    }
    const invoice = await prisma.invoice.create({
      data: { studentId, totalAmount: parseFloat(totalAmount), dueDate: new Date(dueDate), status: "UNPAID" },
    });
    res.status(201).json({ status: "success", data: invoice });
  } catch (err: any) { res.status(500).json({ status: "error", message: err.message }); }
});

// PATCH /api/v1/invoices/:id
router.patch("/:id", authenticate, authorize("ADMIN"), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const invoice = await prisma.invoice.update({ where: { id: req.params.id }, data: req.body });
    res.json({ status: "success", data: invoice });
  } catch (err: any) { res.status(500).json({ status: "error", message: err.message }); }
});

// POST /api/v1/invoices/:id/pay — record offline payment
router.post("/:id/pay", authenticate, authorize("ADMIN"), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { amount, paymentMethod, transactionReference } = req.body;
    const payment = await prisma.payment.create({
      data: { invoiceId: req.params.id, amount: parseFloat(amount), paymentMethod: paymentMethod || "CASH", transactionReference },
    });
    const invoice = await prisma.invoice.findUnique({ where: { id: req.params.id }, include: { payments: true } });
    const totalPaid = invoice!.payments.reduce((s, p) => s + Number(p.amount), 0);
    const newStatus = totalPaid >= Number(invoice!.totalAmount) ? "PAID" : totalPaid > 0 ? "PARTIAL" : "UNPAID";
    await prisma.invoice.update({ where: { id: req.params.id }, data: { status: newStatus, ...(newStatus === "PAID" ? { paidAt: new Date() } : {}) } });
    res.json({ status: "success", data: payment, invoiceStatus: newStatus });
  } catch (err: any) { res.status(500).json({ status: "error", message: err.message }); }
});

export default router;
