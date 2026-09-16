import { prisma } from "../utils/prisma";
import { Router, Response } from "express";

import { authenticate, authorize, AuthRequest } from "../middleware/auth";
import {
  sendTeacherLectureAssignmentEmail,
  sendStudentScheduleUpdateEmail,
} from "../utils/email";
import { notifyBatch } from "../utils/notify";

const router = Router();

const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

// Parse a time string like "07:30 AM" / "07:30" (24h) into minutes from midnight.
function toMinutes(t: string): number {
  if (!t) return -1;
  const m = t.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!m) return -1;
  let h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  const ap = (m[3] || "").toUpperCase();
  if (ap === "PM" && h !== 12) h += 12;
  if (ap === "AM" && h === 12) h = 0;
  return h * 60 + min;
}

// Two ranges [aStart,aEnd) and [bStart,bEnd) overlap?
function rangesOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  const as = toMinutes(aStart), ae = toMinutes(aEnd), bs = toMinutes(bStart), be = toMinutes(bEnd);
  if (as < 0 || ae < 0 || bs < 0 || be < 0) return false;
  return as < be && bs < ae;
}

// Resolve the effective teacher label for a schedule: explicit teacherName, else batch.teacher user name.
function scheduleTeacherLabel(s: any): string {
  if (s.teacherName && String(s.teacherName).trim()) return String(s.teacherName).trim().toLowerCase();
  const u = s.batch?.teacher?.user;
  if (u) return `${u.firstName || ""} ${u.lastName || ""}`.trim().toLowerCase();
  return "";
}

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

    // ── In-app notifications to teacher + students ────────────
    notifyBatch(batch.id, {
      title: isUpdate ? "Timetable Updated" : "New Class Scheduled",
      message: `${batch.subject} (${batch.name}) on ${dayName} at ${schedule.startTime}–${schedule.endTime}${schedule.roomOrLink ? ` · ${schedule.roomOrLink}` : ""}`,
      type: "GENERAL",
      priority: "NORMAL",
      link: "/schedule",
    });

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
    const { batchId, dayOfWeek, startTime, endTime, roomOrLink, subject, teacherName } = req.body;

    if (!batchId || dayOfWeek === undefined || !startTime || !endTime) {
      res.status(400).json({ status: "error", message: "batchId, dayOfWeek, startTime and endTime are required." });
      return;
    }

    // The batch must already exist. We no longer fabricate dummy teachers/batches
    // here — that polluted the Staff/Teacher directories with placeholder records.
    const targetBatchId = batchId;
    const existingBatch = await prisma.batch.findUnique({ where: { id: batchId } });
    if (!existingBatch) {
      res.status(404).json({
        status: "error",
        message: "Selected batch does not exist. Create the batch first, then add it to the timetable.",
      });
      return;
    }

    // Frontend sends 0-6, DB expects 1-7
    const dbDayOfWeek = Number(dayOfWeek) + 1;
    const frontendDayIdx = Number(dayOfWeek);

    // Effective teacher label for the new slot (explicit name, else batch's teacher)
    const newBatchForTeacher = await prisma.batch.findUnique({
      where: { id: targetBatchId },
      include: { teacher: { include: { user: true } } },
    });
    const newTeacherLabel = (teacherName && String(teacherName).trim())
      ? String(teacherName).trim().toLowerCase()
      : scheduleTeacherLabel({ batch: newBatchForTeacher });

    // Pull all existing slots for that day (times are strings → overlap-check in memory)
    const sameDay = await prisma.schedule.findMany({
      where: { dayOfWeek: dbDayOfWeek },
      include: { batch: { include: { teacher: { include: { user: true } } } } },
    });

    // Conflict 1: same batch overlapping time
    const batchConflict = sameDay.find(
      (s: any) => s.batchId === targetBatchId && rangesOverlap(startTime, endTime, s.startTime, s.endTime)
    );
    if (batchConflict) {
      res.status(409).json({
        status: "error",
        message: `This batch already has a class overlapping ${startTime}–${endTime} on ${DAY_NAMES[frontendDayIdx]}.`,
      });
      return;
    }

    // Conflict 2: same teacher overlapping time (across ANY batch/class)
    if (newTeacherLabel) {
      const teacherConflict = sameDay.find(
        (s: any) => scheduleTeacherLabel(s) === newTeacherLabel && rangesOverlap(startTime, endTime, s.startTime, s.endTime)
      );
      if (teacherConflict) {
        const label = (teacherName || "").trim() || "This teacher";
        res.status(409).json({
          status: "error",
          message: `${label} is already teaching "${teacherConflict.subject || teacherConflict.batch?.subject || "a class"}" (${teacherConflict.batch?.name || "another batch"}) at ${teacherConflict.startTime}–${teacherConflict.endTime} on ${DAY_NAMES[frontendDayIdx]}.`,
        });
        return;
      }
    }

    // Conflict 3: same room overlapping time
    if (roomOrLink) {
      const roomConflict = sameDay.find(
        (s: any) => s.roomOrLink && s.roomOrLink === roomOrLink && rangesOverlap(startTime, endTime, s.startTime, s.endTime)
      );
      if (roomConflict) {
        res.status(409).json({
          status: "error",
          message: `Room "${roomOrLink}" is already booked at ${roomConflict.startTime}–${roomConflict.endTime} on ${DAY_NAMES[frontendDayIdx]}.`,
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
        subject: subject || null,
        teacherName: teacherName || null,
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
    const { dayOfWeek, startTime, endTime, roomOrLink, batchId, subject, teacherName } = req.body;

    // Load the existing slot so we can compute effective (merged) values for conflict checks
    const current = await prisma.schedule.findUnique({
      where: { id: req.params.id },
      include: { batch: { include: { teacher: { include: { user: true } } } } },
    });
    if (!current) {
      res.status(404).json({ status: "error", message: "Schedule not found." });
      return;
    }

    // Effective final values after this update
    const effBatchId = batchId !== undefined ? batchId : current.batchId;
    const effStart = startTime !== undefined ? startTime : current.startTime;
    const effEnd = endTime !== undefined ? endTime : current.endTime;
    const effRoom = roomOrLink !== undefined ? roomOrLink : current.roomOrLink;
    const dbDayOfWeek = dayOfWeek !== undefined ? Number(dayOfWeek) + 1 : current.dayOfWeek;
    const frontendDayIdx = dbDayOfWeek - 1;

    // Effective teacher label
    let effBatchForTeacher: any = current.batch;
    if (batchId !== undefined && batchId !== current.batchId) {
      effBatchForTeacher = await prisma.batch.findUnique({
        where: { id: batchId }, include: { teacher: { include: { user: true } } },
      });
    }
    const effTeacherLabel = (teacherName !== undefined)
      ? (String(teacherName || "").trim().toLowerCase() || scheduleTeacherLabel({ batch: effBatchForTeacher }))
      : ((current.teacherName && current.teacherName.trim())
          ? current.teacherName.trim().toLowerCase()
          : scheduleTeacherLabel({ batch: effBatchForTeacher }));

    // Pull all other slots on that day (exclude self) for overlap checks
    const sameDay = await prisma.schedule.findMany({
      where: { dayOfWeek: dbDayOfWeek, NOT: { id: req.params.id } },
      include: { batch: { include: { teacher: { include: { user: true } } } } },
    });

    // Conflict 1: same batch overlapping time
    const batchConflict = sameDay.find(
      (s: any) => s.batchId === effBatchId && rangesOverlap(effStart, effEnd, s.startTime, s.endTime)
    );
    if (batchConflict) {
      res.status(409).json({
        status: "error",
        message: `This batch already has a class overlapping ${effStart}–${effEnd} on ${DAY_NAMES[frontendDayIdx]}.`,
      });
      return;
    }

    // Conflict 2: same teacher overlapping time (across ANY batch/class)
    if (effTeacherLabel) {
      const teacherConflict = sameDay.find(
        (s: any) => scheduleTeacherLabel(s) === effTeacherLabel && rangesOverlap(effStart, effEnd, s.startTime, s.endTime)
      );
      if (teacherConflict) {
        const label = (teacherName || current.teacherName || "").toString().trim() || "This teacher";
        res.status(409).json({
          status: "error",
          message: `${label} is already teaching "${teacherConflict.subject || teacherConflict.batch?.subject || "a class"}" (${teacherConflict.batch?.name || "another batch"}) at ${teacherConflict.startTime}–${teacherConflict.endTime} on ${DAY_NAMES[frontendDayIdx]}.`,
        });
        return;
      }
    }

    // Conflict 3: same room overlapping time
    if (effRoom) {
      const roomConflict = sameDay.find(
        (s: any) => s.roomOrLink && s.roomOrLink === effRoom && rangesOverlap(effStart, effEnd, s.startTime, s.endTime)
      );
      if (roomConflict) {
        res.status(409).json({
          status: "error",
          message: `Room "${effRoom}" is already booked at ${roomConflict.startTime}–${roomConflict.endTime} on ${DAY_NAMES[frontendDayIdx]}.`,
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
    if (subject !== undefined) updateData.subject = subject || null;
    if (teacherName !== undefined) updateData.teacherName = teacherName || null;

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
