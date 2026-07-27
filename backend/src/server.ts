import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
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
const httpServer = createServer(app);
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;

// ── WebSocket Setup for Real-Time Updates ──────────────────
export const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  },
});

io.on("connection", (socket) => {
  logger.info(`Socket connected: ${socket.id}`);
  
  socket.on("join_batch", (batchId: string) => {
    socket.join(`batch_${batchId}`);
    logger.info(`Socket ${socket.id} joined batch_${batchId}`);
  });
  
  socket.on("leave_batch", (batchId: string) => {
    socket.leave(`batch_${batchId}`);
    logger.info(`Socket ${socket.id} left batch_${batchId}`);
  });
  
  socket.on("disconnect", () => {
    logger.info(`Socket disconnected: ${socket.id}`);
  });
});

// ── Middleware ──────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: false, // disable for API
  crossOriginEmbedderPolicy: false,
}));
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || /^http:\/\/localhost:\d+$/.test(origin)) {
      callback(null, true);
    } else {
      callback(null, true);
    }
  },
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

httpServer.listen(PORT, () => logger.info(`E-CRM API running on http://localhost:${PORT}`));

process.on("SIGINT", async () => {
  await prisma.$disconnect();
  io.close();
  logger.info("DB disconnected. WebSocket closed. Bye.");
  process.exit(0);
});

export { app, prisma };
