import { Router, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { authenticate, authorize, AuthRequest } from "../middleware/auth";
import { io } from "../server";

const router = Router();
const prisma = new PrismaClient();

// ── Helper: emit attendance update to all clients watching this batch ──
function emitAttendanceUpdate(batchId: string, payload: object) {
  io.to(`batch_${batchId}`).emit("attendance_updated", {
    batchId,
    timestamp: new Date().toISOString(),
    ...payload,
  });
}

// ── GET /api/v1/attendance?batch_id=&date= ────────────────────────────
router.get("/", authenticate, authorize("ADMIN", "TEACHER"), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { batch_id, date } = req.query as any;
    const where: any = {};
    if (date) where.classDate = new Date(date);
    if (batch_id) where.schedule = { batchId: batch_id };

    const records = await prisma.attendance.findMany({
      where,
      include: {
        student: {
          include: {
            user: { select: { firstName: true, lastName: true, email: true } },
          },
        },
        schedule: { include: { batch: true } },
      },
      orderBy: { classDate: "desc" },
    });
    res.json({ status: "success", data: records });
  } catch (err: any) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

// ── GET /api/v1/attendance/session?batch_id=&date= ───────────────────
// Returns full student roster with attendance status for a given batch+date
// Used by both the web dashboard and the mobile app to load the session.
router.get("/session", authenticate, authorize("ADMIN", "TEACHER"), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { batch_id, date } = req.query as any;
    if (!batch_id || !date) {
      res.status(400).json({ status: "error", message: "batch_id and date required." });
      return;
    }

    const classDate = new Date(date);

    // Get the batch with its schedule and enrolled students
    const batch = await prisma.batch.findUnique({
      where: { id: batch_id },
      include: {
        schedules: { take: 1 },
        enrollments: {
          where: { status: "ACTIVE" },
          include: {
            student: {
              include: {
                user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
              },
            },
          },
        },
      },
    });

    if (!batch) {
      res.status(404).json({ status: "error", message: "Batch not found." });
      return;
    }

    const scheduleId = batch.schedules[0]?.id;

    // Load any existing attendance records for this session
    const existingRecords = scheduleId
      ? await prisma.attendance.findMany({
          where: { scheduleId, classDate },
          include: {
            markedBy: { select: { firstName: true, lastName: true, email: true } },
          },
        })
      : [];

    const attendanceMap = new Map(existingRecords.map((r) => [r.studentId, r]));

    // Calculate average attendance % per student across all sessions
    const attendanceStats = await prisma.attendance.groupBy({
      by: ["studentId"],
      where: {
        schedule: { batchId: batch_id },
        studentId: { in: batch.enrollments.map((e) => e.studentId) },
      },
      _count: { id: true },
    });
    const presentStats = await prisma.attendance.groupBy({
      by: ["studentId"],
      where: {
        schedule: { batchId: batch_id },
        studentId: { in: batch.enrollments.map((e) => e.studentId) },
        status: "PRESENT",
      },
      _count: { id: true },
    });

    const totalMap = new Map(attendanceStats.map((s) => [s.studentId, s._count.id]));
    const presentMap = new Map(presentStats.map((s) => [s.studentId, s._count.id]));

    const students = batch.enrollments.map((e) => {
      const att = attendanceMap.get(e.studentId);
      const total = totalMap.get(e.studentId) || 0;
      const present = presentMap.get(e.studentId) || 0;
      const rate = total > 0 ? Math.round((present / total) * 100) : null;

      const u = e.student.user;
      return {
        id: e.studentId,
        name: u ? `${u.firstName} ${u.lastName}` : "Unknown",
        initials: u
          ? `${u.firstName[0]}${u.lastName[0]}`.toUpperCase()
          : "?",
        email: u?.email || "",
        phone: u?.phone || "",
        attendanceRate: rate !== null ? `${rate}%` : "N/A",
        status: att?.status ?? null,       // null = not marked yet
        remarks: att?.remarks ?? "",
        markedBy: att?.markedBy
          ? `${att.markedBy.firstName} ${att.markedBy.lastName}`
          : null,
        markedAt: att?.recordedAt ?? null,
      };
    });

    res.json({
      status: "success",
      data: {
        batchId: batch.id,
        batchName: batch.name,
        subject: batch.subject,
        scheduleId,
        sessionDate: date,
        students,
        summary: {
          total: students.length,
          present: students.filter((s) => s.status === "PRESENT").length,
          absent: students.filter((s) => s.status === "ABSENT").length,
          late: students.filter((s) => s.status === "LATE").length,
          unmarked: students.filter((s) => s.status === null).length,
        },
      },
    });
  } catch (err: any) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

// ── POST /api/v1/attendance — bulk submit (web dashboard) ─────────────
router.post("/", authenticate, authorize("ADMIN", "TEACHER"), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { schedule_id, class_date, records } = req.body;
    if (!schedule_id || !class_date || !records?.length) {
      res.status(400).json({ status: "error", message: "schedule_id, class_date and records required." });
      return;
    }

    const markedById = req.user!.id;
    const classDate = new Date(class_date);

    const upserts = records.map((r: any) =>
      prisma.attendance.upsert({
        where: {
          scheduleId_studentId_classDate: {
            scheduleId: schedule_id,
            studentId: r.student_id,
            classDate,
          },
        },
        create: {
          scheduleId: schedule_id,
          studentId: r.student_id,
          classDate,
          status: r.status,
          remarks: r.remarks || "",
          markedById,
        },
        update: {
          status: r.status,
          remarks: r.remarks || "",
          markedById,
          recordedAt: new Date(),
        },
      })
    );

    await Promise.all(upserts);

    // Look up the batchId so we can notify the right room
    const schedule = await prisma.schedule.findUnique({
      where: { id: schedule_id },
      select: { batchId: true },
    });

    if (schedule) {
      emitAttendanceUpdate(schedule.batchId, {
        scheduleId: schedule_id,
        classDate: class_date,
        records: records.map((r: any) => ({
          studentId: r.student_id,
          status: r.status,
          remarks: r.remarks || "",
        })),
        source: "web",
        markedById,
      });
    }

    const absentCount = records.filter((r: any) => r.status === "ABSENT").length;
    res.json({
      status: "success",
      message: `${records.length} records saved. ${absentCount} absence alert(s) queued.`,
    });
  } catch (err: any) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

// ── POST /api/v1/attendance/mark — single student mark (mobile app) ───
// Mobile devices call this endpoint to mark one student at a time.
// The server saves it and instantly broadcasts to the web dashboard.
router.post("/mark", authenticate, authorize("ADMIN", "TEACHER"), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { schedule_id, student_id, class_date, status, remarks } = req.body;

    if (!schedule_id || !student_id || !class_date || !status) {
      res.status(400).json({ status: "error", message: "schedule_id, student_id, class_date and status required." });
      return;
    }

    const validStatuses = ["PRESENT", "ABSENT", "LATE"];
    if (!validStatuses.includes(status)) {
      res.status(400).json({ status: "error", message: `status must be one of: ${validStatuses.join(", ")}` });
      return;
    }

    const markedById = req.user!.id;
    const classDate = new Date(class_date);

    const record = await prisma.attendance.upsert({
      where: {
        scheduleId_studentId_classDate: {
          scheduleId: schedule_id,
          studentId: student_id,
          classDate,
        },
      },
      create: {
        scheduleId: schedule_id,
        studentId: student_id,
        classDate,
        status,
        remarks: remarks || "",
        markedById,
      },
      update: {
        status,
        remarks: remarks || "",
        markedById,
        recordedAt: new Date(),
      },
      include: {
        student: {
          include: {
            user: { select: { firstName: true, lastName: true, email: true } },
          },
        },
        schedule: { select: { batchId: true } },
        markedBy: { select: { firstName: true, lastName: true } },
      },
    });

    // Broadcast single-student update in real time
    emitAttendanceUpdate(record.schedule.batchId, {
      scheduleId: schedule_id,
      classDate: class_date,
      records: [{ studentId: student_id, status, remarks: remarks || "" }],
      source: "mobile",
      markedBy: `${record.markedBy.firstName} ${record.markedBy.lastName}`,
      markedById,
    });

    res.json({
      status: "success",
      message: "Attendance marked successfully.",
      data: {
        studentId: student_id,
        studentName: record.student.user
          ? `${record.student.user.firstName} ${record.student.user.lastName}`
          : "Unknown",
        status,
        classDate: class_date,
        markedAt: record.recordedAt,
      },
    });
  } catch (err: any) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

// ── POST /api/v1/attendance/sync — offline batch sync (mobile) ────────
// Mobile apps queue records offline and flush them when back online.
router.post("/sync", authenticate, authorize("ADMIN", "TEACHER"), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { records } = req.body;
    const markedById = req.user!.id;
    const results: string[] = [];
    const failed: any[] = [];
    const batchIdsUpdated = new Set<string>();

    for (const r of records) {
      try {
        const record = await prisma.attendance.upsert({
          where: {
            scheduleId_studentId_classDate: {
              scheduleId: r.schedule_id,
              studentId: r.student_id,
              classDate: new Date(r.class_date),
            },
          },
          create: {
            scheduleId: r.schedule_id,
            studentId: r.student_id,
            classDate: new Date(r.class_date),
            status: r.status,
            remarks: r.remarks || "",
            markedById,
          },
          update: {
            status: r.status,
            remarks: r.remarks || "",
            recordedAt: new Date(),
          },
          include: { schedule: { select: { batchId: true } } },
        });
        results.push(r.student_id);
        batchIdsUpdated.add(record.schedule.batchId);
      } catch (e: any) {
        failed.push({ id: r.student_id, error: e.message });
      }
    }

    // Emit one consolidated update per affected batch
    for (const batchId of batchIdsUpdated) {
      const batchRecords = records.filter(async (r: any) => {
        const s = await prisma.schedule.findUnique({ where: { id: r.schedule_id }, select: { batchId: true } });
        return s?.batchId === batchId;
      });
      emitAttendanceUpdate(batchId, {
        records: records
          .filter((r: any) => results.includes(r.student_id))
          .map((r: any) => ({ studentId: r.student_id, status: r.status, classDate: r.class_date })),
        source: "mobile_sync",
        markedById,
      });
    }

    res.json({ status: "success", synced: results.length, failed });
  } catch (err: any) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

export default router;
