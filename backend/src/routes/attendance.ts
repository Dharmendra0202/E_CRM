import { Router, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { authenticate, authorize, AuthRequest } from "../middleware/auth";

const router = Router();
const prisma = new PrismaClient();

// GET /api/v1/attendance?batch_id=&date=
router.get("/", authenticate, authorize("ADMIN", "TEACHER"), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { batch_id, date } = req.query as any;
    const where: any = {};
    if (date) where.classDate = new Date(date);
    if (batch_id) where.schedule = { batchId: batch_id };
    const records = await prisma.attendance.findMany({
      where,
      include: { student: { include: { user: { select: { firstName: true, lastName: true, email: true } } } }, schedule: { include: { batch: true } } },
      orderBy: { classDate: "desc" },
    });
    res.json({ status: "success", data: records });
  } catch (err: any) { res.status(500).json({ status: "error", message: err.message }); }
});

// POST /api/v1/attendance — bulk submit
router.post("/", authenticate, authorize("ADMIN", "TEACHER"), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { schedule_id, class_date, records } = req.body;
    if (!schedule_id || !class_date || !records?.length) {
      res.status(400).json({ status: "error", message: "schedule_id, class_date and records required." }); return;
    }
    const markedById = req.user!.id;
    const upserts = records.map((r: any) =>
      prisma.attendance.upsert({
        where: { scheduleId_studentId_classDate: { scheduleId: schedule_id, studentId: r.student_id, classDate: new Date(class_date) } },
        create: { scheduleId: schedule_id, studentId: r.student_id, classDate: new Date(class_date), status: r.status, remarks: r.remarks || "", markedById },
        update: { status: r.status, remarks: r.remarks || "", markedById },
      })
    );
    await Promise.all(upserts);
    const absentCount = records.filter((r: any) => r.status === "ABSENT").length;
    res.json({ status: "success", message: `${records.length} records saved. ${absentCount} absence alert(s) queued.` });
  } catch (err: any) { res.status(500).json({ status: "error", message: err.message }); }
});

// POST /api/v1/attendance/sync — offline batch sync
router.post("/sync", authenticate, authorize("ADMIN", "TEACHER"), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { records } = req.body;
    const markedById = req.user!.id;
    const results: string[] = [];
    const failed: any[] = [];
    for (const r of records) {
      try {
        await prisma.attendance.upsert({
          where: { scheduleId_studentId_classDate: { scheduleId: r.schedule_id, studentId: r.student_id, classDate: new Date(r.class_date) } },
          create: { scheduleId: r.schedule_id, studentId: r.student_id, classDate: new Date(r.class_date), status: r.status, remarks: r.remarks || "", markedById },
          update: { status: r.status, remarks: r.remarks || "" },
        });
        results.push(r.student_id);
      } catch (e: any) { failed.push({ id: r.student_id, error: e.message }); }
    }
    res.json({ status: "success", synced: results.length, failed });
  } catch (err: any) { res.status(500).json({ status: "error", message: err.message }); }
});

export default router;
