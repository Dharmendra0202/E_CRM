import { Router, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { authenticate, authorize, AuthRequest } from "../middleware/auth";

const router = Router();
const prisma = new PrismaClient();

// GET /api/v1/students
router.get("/", authenticate, authorize("ADMIN", "TEACHER"), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const students = await prisma.student.findMany({
      include: { user: { select: { email: true, firstName: true, lastName: true, phone: true } }, enrollments: { include: { batch: true } } },
      orderBy: { createdAt: "desc" },
    });
    res.json({ status: "success", data: students });
  } catch (err: any) { res.status(500).json({ status: "error", message: err.message }); }
});

// GET /api/v1/students/:id
router.get("/:id", authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const student = await prisma.student.findUnique({
      where: { id: req.params.id },
      include: { user: true, enrollments: { include: { batch: { include: { teacher: { include: { user: true } } } } } }, invoices: true, attendance: { orderBy: { classDate: "desc" }, take: 20 } },
    });
    if (!student) { res.status(404).json({ status: "error", message: "Student not found." }); return; }
    res.json({ status: "success", data: student });
  } catch (err: any) { res.status(500).json({ status: "error", message: err.message }); }
});

// POST /api/v1/students
router.post("/", authenticate, authorize("ADMIN"), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { parentName, parentPhone, parentEmail, dateOfBirth, firstName, lastName, email, phone } = req.body;
    if (!parentName || !parentPhone || !parentEmail || !dateOfBirth || !firstName || !lastName || !email) {
      res.status(400).json({ status: "error", message: "Required fields missing." }); return;
    }
    // Create user account first then student profile
    const student = await prisma.student.create({
      data: { parentName, parentPhone, parentEmail, dateOfBirth: new Date(dateOfBirth) },
    });
    res.status(201).json({ status: "success", data: student });
  } catch (err: any) { res.status(500).json({ status: "error", message: err.message }); }
});

// PATCH /api/v1/students/:id
router.patch("/:id", authenticate, authorize("ADMIN"), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { parentName, parentPhone, parentEmail, dateOfBirth } = req.body;
    const student = await prisma.student.update({
      where: { id: req.params.id },
      data: { parentName, parentPhone, parentEmail, ...(dateOfBirth && { dateOfBirth: new Date(dateOfBirth) }) },
    });
    res.json({ status: "success", data: student });
  } catch (err: any) { res.status(500).json({ status: "error", message: err.message }); }
});

// DELETE /api/v1/students/:id
router.delete("/:id", authenticate, authorize("ADMIN"), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await prisma.student.delete({ where: { id: req.params.id } });
    res.json({ status: "success", message: "Student deleted." });
  } catch (err: any) { res.status(500).json({ status: "error", message: err.message }); }
});

export default router;
