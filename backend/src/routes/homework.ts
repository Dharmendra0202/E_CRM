import { prisma } from "../utils/prisma";
import { Router, Response } from "express";

import { authenticate, authorize, AuthRequest } from "../middleware/auth";

const router = Router();

// ══════════════════════════════════════════════════════════════
// GET /api/v1/homework — list homework (filter by batch, status)
// ══════════════════════════════════════════════════════════════
router.get("/", authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { batch_id, status, assigned_by } = req.query as any;
    const where: any = {};
    if (batch_id) where.batchId = batch_id;
    if (status) where.status = status;
    if (assigned_by) where.assignedBy = assigned_by;

    const homework = await prisma.homework.findMany({
      where,
      include: {
        subject: { select: { name: true, code: true } },
        submissions: { select: { id: true, status: true } },
      },
      orderBy: { dueDate: "desc" },
    });

    const data = homework.map((h) => ({
      ...h,
      submissionCount: h.submissions.length,
      gradedCount: h.submissions.filter((s) => s.status === "GRADED").length,
    }));

    res.json({ status: "success", data });
  } catch (err: any) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

// ══════════════════════════════════════════════════════════════
// GET /api/v1/homework/stats — homework overview
// ══════════════════════════════════════════════════════════════
router.get("/stats", authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const total = await prisma.homework.count();
    const active = await prisma.homework.count({ where: { status: "ACTIVE" } });
    const overdue = await prisma.homework.count({
      where: { status: "ACTIVE", dueDate: { lt: new Date() } },
    });
    const totalSubmissions = await prisma.homeworkSubmission.count();
    const graded = await prisma.homeworkSubmission.count({ where: { status: "GRADED" } });

    res.json({
      status: "success",
      data: { total, active, overdue, totalSubmissions, graded, pendingGrading: totalSubmissions - graded },
    });
  } catch (err: any) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

// ══════════════════════════════════════════════════════════════
// GET /api/v1/homework/:id — single homework with submissions
// ══════════════════════════════════════════════════════════════
router.get("/:id", authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const hw = await prisma.homework.findUnique({
      where: { id: req.params.id },
      include: {
        subject: true,
        submissions: { orderBy: { submittedAt: "desc" } },
      },
    });
    if (!hw) { res.status(404).json({ status: "error", message: "Homework not found." }); return; }
    res.json({ status: "success", data: hw });
  } catch (err: any) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

// ══════════════════════════════════════════════════════════════
// POST /api/v1/homework — create homework
// ══════════════════════════════════════════════════════════════
router.post("/", authenticate, authorize("ADMIN", "TEACHER"), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, description, subjectId, batchId, dueDate, maxScore, attachments } = req.body;
    if (!title || !dueDate) {
      res.status(400).json({ status: "error", message: "title and dueDate required." }); return;
    }

    const hw = await prisma.homework.create({
      data: {
        title,
        description: description || null,
        subjectId: subjectId || null,
        batchId: batchId || null,
        assignedBy: req.user!.id,
        dueDate: new Date(dueDate),
        maxScore: maxScore ? parseInt(maxScore) : null,
        attachments: attachments ? JSON.stringify(attachments) : null,
        status: "ACTIVE",
      },
    });

    res.status(201).json({ status: "success", data: hw });
  } catch (err: any) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

// ══════════════════════════════════════════════════════════════
// PATCH /api/v1/homework/:id — update homework
// ══════════════════════════════════════════════════════════════
router.patch("/:id", authenticate, authorize("ADMIN", "TEACHER"), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, description, subjectId, batchId, dueDate, maxScore, status } = req.body;
    const hw = await prisma.homework.update({
      where: { id: req.params.id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(subjectId !== undefined && { subjectId }),
        ...(batchId !== undefined && { batchId }),
        ...(dueDate && { dueDate: new Date(dueDate) }),
        ...(maxScore !== undefined && { maxScore: maxScore ? parseInt(maxScore) : null }),
        ...(status && { status }),
      },
    });
    res.json({ status: "success", data: hw });
  } catch (err: any) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

// ══════════════════════════════════════════════════════════════
// DELETE /api/v1/homework/:id
// ══════════════════════════════════════════════════════════════
router.delete("/:id", authenticate, authorize("ADMIN", "TEACHER"), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await prisma.homework.delete({ where: { id: req.params.id } });
    res.json({ status: "success", message: "Homework deleted." });
  } catch (err: any) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

// ══════════════════════════════════════════════════════════════
// POST /api/v1/homework/:id/submit — student submits
// ══════════════════════════════════════════════════════════════
router.post("/:id/submit", authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { studentId, content, attachments } = req.body;
    if (!studentId) { res.status(400).json({ status: "error", message: "studentId required." }); return; }

    const hw = await prisma.homework.findUnique({ where: { id: req.params.id } });
    if (!hw) { res.status(404).json({ status: "error", message: "Homework not found." }); return; }

    const isLate = new Date() > new Date(hw.dueDate);

    const submission = await prisma.homeworkSubmission.upsert({
      where: { homeworkId_studentId: { homeworkId: req.params.id, studentId } },
      create: {
        homeworkId: req.params.id,
        studentId,
        content: content || null,
        attachments: attachments ? JSON.stringify(attachments) : null,
        status: isLate ? "LATE" : "SUBMITTED",
      },
      update: {
        content: content || null,
        attachments: attachments ? JSON.stringify(attachments) : null,
        submittedAt: new Date(),
        status: isLate ? "LATE" : "SUBMITTED",
      },
    });

    res.json({ status: "success", data: submission });
  } catch (err: any) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

// ══════════════════════════════════════════════════════════════
// PATCH /api/v1/homework/:id/grade — teacher grades a submission
// ══════════════════════════════════════════════════════════════
router.patch("/:id/grade", authenticate, authorize("ADMIN", "TEACHER"), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { studentId, score, feedback } = req.body;
    if (!studentId) { res.status(400).json({ status: "error", message: "studentId required." }); return; }

    const submission = await prisma.homeworkSubmission.update({
      where: { homeworkId_studentId: { homeworkId: req.params.id, studentId } },
      data: {
        score: score !== undefined ? parseInt(score) : undefined,
        feedback: feedback || null,
        gradedAt: new Date(),
        status: "GRADED",
      },
    });

    res.json({ status: "success", data: submission });
  } catch (err: any) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

export default router;
