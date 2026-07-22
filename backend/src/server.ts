import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { PrismaClient } from "@prisma/client";
import logger from "./utils/logger";
import authRoutes from "./routes/auth";
import leadsRoutes from "./routes/leads";
import studentsRoutes from "./routes/students";
import staffRoutes from "./routes/staff";
import attendanceRoutes from "./routes/attendance";
import invoicesRoutes from "./routes/invoices";
import batchesRoutes from "./routes/batches";
import schedulesRoutes from "./routes/schedules";

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;

// ── Middleware ──────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: false, // disable for API
  crossOriginEmbedderPolicy: false,
}));
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true,
}));
app.use(express.json());

// Rate limiting — general + strict for auth
const limiter     = rateLimit({ windowMs: 15 * 60 * 1000, max: 100, standardHeaders: true, legacyHeaders: false });
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10,  standardHeaders: true, legacyHeaders: false, message: { status: "error", message: "Too many requests, please try again later." } });
app.use("/api/",        limiter);
app.use("/api/v1/auth", authLimiter);

// HTTP logging via Winston
const morganStream = { write: (msg: string) => logger.http(msg.trim()) };
app.use(morgan(":method :url :status - :response-time ms", { stream: morganStream }));

// ── Routes ──────────────────────────────────────────────────
app.use("/api/v1/auth",       authRoutes);
app.use("/api/v1/leads",      leadsRoutes);
app.use("/api/v1/students",   studentsRoutes);
app.use("/api/v1/staff",      staffRoutes);
app.use("/api/v1/attendance", attendanceRoutes);
app.use("/api/v1/invoices",   invoicesRoutes);
app.use("/api/v1/batches",    batchesRoutes);
app.use("/api/v1/schedules",  schedulesRoutes);

// ── Health Check ────────────────────────────────────────────
app.get("/api/v1/health", async (_req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "success", message: "E-CRM API healthy.", timestamp: new Date().toISOString() });
  } catch (err: any) {
    res.status(500).json({ status: "error", message: "DB check failed.", error: err.message });
  }
});

// ── Error handler ───────────────────────────────────────────
app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  logger.error(`${req.method} ${req.url} — ${err.message}`);
  res.status(500).json({ status: "error", message: err.message });
});

app.listen(PORT, () => logger.info(`E-CRM API running on http://localhost:${PORT}`));

process.on("SIGINT", async () => {
  await prisma.$disconnect();
  logger.info("DB disconnected. Bye.");
  process.exit(0);
});

export { app, prisma };
