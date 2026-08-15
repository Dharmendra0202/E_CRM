import { prisma } from "../utils/prisma";
import { logAudit } from "../utils/auditLog";
import { Router, Response } from "express";
import { authenticate, authorize, AuthRequest } from "../middleware/auth";

const router = Router();

// GET /api/v1/marksheets — list all entries (filterable by batch, student)
router.get("/", authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { batch, student_id } = req.query;
    const where: any = {};
    if (batch) where.batch = batch;
    if (student_id) where.studentId = student_id;
    const entries = await prisma.marksheetEntry.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
    res.json({ status: "success", data: entries });
  } catch (err: any) { res.status(500).json({ status: "error", message: err.message }); }
});

// POST /api/v1/marksheets — add marks entry
router.post("/", authenticate, authorize("ADMIN", "TEACHER"), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { studentId, studentName, subject, marks, totalMarks, examTitle, batch } = req.body;
    if (!studentId || !subject || marks === undefined || !examTitle || !batch) {
      res.status(400).json({ status: "error", message: "studentId, subject, marks, examTitle, batch required." }); return;
    }
    const pct = totalMarks > 0 ? (marks / totalMarks) * 100 : 0;
    const grade = pct >= 90 ? "A+" : pct >= 80 ? "A" : pct >= 70 ? "B+" : pct >= 60 ? "B" : pct >= 50 ? "C" : pct >= 35 ? "D" : "F";
    const entry = await prisma.marksheetEntry.create({
      data: {
        studentId, studentName: studentName || "Student", subject,
        marks, totalMarks: totalMarks || 100, examTitle, batch,
        percentage: pct, grade, createdBy: req.user?.id,
      },
    });
    logAudit({ module: "marksheets", action: "CREATE", entityId: entry.id, newValue: { studentId, subject, marks, examTitle, batch } }, req);
    res.status(201).json({ status: "success", data: entry });
  } catch (err: any) { res.status(500).json({ status: "error", message: err.message }); }
});

// DELETE /api/v1/marksheets/:id — delete single entry
router.delete("/:id", authenticate, authorize("ADMIN"), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await prisma.marksheetEntry.delete({ where: { id: req.params.id } });
    res.json({ status: "success", message: "Entry deleted." });
  } catch (err: any) { res.status(500).json({ status: "error", message: err.message }); }
});

// GET /api/v1/marksheets/results — aggregated results by batch
router.get("/results", authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { batch } = req.query;
    if (!batch) { res.status(400).json({ status: "error", message: "batch query param required." }); return; }
    const entries = await prisma.marksheetEntry.findMany({ where: { batch: batch as string } });
    
    // Aggregate by student
    const studentMap = new Map<string, { name: string; subjects: any[]; total: number; max: number }>();
    for (const e of entries) {
      if (!studentMap.has(e.studentId)) {
        studentMap.set(e.studentId, { name: e.studentName, subjects: [], total: 0, max: 0 });
      }
      const s = studentMap.get(e.studentId)!;
      s.subjects.push({ subject: e.subject, marks: e.marks, totalMarks: e.totalMarks, exam: e.examTitle });
      s.total += e.marks;
      s.max += e.totalMarks;
    }

    const results = Array.from(studentMap.entries()).map(([id, data]) => {
      const pct = data.max > 0 ? (data.total / data.max) * 100 : 0;
      const grade = pct >= 90 ? "A+" : pct >= 80 ? "A" : pct >= 70 ? "B+" : pct >= 60 ? "B" : pct >= 50 ? "C" : pct >= 35 ? "D" : "F";
      return { studentId: id, name: data.name, subjects: data.subjects, totalObtained: data.total, totalMax: data.max, percentage: pct, grade };
    }).sort((a, b) => b.percentage - a.percentage);

    res.json({ status: "success", data: results });
  } catch (err: any) { res.status(500).json({ status: "error", message: err.message }); }
});

export default router;
