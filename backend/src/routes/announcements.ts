import { prisma } from "../utils/prisma";
import { Router, Response } from "express";

import { authenticate, authorize, AuthRequest } from "../middleware/auth";

const router = Router();

// GET /api/v1/announcements
router.get("/", authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { type, audience, active } = req.query as any;
    const where: any = {};
    if (type) where.type = type;
    if (audience) where.audience = audience;
    if (active !== undefined) where.isActive = active === "true";
    const announcements = await prisma.announcement.findMany({ where, orderBy: { publishedAt: "desc" }, take: 100 });
    res.json({ status: "success", data: announcements });
  } catch (err: any) { res.status(500).json({ status: "error", message: err.message }); }
});

// POST /api/v1/announcements
router.post("/", authenticate, authorize("ADMIN", "TEACHER"), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, content, type, audience, batchId, priority, expiresAt } = req.body;
    if (!title || !content) { res.status(400).json({ status: "error", message: "title and content required." }); return; }
    const announcement = await prisma.announcement.create({
      data: {
        title, content, type: type || "GENERAL", audience: audience || "ALL",
        batchId: batchId || null, priority: priority || "NORMAL",
        publishedBy: req.user!.id, expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    });
    res.status(201).json({ status: "success", data: announcement });
  } catch (err: any) { res.status(500).json({ status: "error", message: err.message }); }
});

// PATCH /api/v1/announcements/:id
router.patch("/:id", authenticate, authorize("ADMIN"), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, content, type, audience, priority, isActive, expiresAt } = req.body;
    const announcement = await prisma.announcement.update({
      where: { id: req.params.id },
      data: { ...(title && { title }), ...(content && { content }), ...(type && { type }), ...(audience && { audience }), ...(priority && { priority }), ...(isActive !== undefined && { isActive }), ...(expiresAt !== undefined && { expiresAt: expiresAt ? new Date(expiresAt) : null }) },
    });
    res.json({ status: "success", data: announcement });
  } catch (err: any) { res.status(500).json({ status: "error", message: err.message }); }
});

// DELETE /api/v1/announcements/:id
router.delete("/:id", authenticate, authorize("ADMIN"), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await prisma.announcement.delete({ where: { id: req.params.id } });
    res.json({ status: "success", message: "Announcement deleted." });
  } catch (err: any) { res.status(500).json({ status: "error", message: err.message }); }
});

export default router;
