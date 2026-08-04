import { prisma } from "../utils/prisma";
import { Router, Response } from "express";

import { authenticate, authorize, AuthRequest } from "../middleware/auth";

const router = Router();

// GET /api/v1/reports/overview — master dashboard stats
router.get("/overview", authenticate, authorize("ADMIN"), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [students, staff, batches, invoices, attendance, leads, homework] = await Promise.all([
      prisma.student.count(),
      prisma.user.count({ where: { role: { in: ["ADMIN", "TEACHER"] } } }),
      prisma.batch.count(),
      prisma.invoice.findMany({ select: { totalAmount: true, status: true, payments: { select: { amount: true } } } }),
      prisma.attendance.groupBy({ by: ["status"], _count: { id: true } }),
      prisma.lead.groupBy({ by: ["status"], _count: { id: true } }),
      prisma.homework.count({ where: { status: "ACTIVE" } }),
    ]);

    const totalBilled = invoices.reduce((s, i) => s + Number(i.totalAmount), 0);
    const totalCollected = invoices.reduce((s, i) => s + i.payments.reduce((ps, p) => ps + Number(p.amount), 0), 0);
    const outstanding = totalBilled - totalCollected;

    const attMap: Record<string, number> = {};
    for (const a of attendance) attMap[a.status] = a._count.id;
    const totalAtt = Object.values(attMap).reduce((s, v) => s + v, 0);
    const presentAtt = (attMap["PRESENT"] || 0) + (attMap["LATE"] || 0);
    const avgAttendance = totalAtt > 0 ? Math.round((presentAtt / totalAtt) * 100) : 0;

    const leadPipeline: Record<string, number> = {};
    for (const l of leads) leadPipeline[l.status] = l._count.id;

    res.json({
      status: "success",
      data: {
        students, staff, batches, homework,
        finance: { totalBilled, totalCollected, outstanding, collectionRate: totalBilled > 0 ? Math.round((totalCollected / totalBilled) * 100) : 0 },
        attendance: { avgAttendance, totalRecords: totalAtt, present: attMap["PRESENT"] || 0, absent: attMap["ABSENT"] || 0, late: attMap["LATE"] || 0 },
        leads: { total: Object.values(leadPipeline).reduce((s, v) => s + v, 0), pipeline: leadPipeline },
      },
    });
  } catch (err: any) { res.status(500).json({ status: "error", message: err.message }); }
});

// GET /api/v1/reports/attendance — attendance analytics
router.get("/attendance", authenticate, authorize("ADMIN", "TEACHER"), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { batch_id, days = "30" } = req.query as any;
    const since = new Date();
    since.setDate(since.getDate() - parseInt(days));

    const where: any = { classDate: { gte: since } };
    if (batch_id) where.schedule = { batchId: batch_id };

    const records = await prisma.attendance.findMany({ where, select: { status: true, classDate: true } });

    // Daily breakdown
    const daily: Record<string, { present: number; absent: number; late: number; total: number }> = {};
    for (const r of records) {
      const day = new Date(r.classDate).toISOString().split("T")[0];
      if (!daily[day]) daily[day] = { present: 0, absent: 0, late: 0, total: 0 };
      daily[day].total++;
      if (r.status === "PRESENT") daily[day].present++;
      else if (r.status === "ABSENT") daily[day].absent++;
      else if (r.status === "LATE") daily[day].late++;
    }

    res.json({ status: "success", data: { daily, totalRecords: records.length } });
  } catch (err: any) { res.status(500).json({ status: "error", message: err.message }); }
});

// GET /api/v1/reports/finance — revenue analytics
router.get("/finance", authenticate, authorize("ADMIN"), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const invoices = await prisma.invoice.findMany({
      include: { payments: true, student: { include: { user: { select: { firstName: true, lastName: true } } } } },
      orderBy: { dueDate: "desc" },
    });

    const monthly: Record<string, { billed: number; collected: number }> = {};
    for (const inv of invoices) {
      const month = new Date(inv.dueDate).toISOString().substring(0, 7); // YYYY-MM
      if (!monthly[month]) monthly[month] = { billed: 0, collected: 0 };
      monthly[month].billed += Number(inv.totalAmount);
      monthly[month].collected += inv.payments.reduce((s, p) => s + Number(p.amount), 0);
    }

    const unpaid = invoices.filter((i) => i.status === "UNPAID");
    const overdue = unpaid.filter((i) => new Date(i.dueDate) < new Date());

    res.json({
      status: "success",
      data: {
        monthly,
        totalInvoices: invoices.length,
        unpaidCount: unpaid.length,
        overdueCount: overdue.length,
        overdueAmount: overdue.reduce((s, i) => s + Number(i.totalAmount), 0),
      },
    });
  } catch (err: any) { res.status(500).json({ status: "error", message: err.message }); }
});

export default router;
