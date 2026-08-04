import { prisma } from "../utils/prisma";
import { Router, Response } from "express";

import { authenticate, authorize, AuthRequest } from "../middleware/auth";
import {
  sendTeacherLectureAssignmentEmail,
  sendStudentScheduleUpdateEmail,
} from "../utils/email";

const router = Router();

const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

// ── Helper: dispatch notifications to teacher + all enrolled students ──────
async function dispatchScheduleNotifications(scheduleId: string, isUpdate = false) {
  try {
    const schedule = await prisma.schedule.findUnique({
      where: { id: scheduleId },
      include: {
        batch: {
          include: {
            teacher: {
              include: { user: true },
            },
            enrollments: {
              where: { status: "ACTIVE" },
              include: {
                student: {
                  include: { user: true },
                },
              },
            },
          },
        },
      },
    });

    if (!schedule) return;

    const { batch } = schedule;
    const dayName = DAY_NAMES[schedule.dayOfWeek] ?? `Day ${schedule.dayOfWeek}`;

    // ── 1. Notify Teacher ──────────────────────────────────────
    const teacherUser = batch.teacher?.user;
    if (teacherUser?.email) {
      const teacherName = `${teacherUser.firstName} ${teacherUser.lastName}`;
      await sendTeacherLectureAssignmentEmail(
        teacherUser.email,
        teacherName,
        batch.subject,
        batch.name,
        dayName,
        schedule.startTime,
        schedule.endTime,
        schedule.roomOrLink || "TBD",
        isUpdate
      ).catch((err: any) =>
        console.warn(`[email] Teacher notification failed: ${err.message}`)
      );
    }

    // ── 2. Notify All Enrolled Students ───────────────────────
    for (const enrollment of batch.enrollments) {
      const studentUser = enrollment.student?.user;
      if (studentUser?.email) {
        const studentName = `${studentUser.firstName} ${studentUser.lastName}`;
        await sendStudentScheduleUpdateEmail(
          studentUser.email,
          studentName,
          batch.subject,
          batch.name,
          dayName,
          schedule.startTime,
          schedule.endTime,
          schedule.roomOrLink || "TBD",
          isUpdate
        ).catch((err: any) =>
          console.warn(`[email] Student notification failed for ${studentUser.email}: ${err.message}`)
        );
      }
    }
  } catch (err: any) {
    console.warn(`[notify] dispatch error: ${err.message}`);
  }
}

// NOTE: Supabase DB stores dayOfWeek as 1–7 (Mon=1, Sun=7).
// Frontend uses 0–6 (Mon=0, Sun=6). We convert on read (db-1) and write (+1).

// ── GET /api/v1/schedules ─────────────────────────────────────────────────
// Returns all schedules with full batch + teacher + enrollment info
router.get("/", authenticate, async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const schedules = await prisma.schedule.findMany({
      include: {
        batch: {
          include: {
            teacher: {
              include: { user: { select: { firstName: true, lastName: true, email: true } } },
            },
            enrollments: { where: { status: "ACTIVE" } },
          },
        },
      },
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    });
    // Convert dayOfWeek from DB (1-7) to frontend (0-6)
    const mapped = schedules.map((s: any) => ({ ...s, dayOfWeek: s.dayOfWeek - 1 }));
    res.json({ status: "success", data: mapped });
  } catch (err: any) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

// ── POST /api/v1/schedules ────────────────────────────────────────────────
// Create a new schedule slot + dispatch notifications
router.post("/", authenticate, authorize("ADMIN"), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { batchId, dayOfWeek, startTime, endTime, roomOrLink } = req.body;

    if (!batchId || dayOfWeek === undefined || !startTime || !endTime) {
      res.status(400).json({ status: "error", message: "batchId, dayOfWeek, startTime and endTime are required." });
      return;
    }

    // Auto-create batch in Database if selecting a preset Grade batch that doesn't exist yet in PostgreSQL
    let targetBatchId = batchId;
    const existingBatch = await prisma.batch.findUnique({ where: { id: batchId } });
    if (!existingBatch) {
      let teacher = await prisma.teacher.findFirst();
      if (!teacher) {
        let user = await prisma.user.findFirst({ where: { role: "TEACHER" } });
        if (!user) {
          user = await prisma.user.create({
            data: {
              email: `teacher_${Date.now()}@ecrm.com`,
              passwordHash: "dummy",
              role: "TEACHER",
              firstName: "Admin",
              lastName: "Teacher"
            }
          });
        }
        teacher = await prisma.teacher.create({
          data: {
            userId: user.id,
            qualification: "M.Sc",
            hourlyRate: 50
          }
        });
      }
      const newBatch = await prisma.batch.create({
        data: {
          id: batchId.startsWith("sb-") ? undefined : batchId,
          name: req.body.batchName || "Grade Class",
          subject: req.body.subject || "General Studies",
          startDate: new Date(),
          endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          capacity: 40,
          teacherId: teacher.id,
          feeAmount: 500,
          feeFrequency: "MONTHLY"
        }
      });
      targetBatchId = newBatch.id;
    }

    // Frontend sends 0-6, DB expects 1-7
    const dbDayOfWeek = Number(dayOfWeek) + 1;
    const frontendDayIdx = Number(dayOfWeek);

    // Conflict check: same batch, day, time
    const existing = await prisma.schedule.findFirst({
      where: { dayOfWeek: dbDayOfWeek, startTime, batch: { id: targetBatchId } },
    });
    if (existing) {
      res.status(409).json({
        status: "error",
        message: `This batch already has a class at ${startTime} on ${DAY_NAMES[frontendDayIdx]}.`,
      });
      return;
    }

    // Conflict check: same room, day, time
    if (roomOrLink) {
      const roomConflict = await prisma.schedule.findFirst({
        where: { dayOfWeek: dbDayOfWeek, startTime, roomOrLink },
      });
      if (roomConflict) {
        res.status(409).json({
          status: "error",
          message: `Room "${roomOrLink}" is already booked at ${startTime} on ${DAY_NAMES[frontendDayIdx]}.`,
        });
        return;
      }
    }

    const schedule = await prisma.schedule.create({
      data: {
        batchId: targetBatchId,
        dayOfWeek: dbDayOfWeek,  // store as 1-7
        startTime,
        endTime,
        roomOrLink: roomOrLink || "",
      },
    });

    // Dispatch notifications async (don't block response)
    dispatchScheduleNotifications(schedule.id, false);

    res.status(201).json({ status: "success", data: schedule });
  } catch (err: any) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

// ── PUT /api/v1/schedules/:id ─────────────────────────────────────────────
// Update an existing schedule + dispatch updated notifications
router.put("/:id", authenticate, authorize("ADMIN"), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { dayOfWeek, startTime, endTime, roomOrLink, batchId } = req.body;

    // Frontend sends 0-6, convert to DB 1-7
    const dbDayOfWeek = dayOfWeek !== undefined ? Number(dayOfWeek) + 1 : undefined;
    const frontendDayIdx = dayOfWeek !== undefined ? Number(dayOfWeek) : 0;

    // Conflict check for room
    if (roomOrLink && dbDayOfWeek !== undefined && startTime) {
      const roomConflict = await prisma.schedule.findFirst({
        where: { dayOfWeek: dbDayOfWeek, startTime, roomOrLink, NOT: { id: req.params.id } },
      });
      if (roomConflict) {
        res.status(409).json({
          status: "error",
          message: `Room "${roomOrLink}" is already booked at ${startTime} on ${DAY_NAMES[frontendDayIdx]}.`,
        });
        return;
      }
    }

    const updateData: any = {};
    if (batchId !== undefined) updateData.batchId = batchId;
    if (dbDayOfWeek !== undefined) updateData.dayOfWeek = dbDayOfWeek;  // store as 1-7
    if (startTime !== undefined) updateData.startTime = startTime;
    if (endTime !== undefined) updateData.endTime = endTime;
    if (roomOrLink !== undefined) updateData.roomOrLink = roomOrLink;

    const schedule = await prisma.schedule.update({
      where: { id: req.params.id },
      data: updateData,
    });

    // Dispatch update notifications async
    dispatchScheduleNotifications(schedule.id, true);

    res.json({ status: "success", data: schedule });
  } catch (err: any) {
    if (err.code === "P2025") {
      res.status(404).json({ status: "error", message: "Schedule not found." });
    } else {
      res.status(500).json({ status: "error", message: err.message });
    }
  }
});

// ── DELETE /api/v1/schedules/:id ──────────────────────────────────────────
router.delete("/:id", authenticate, authorize("ADMIN"), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await prisma.schedule.delete({ where: { id: req.params.id } });
    res.json({ status: "success", message: "Schedule deleted." });
  } catch (err: any) {
    if (err.code === "P2025") {
      res.status(404).json({ status: "error", message: "Schedule not found." });
    } else {
      res.status(500).json({ status: "error", message: err.message });
    }
  }
});

// ── POST /api/v1/schedules/:id/notify ────────────────────────────────────
// Manually resend notifications for a schedule
router.post("/:id/notify", authenticate, authorize("ADMIN"), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const schedule = await prisma.schedule.findUnique({ where: { id: req.params.id } });
    if (!schedule) {
      res.status(404).json({ status: "error", message: "Schedule not found." });
      return;
    }
    dispatchScheduleNotifications(schedule.id, true);
    res.json({ status: "success", message: "Notifications dispatched to teacher and enrolled students." });
  } catch (err: any) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

export default router;
