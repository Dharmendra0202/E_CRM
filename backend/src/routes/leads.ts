import { Router, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { authenticate, authorize, AuthRequest } from "../middleware/auth";

const router = Router();
const prisma = new PrismaClient();

// GET /api/v1/leads
router.get("/", authenticate, authorize("ADMIN", "TEACHER"), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, page = "1", limit = "50" } = req.query as any;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = status ? { status } : {};
    const [data, total] = await Promise.all([
      prisma.lead.findMany({ where, skip, take: parseInt(limit), orderBy: { createdAt: "desc" } }),
      prisma.lead.count({ where }),
    ]);
    res.json({ status: "success", pagination: { page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)), totalItems: total }, data });
  } catch (err: any) { res.status(500).json({ status: "error", message: err.message }); }
});

// POST /api/v1/leads
router.post("/", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, email, phone, source, notes } = req.body;
    if (!name || !email) { res.status(400).json({ status: "error", message: "Name and email required." }); return; }
    const lead = await prisma.lead.create({ data: { name, email, phone: phone || "", source: source || "Manual Entry", notes, status: "NEW" } });
    res.status(201).json({ status: "success", data: lead });
  } catch (err: any) { res.status(500).json({ status: "error", message: err.message }); }
});

// PATCH /api/v1/leads/:id
router.patch("/:id", authenticate, authorize("ADMIN"), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const lead = await prisma.lead.update({ where: { id: req.params.id }, data: req.body });
    res.json({ status: "success", data: lead });
  } catch (err: any) { res.status(500).json({ status: "error", message: err.message }); }
});

// DELETE /api/v1/leads/:id
router.delete("/:id", authenticate, authorize("ADMIN"), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await prisma.lead.delete({ where: { id: req.params.id } });
    res.json({ status: "success", message: "Lead deleted." });
  } catch (err: any) { res.status(500).json({ status: "error", message: err.message }); }
});

export default router;
