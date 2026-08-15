import { prisma } from "../utils/prisma";
import { logAudit } from "../utils/auditLog";
import { Router, Response } from "express";
import { authenticate, authorize, AuthRequest } from "../middleware/auth";

const router = Router();

// GET /api/v1/exams — list all exams
router.get("/", authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, batch_id } = req.query;
    const where: any = { deletedAt: null };
    if (status) where.status = status;
    if (batch_id) where.batchId = batch_id;
    const exams = await prisma.exam.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { results: true },
    });
    res.json({ status: "success", data: exams });
  } catch (err: any) { res.status(500).json({ status: "error", message: err.message }); }
});

// POST /api/v1/exams — create exam
router.post("/", authenticate, authorize("ADMIN", "TEACHER"), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, type, subject, batchId, batchName, date, totalMarks, passingMarks } = req.body;
    if (!title || !subject || !date) {
      res.status(400).json({ status: "error", message: "title, subject, and date are required." }); return;
    }
    const exam = await prisma.exam.create({
      data: {
        title, type: type || "UNIT_TEST", subject,
        batchId: batchId || null, batchName: batchName || null,
        date: new Date(date),
        totalMarks: totalMarks || 100, passingMarks: passingMarks || 35,
        status: "DRAFT", createdBy: req.user?.id,
      },
    });
    logAudit({ module: "exams", action: "CREATE", entityId: exam.id, newValue: { title, type, subject, date } }, req);
    res.status(201).json({ status: "success", data: exam });
  } catch (err: any) { res.status(500).json({ status: "error", message: err.message }); }
});

// PATCH /api/v1/exams/:id — update exam (including status advancement)
router.patch("/:id", authenticate, authorize("ADMIN", "TEACHER"), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, type, subject, batchId, batchName, date, totalMarks, passingMarks, status } = req.body;
    const exam = await prisma.exam.update({
      where: { id: req.params.id },
      data: {
        ...(title && { title }),
        ...(type && { type }),
        ...(subject && { subject }),
        ...(batchId !== undefined && { batchId }),
        ...(batchName !== undefined && { batchName }),
        ...(date && { date: new Date(date) }),
        ...(totalMarks && { totalMarks }),
        ...(passingMarks && { passingMarks }),
        ...(status && { status }),
      },
    });
    logAudit({ module: "exams", action: "UPDATE", entityId: req.params.id, newValue: req.body }, req);
    res.json({ status: "success", data: exam });
  } catch (err: any) { res.status(500).json({ status: "error", message: err.message }); }
});

// DELETE /api/v1/exams/:id — soft delete
router.delete("/:id", authenticate, authorize("ADMIN"), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await prisma.exam.update({
      where: { id: req.params.id },
      data: { deletedAt: new Date() },
    });
    logAudit({ module: "exams", action: "DELETE", entityId: req.params.id }, req);
    res.json({ status: "success", message: "Exam deleted." });
  } catch (err: any) { res.status(500).json({ status: "error", message: err.message }); }
});

// POST /api/v1/exams/:id/results — add result for a student
router.post("/:id/results", authenticate, authorize("ADMIN", "TEACHER"), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { studentId, marks, grade, remarks } = req.body;
    if (!studentId || marks === undefined) {
      res.status(400).json({ status: "error", message: "studentId and marks required." }); return;
    }
    const result = await prisma.examResult.upsert({
      where: { examId_studentId: { examId: req.params.id, studentId } },
      create: { examId: req.params.id, studentId, marks, grade, remarks, evaluatedBy: req.user?.id },
      update: { marks, grade, remarks, evaluatedBy: req.user?.id },
    });
    res.status(201).json({ status: "success", data: result });
  } catch (err: any) { res.status(500).json({ status: "error", message: err.message }); }
});

export default router;
