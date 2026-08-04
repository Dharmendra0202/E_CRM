import { prisma } from "../utils/prisma";
import { Router, Response } from "express";

import bcrypt from "bcryptjs";
import { authenticate, authorize, AuthRequest } from "../middleware/auth";

const router = Router();

// GET /api/v1/staff
router.get("/", authenticate, authorize("ADMIN"), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const users = await prisma.user.findMany({
      where: { role: { in: ["ADMIN", "TEACHER"] } },
      select: { id: true, email: true, firstName: true, lastName: true, role: true, phone: true, createdAt: true, teacher: { select: { id: true, qualification: true, hourlyRate: true, bio: true } } },
      orderBy: { createdAt: "desc" },
    });
    res.json({ status: "success", data: users });
  } catch (err: any) { res.status(500).json({ status: "error", message: err.message }); }
});

// POST /api/v1/staff
router.post("/", authenticate, authorize("ADMIN"), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { email, password, firstName, lastName, role, phone, qualification, hourlyRate, bio } = req.body;
    if (!email || !password || !firstName || !lastName || !role) {
      res.status(400).json({ status: "error", message: "Required fields missing." }); return;
    }
    const exists = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (exists) { res.status(409).json({ status: "error", message: "Email already registered." }); return; }

    const hash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(), passwordHash: hash, firstName, lastName, role, phone,
        ...(role === "TEACHER" && qualification ? {
          teacher: { create: { qualification, hourlyRate: parseFloat(hourlyRate) || 0, bio } }
        } : {}),
      },
      include: { teacher: true },
    });
    res.status(201).json({ status: "success", data: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role } });
  } catch (err: any) { res.status(500).json({ status: "error", message: err.message }); }
});

// PATCH /api/v1/staff/:id
router.patch("/:id", authenticate, authorize("ADMIN"), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { firstName, lastName, phone, role } = req.body;
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { firstName, lastName, phone, role },
      select: { id: true, email: true, firstName: true, lastName: true, role: true, phone: true },
    });
    res.json({ status: "success", data: user });
  } catch (err: any) { res.status(500).json({ status: "error", message: err.message }); }
});

// DELETE /api/v1/staff/:id
router.delete("/:id", authenticate, authorize("ADMIN"), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await prisma.user.delete({ where: { id: req.params.id } });
    res.json({ status: "success", message: "Staff member deleted." });
  } catch (err: any) { res.status(500).json({ status: "error", message: err.message }); }
});

export default router;
