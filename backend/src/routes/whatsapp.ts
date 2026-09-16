import { Router, Response } from "express";
import { authenticate, authorize, AuthRequest } from "../middleware/auth";
import {
  getState,
  getQRDataURL,
  autoStartOnce,
  restart,
  sendMessage,
} from "../utils/whatsapp";

const router = Router();

// GET /api/v1/whatsapp/status — connection status (starts client once on first call)
router.get("/status", authenticate, authorize("ADMIN", "SUPER_ADMIN"), async (_req: AuthRequest, res: Response): Promise<void> => {
  autoStartOnce();
  res.json({ status: "success", data: getState() });
});

// GET /api/v1/whatsapp/qr — current QR as a data-URL image
router.get("/qr", authenticate, authorize("ADMIN", "SUPER_ADMIN"), async (_req: AuthRequest, res: Response): Promise<void> => {
  res.json({ status: "success", data: { qr: getQRDataURL() } });
});

// POST /api/v1/whatsapp/restart — force a fresh connection / new QR
router.post("/restart", authenticate, authorize("ADMIN", "SUPER_ADMIN"), async (_req: AuthRequest, res: Response): Promise<void> => {
  restart().catch(() => {});
  res.json({ status: "success", message: "Reconnecting. A fresh QR will appear shortly." });
});

// POST /api/v1/whatsapp/send-test — send a test message
router.post("/send-test", authenticate, authorize("ADMIN", "SUPER_ADMIN"), async (req: AuthRequest, res: Response): Promise<void> => {
  const { phone, message } = req.body;
  if (!phone || !message) {
    res.status(400).json({ status: "error", message: "phone and message are required." });
    return;
  }
  const result = await sendMessage(phone, message);
  if (!result.ok) {
    res.status(400).json({ status: "error", message: result.message });
    return;
  }
  res.json({ status: "success", message: result.message });
});

export default router;
