import { Router, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { authenticate, authorize, AuthRequest } from "../middleware/auth";

const router = Router();
const prisma = new PrismaClient();

// GET /api/v1/batches
router.get("/", authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const batches = await prisma.batch.findMany({
      include: {
        teacher: { include: { user: { select: { firstName: true, lastName: true } } } },
        schedules: true,
        enrollments: { where: { status: "ACTIVE" } },
      },
      orderBy: { startDate: "desc" },
    });
    res.json({ status: "success", data: batches });
  } catch (err: any) { res.status(500).json({ status: "error", message: err.message }); }
});

// POST /api/v1/batches
router.post("/", authenticate, authorize("ADMIN"), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, subject, startDate, endDate, capacity, teacherId, feeAmount, feeFrequency } = req.body;
    if (!name || !subject || !startDate || !endDate || !capacity || !teacherId || !feeAmount || !feeFrequency) {
      res.status(400).json({ status: "error", message: "All fields required." }); return;
    }
    const batch = await prisma.batch.create({
      data: { name, subject, startDate: new Date(startDate), endDate: new Date(endDate), capacity: parseInt(capacity), teacherId, feeAmount: parseFloat(feeAmount), feeFrequency },
    });
    res.status(201).json({ status: "success", data: batch });
  } catch (err: any) { res.status(500).json({ status: "error", message: err.message }); }
});

// POST /api/v1/batches/:id/enroll
router.post("/:id/enroll", authenticate, authorize("ADMIN"), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { studentId } = req.body;
    const enrollment = await prisma.batchEnrollment.create({
      data: { batchId: req.params.id, studentId, status: "ACTIVE" },
    });
    res.status(201).json({ status: "success", data: enrollment });
  } catch (err: any) { res.status(500).json({ status: "error", message: err.message }); }
});

// DELETE /api/v1/batches/:id
router.delete("/:id", authenticate, authorize("ADMIN"), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await prisma.batch.delete({ where: { id: req.params.id } });
    res.json({ status: "success", message: "Batch deleted." });
  } catch (err: any) { res.status(500).json({ status: "error", message: err.message }); }
});

export default router;
