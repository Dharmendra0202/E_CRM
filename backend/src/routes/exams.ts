import { prisma } from "../utils/prisma";
import { logAudit } from "../utils/auditLog";
import { Router, Response } from "express";
import { authenticate, authorize, AuthRequest } from "../middleware/auth";
import { notifyBatch, notifyUsers } from "../utils/notify";

const router = Router();

// Helper: resolve the caller's Student id (or null) for STUDENT/PARENT scoping
async function getCallerStudentId(req: AuthRequest): Promise<string | null> {
  if (!req.user) return null;
  const student = await prisma.student.findFirst({ where: { userId: req.user.id } });
  return student?.id || null;
}

// GET /api/v1/exams — list exams (students see only their batch's exams + own results)
router.get("/", authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, batch_id } = req.query;
    const where: any = { deletedAt: null };
    if (status) where.status = status;
    if (batch_id) where.batchId = batch_id;

    const role = req.user?.role;
    const isStudent = role === "STUDENT" || role === "PARENT";

    if (isStudent) {
      // Only exams for batches the student is enrolled in
      const studentId = await getCallerStudentId(req);
      if (!studentId) { res.json({ status: "success", data: [] }); return; }
      const enrollments = await prisma.batchEnrollment.findMany({
        where: { studentId, status: "ACTIVE" },
        include: { batch: { select: { id: true, name: true } } },
      });
      const batchIds = enrollments.map((e) => e.batchId);
      const batchNames = enrollments.map((e) => e.batch?.name).filter(Boolean) as string[];
      // Match by batchId OR batchName (exams sometimes store only the name)
      where.OR = [
        { batchId: { in: batchIds.length ? batchIds : ["__none__"] } },
        { batchName: { in: batchNames.length ? batchNames : ["__none__"] } },
      ];

      const exams = await prisma.exam.findMany({
        where,
        orderBy: { date: "desc" },
        include: { results: { where: { studentId } } }, // only their own result
      });
      res.json({ status: "success", data: exams });
      return;
    }

    // Admin / Teacher / Staff — full view
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

    // Resolve batchId from batchName if only the name was provided
    let resolvedBatchId: string | null = batchId || null;
    let resolvedBatchName: string | null = batchName || null;
    if (!resolvedBatchId && batchName) {
      const b = await prisma.batch.findFirst({ where: { name: batchName } });
      if (b) { resolvedBatchId = b.id; resolvedBatchName = b.name; }
    } else if (resolvedBatchId && !resolvedBatchName) {
      const b = await prisma.batch.findUnique({ where: { id: resolvedBatchId } });
      if (b) resolvedBatchName = b.name;
    }

    const exam = await prisma.exam.create({
      data: {
        title, type: type || "UNIT_TEST", subject,
        batchId: resolvedBatchId, batchName: resolvedBatchName,
        date: new Date(date),
        totalMarks: totalMarks || 100, passingMarks: passingMarks || 35,
        status: "SCHEDULED", createdBy: req.user?.id,
      },
    });

    // Notify the batch's students + teacher that a new exam is scheduled
    if (resolvedBatchId) {
      const examDate = new Date(date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
      notifyBatch(resolvedBatchId, {
        title: "New Exam Scheduled",
        message: `${title} (${subject}) on ${examDate}. Total marks: ${totalMarks || 100}.`,
        type: "EXAM",
        priority: "HIGH",
        link: "/examination",
      });
    }

    logAudit({ module: "exams", action: "CREATE", entityId: exam.id, newValue: { title, type, subject, date } }, req);
    res.status(201).json({ status: "success", data: exam });
  } catch (err: any) { res.status(500).json({ status: "error", message: err.message }); }
});

// PATCH /api/v1/exams/:id — update exam (including status advancement)
router.patch("/:id", authenticate, authorize("ADMIN", "TEACHER"), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, type, subject, batchId, batchName, date, totalMarks, passingMarks, status } = req.body;
    const prev = await prisma.exam.findUnique({ where: { id: req.params.id } });
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

    // Notify students when results are published
    if (status === "PUBLISHED" && prev?.status !== "PUBLISHED" && exam.batchId) {
      notifyBatch(exam.batchId, {
        title: "Exam Results Published",
        message: `Results for ${exam.title} (${exam.subject}) are now available. Check your marks.`,
        type: "EXAM",
        priority: "HIGH",
        link: "/marksheet",
        includeTeacher: false,
      });
    }

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

// GET /api/v1/exams/my-results — a student's own results across all their exams
router.get("/my-results", authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const studentId = await getCallerStudentId(req);
    if (!studentId) { res.json({ status: "success", data: [] }); return; }

    const results = await prisma.examResult.findMany({
      where: { studentId },
      include: { exam: true },
      orderBy: { createdAt: "desc" },
    });

    // Only show results for published exams
    const data = results
      .filter((r) => r.exam && r.exam.status === "PUBLISHED" && !r.exam.deletedAt)
      .map((r) => {
        const total = r.exam!.totalMarks || 100;
        const pct = total > 0 ? Math.round((r.marks / total) * 10000) / 100 : 0;
        return {
          id: r.id,
          examTitle: r.exam!.title,
          examType: r.exam!.type,
          subject: r.exam!.subject,
          batchName: r.exam!.batchName,
          date: r.exam!.date,
          marks: r.marks,
          totalMarks: total,
          passingMarks: r.exam!.passingMarks,
          percentage: pct,
          grade: r.grade,
          remarks: r.remarks,
          passed: r.marks >= (r.exam!.passingMarks || 0),
        };
      });

    res.json({ status: "success", data });
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
