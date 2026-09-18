import { prisma } from "../utils/prisma";
import { Router, Response } from "express";
import { authenticate, authorize, AuthRequest } from "../middleware/auth";

const router = Router();

// GET /api/v1/notifications — get current user's notifications
router.get("/", authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { unread_only, type, limit } = req.query;
    const where: any = { userId: req.user!.id };
    if (unread_only === "true") where.isRead = false;
    if (type) where.type = type;

    // @ts-ignore - Notification model exists after prisma generate
    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit ? parseInt(limit as string) : 50,
    });
    // @ts-ignore
    const unreadCount = await prisma.notification.count({ where: { userId: req.user!.id, isRead: false } });

    res.json({ status: "success", data: notifications, unreadCount });
  } catch (err: any) { res.status(500).json({ status: "error", message: err.message }); }
});

// POST /api/v1/notifications — create notification (internal/admin use)
router.post("/", authenticate, authorize("ADMIN", "SUPER_ADMIN", "TEACHER"), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { userId, title, message, type, priority, link, metadata } = req.body;
    if (!userId || !title || !message) {
      res.status(400).json({ status: "error", message: "userId, title, message required." }); return;
    }
    // @ts-ignore
    const notification = await prisma.notification.create({
      data: {
        userId, title, message,
        type: type || "GENERAL",
        priority: priority || "NORMAL",
        link: link || null,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    });
    res.status(201).json({ status: "success", data: notification });
  } catch (err: any) { res.status(500).json({ status: "error", message: err.message }); }
});

// POST /api/v1/notifications/bulk — send to multiple users
router.post("/bulk", authenticate, authorize("ADMIN", "SUPER_ADMIN", "TEACHER"), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { userIds, title, message, type, priority, link } = req.body;
    if (!userIds?.length || !title || !message) {
      res.status(400).json({ status: "error", message: "userIds array, title, message required." }); return;
    }
    // @ts-ignore
    const result = await prisma.notification.createMany({
      data: userIds.map((uid: string) => ({
        userId: uid, title, message,
        type: type || "GENERAL",
        priority: priority || "NORMAL",
        link: link || null,
      })),
    });
    res.status(201).json({ status: "success", count: result.count });
  } catch (err: any) { res.status(500).json({ status: "error", message: err.message }); }
});

// PATCH /api/v1/notifications/:id/read — mark single as read
router.patch("/:id/read", authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // @ts-ignore
    await prisma.notification.update({ where: { id: req.params.id }, data: { isRead: true } });
    res.json({ status: "success", message: "Marked as read." });
  } catch (err: any) { res.status(500).json({ status: "error", message: err.message }); }
});

// POST /api/v1/notifications/read-all — mark all as read
router.post("/read-all", authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // @ts-ignore
    await prisma.notification.updateMany({ where: { userId: req.user!.id, isRead: false }, data: { isRead: true } });
    res.json({ status: "success", message: "All notifications marked as read." });
  } catch (err: any) { res.status(500).json({ status: "error", message: err.message }); }
});

// DELETE /api/v1/notifications/:id — delete single notification
router.delete("/:id", authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // @ts-ignore
    await prisma.notification.delete({ where: { id: req.params.id } });
    res.json({ status: "success", message: "Notification deleted." });
  } catch (err: any) { res.status(500).json({ status: "error", message: err.message }); }
});

export default router;
