import { prisma } from "../utils/prisma";
import { logAudit } from "../utils/auditLog";
import { notifyBatch } from "../utils/notify";
import { Router, Response } from "express";
import { authenticate, authorize, AuthRequest } from "../middleware/auth";

const router = Router();

// Helper: derive live status from date if not COMPLETED/CANCELLED
function computeBucket(cls: any): "TODAY" | "UPCOMING" | "COMPLETED" {
  if (cls.status === "COMPLETED" || cls.status === "CANCELLED") return "COMPLETED";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(cls.scheduleDate);
  d.setHours(0, 0, 0, 0);
  if (d.getTime() === today.getTime()) return "TODAY";
  if (d.getTime() > today.getTime()) return "UPCOMING";
  return "COMPLETED";
}

// GET /api/v1/online-classes?status=today|upcoming|completed
router.get("/", authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status } = req.query;
    const classes = await prisma.onlineClass.findMany({
      where: { deletedAt: null },
      orderBy: [{ scheduleDate: "asc" }, { scheduleTime: "asc" }],
    });

    let filtered = classes;
    if (status && typeof status === "string" && status !== "all") {
      const want = status.toUpperCase();
      filtered = classes.filter((c) => computeBucket(c) === want);
    }

    // attach computed bucket for the frontend
    const data = filtered.map((c) => ({ ...c, bucket: computeBucket(c) }));
    res.json({ status: "success", data });
  } catch (err: any) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

// POST /api/v1/online-classes — create (admin/teacher)
router.post("/", authenticate, authorize("ADMIN", "TEACHER", "SUPER_ADMIN"), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { courseName, subjectName, scheduleDate, scheduleTime, theoryBatch, practicalBatch, teacherName, classLink, meetingId, status, batchId } = req.body;
    if (!courseName || !subjectName || !scheduleDate || !scheduleTime) {
      res.status(400).json({ status: "error", message: "courseName, subjectName, scheduleDate and scheduleTime are required." });
      return;
    }
    const created = await prisma.onlineClass.create({
      data: {
        courseName, subjectName,
        scheduleDate: new Date(scheduleDate),
        scheduleTime,
        theoryBatch: theoryBatch || null,
        practicalBatch: practicalBatch || null,
        teacherName: teacherName || null,
        classLink: classLink || null,
        meetingId: meetingId || null,
        status: status || "UPCOMING",
        batchId: batchId || null,
      },
    });
    logAudit({ module: "online-classes", action: "CREATE", entityId: created.id, newValue: { courseName, subjectName } }, req);

    // Notify the batch about the new online class
    if (batchId) {
      const when = new Date(scheduleDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
      notifyBatch(batchId, {
        title: "New Online Class",
        message: `${subjectName} (${courseName}) on ${when} at ${scheduleTime}.${classLink ? " Join link available." : ""}`,
        type: "GENERAL",
        priority: "NORMAL",
        link: "/online-classes",
      });
    }

    res.status(201).json({ status: "success", data: created });
  } catch (err: any) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

// PATCH /api/v1/online-classes/:id — edit (admin/teacher)
router.patch("/:id", authenticate, authorize("ADMIN", "TEACHER", "SUPER_ADMIN"), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { courseName, subjectName, scheduleDate, scheduleTime, theoryBatch, practicalBatch, teacherName, classLink, meetingId, status, batchId } = req.body;
    const updated = await prisma.onlineClass.update({
      where: { id: req.params.id },
      data: {
        ...(courseName !== undefined && { courseName }),
        ...(subjectName !== undefined && { subjectName }),
        ...(scheduleDate !== undefined && { scheduleDate: new Date(scheduleDate) }),
        ...(scheduleTime !== undefined && { scheduleTime }),
        ...(theoryBatch !== undefined && { theoryBatch }),
        ...(practicalBatch !== undefined && { practicalBatch }),
        ...(teacherName !== undefined && { teacherName }),
        ...(classLink !== undefined && { classLink }),
        ...(meetingId !== undefined && { meetingId }),
        ...(status !== undefined && { status }),
        ...(batchId !== undefined && { batchId }),
      },
    });
    logAudit({ module: "online-classes", action: "UPDATE", entityId: updated.id }, req);
    res.json({ status: "success", data: updated });
  } catch (err: any) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

// DELETE /api/v1/online-classes/:id — soft delete (admin/teacher)
router.delete("/:id", authenticate, authorize("ADMIN", "TEACHER", "SUPER_ADMIN"), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await prisma.onlineClass.update({
      where: { id: req.params.id },
      data: { deletedAt: new Date() },
    });
    logAudit({ module: "online-classes", action: "DELETE", entityId: req.params.id }, req);
    res.json({ status: "success", message: "Online class deleted." });
  } catch (err: any) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

export default router;
