import { prisma } from "../utils/prisma";
import { logAudit } from "../utils/auditLog";
import { Router, Response } from "express";
import { authenticate, authorize, AuthRequest } from "../middleware/auth";
import { io } from "../server";
import { notifyBatch } from "../utils/notify";

const router = Router();

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
    const where: any = { student: { deletedAt: null } };
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
router.get("/session", authenticate, authorize("ADMIN", "TEACHER"), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { batch_id, date } = req.query as any;
    if (!batch_id || !date) {
      res.status(400).json({ status: "error", message: "batch_id and date required." });
      return;
    }

    const classDate = new Date(date);

    // Get the batch with its schedule and enrolled students
    let batch = await prisma.batch.findUnique({
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

    // Auto-create a Schedule if batch doesn't have one yet
    let scheduleId = batch.schedules[0]?.id;
    if (!scheduleId) {
      const newSchedule = await prisma.schedule.create({
        data: {
          batchId: batch.id,
          dayOfWeek: 1,
          startTime: "09:00",
          endTime: "10:00",
          roomOrLink: "Classroom A",
        },
      });
      scheduleId = newSchedule.id;
    }

    // If batch has no enrollments yet, auto-enroll active students into this batch
    let enrollments = batch.enrollments;
    if (enrollments.length === 0) {
      const allStudents = await prisma.student.findMany({
        where: { deletedAt: null },
        include: {
          user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
        },
      });

      if (allStudents.length > 0) {
        // Create active enrollments for these students
        await prisma.batchEnrollment.createMany({
          data: allStudents.map((s) => ({
            studentId: s.id,
            batchId: batch.id,
            status: "ACTIVE",
          })),
          skipDuplicates: true,
        });

        // Re-fetch batch enrollments
        enrollments = allStudents.map((s) => ({
          id: `auto-${s.id}`,
          studentId: s.id,
          batchId: batch.id,
          enrolledAt: new Date(),
          status: "ACTIVE",
          student: s,
        })) as any;
      }
    }

    // Load any existing attendance records for this session
    const existingRecords = await prisma.attendance.findMany({
      where: { scheduleId, classDate },
      include: {
        markedBy: { select: { firstName: true, lastName: true, email: true } },
      },
    });

    const attendanceMap = new Map(existingRecords.map((r) => [r.studentId, r]));

    // Calculate average attendance % per student across all sessions
    const attendanceStats = await prisma.attendance.groupBy({
      by: ["studentId"],
      where: {
        schedule: { batchId: batch_id },
        studentId: { in: enrollments.map((e) => e.studentId) },
      },
      _count: { id: true },
    });
    const presentStats = await prisma.attendance.groupBy({
      by: ["studentId"],
      where: {
        schedule: { batchId: batch_id },
        studentId: { in: enrollments.map((e) => e.studentId) },
        status: "PRESENT",
      },
      _count: { id: true },
    });

    const totalMap = new Map(attendanceStats.map((s) => [s.studentId, s._count.id]));
    const presentMap = new Map(presentStats.map((s) => [s.studentId, s._count.id]));

    const students = enrollments.map((e) => {
      const att = attendanceMap.get(e.studentId);
      const total = totalMap.get(e.studentId) || 0;
      const present = presentMap.get(e.studentId) || 0;
      const rate = total > 0 ? Math.round((present / total) * 100) : null;

      const u = e.student?.user;
      return {
        id: e.studentId,
        name: u ? `${u.firstName} ${u.lastName}` : "Student",
        initials: u && u.firstName && u.lastName
          ? `${u.firstName[0]}${u.lastName[0]}`.toUpperCase()
          : "ST",
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

// ── GET /api/v1/attendance/my-summary ─────────────────────────────────
// The logged-in student's own attendance breakdown (for dashboard donut)
router.get("/my-summary", authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const student = await prisma.student.findFirst({ where: { userId: req.user!.id } });
    if (!student) {
      res.json({ status: "success", data: { present: 0, absent: 0, late: 0, total: 0, percentage: 0 } });
      return;
    }
    const records = await prisma.attendance.findMany({ where: { studentId: student.id } });
    const present = records.filter((r) => r.status === "PRESENT").length;
    const late = records.filter((r) => r.status === "LATE").length;
    const absent = records.filter((r) => r.status === "ABSENT").length;
    const total = records.length;
    const percentage = total > 0 ? Math.round(((present + late) / total) * 10000) / 100 : 0;
    res.json({ status: "success", data: { present, absent, late, total, percentage } });
  } catch (err: any) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

// ── GET /api/v1/attendance/summary?student_id=&batch_id= ──────────────
// Subject/batch-wise attendance summary (Total / Present / Absent / %)
router.get("/summary", authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { student_id, batch_id } = req.query as any;

    // Build the attendance filter
    const where: any = {};
    if (student_id) where.studentId = student_id;
    if (batch_id) where.schedule = { batchId: batch_id };

    // Enforce student scoping: STUDENT/PARENT can only see their own attendance.
    const sumRole = req.user?.role;
    if (sumRole === "STUDENT" || sumRole === "PARENT") {
      const self = await prisma.student.findFirst({ where: { userId: req.user!.id } });
      if (!self) { res.json({ status: "success", data: [] }); return; }
      where.studentId = self.id;
    }

    const records = await prisma.attendance.findMany({
      where,
      include: {
        schedule: {
          include: {
            batch: {
              include: { teacher: { include: { user: { select: { firstName: true, lastName: true } } } } },
            },
          },
        },
      },
    });

    // Group by batch (each batch = one subject + one teacher in this model)
    const map = new Map<string, {
      batchId: string; subjectName: string; teacherName: string;
      total: number; present: number; absent: number; late: number;
    }>();

    for (const r of records) {
      const batch = r.schedule?.batch;
      if (!batch) continue;
      const key = batch.id;
      if (!map.has(key)) {
        const t = batch.teacher?.user;
        map.set(key, {
          batchId: batch.id,
          subjectName: batch.subject,
          teacherName: t ? `${t.firstName} ${t.lastName}`.trim() : "—",
          total: 0, present: 0, absent: 0, late: 0,
        });
      }
      const row = map.get(key)!;
      row.total += 1;
      if (r.status === "PRESENT") row.present += 1;
      else if (r.status === "ABSENT") row.absent += 1;
      else if (r.status === "LATE") row.late += 1;
    }

    const rows = Array.from(map.values()).map((r) => ({
      ...r,
      // count LATE as present for percentage
      percentage: r.total > 0 ? Math.round(((r.present + r.late) / r.total) * 10000) / 100 : 0,
    }));

    const grandTotal = rows.reduce((s, r) => s + r.total, 0);
    const grandPresent = rows.reduce((s, r) => s + r.present + r.late, 0);
    const overallPercentage = grandTotal > 0 ? Math.round((grandPresent / grandTotal) * 10000) / 100 : 0;

    res.json({ status: "success", data: { rows, overallPercentage, totalLectures: grandTotal } });
  } catch (err: any) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

// ── GET /api/v1/attendance/range?student_id=&batch_id=&from=&to= ──────
// Datewise attendance details between two dates
router.get("/range", authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { student_id, batch_id, from, to } = req.query as any;
    if (!from || !to) {
      res.status(400).json({ status: "error", message: "from and to dates are required." });
      return;
    }
    const where: any = {
      classDate: { gte: new Date(from), lte: new Date(to) },
    };
    if (student_id) where.studentId = student_id;
    if (batch_id) where.schedule = { batchId: batch_id };

    // Enforce student scoping: STUDENT/PARENT can only see their own attendance.
    const rangeRole = req.user?.role;
    if (rangeRole === "STUDENT" || rangeRole === "PARENT") {
      const self = await prisma.student.findFirst({ where: { userId: req.user!.id } });
      if (!self) { res.json({ status: "success", data: [] }); return; }
      where.studentId = self.id;
    }

    const records = await prisma.attendance.findMany({
      where,
      include: {
        student: { include: { user: { select: { firstName: true, lastName: true } } } },
        schedule: { include: { batch: { select: { name: true, subject: true } } } },
      },
      orderBy: { classDate: "desc" },
    });

    const data = records.map((r) => ({
      id: r.id,
      date: r.classDate,
      studentName: r.student?.user ? `${r.student.user.firstName} ${r.student.user.lastName}`.trim() : "—",
      batchName: r.schedule?.batch?.name || "—",
      subject: r.schedule?.batch?.subject || "—",
      status: r.status,
      remarks: r.remarks || "",
    }));

    res.json({ status: "success", data });
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

      // In-app notification to the batch (students + teacher)
      const dateLabel = new Date(class_date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
      notifyBatch(schedule.batchId, {
        title: "Attendance Marked",
        message: `Attendance has been recorded for ${dateLabel}.`,
        type: "ATTENDANCE",
        priority: "NORMAL",
        link: "/attendance",
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

    for (const batchId of batchIdsUpdated) {
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
