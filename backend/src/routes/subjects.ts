import { prisma } from "../utils/prisma";
import { Router, Response } from "express";

import { authenticate, authorize, AuthRequest } from "../middleware/auth";

const router = Router();

// GET /api/v1/subjects
router.get("/", authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const subjects = await prisma.subject.findMany({
      include: { _count: { select: { homework: true } } },
      orderBy: { name: "asc" },
    });
    res.json({ status: "success", data: subjects });
  } catch (err: any) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

// POST /api/v1/subjects
router.post("/", authenticate, authorize("ADMIN"), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, code, description } = req.body;
    if (!name) { res.status(400).json({ status: "error", message: "name required." }); return; }
    const subject = await prisma.subject.create({
      data: { name, code: code || null, description: description || null },
    });
    res.status(201).json({ status: "success", data: subject });
  } catch (err: any) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

// DELETE /api/v1/subjects/:id
router.delete("/:id", authenticate, authorize("ADMIN"), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await prisma.subject.delete({ where: { id: req.params.id } });
    res.json({ status: "success", message: "Subject deleted." });
  } catch (err: any) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

export default router;
