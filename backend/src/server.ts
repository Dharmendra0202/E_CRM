import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { prisma } from "./utils/prisma";
import logger from "./utils/logger";
import { sanitizeInput, requestId, securityHeaders } from "./middleware/security";
import authRoutes from "./routes/auth";
import leadsRoutes from "./routes/leads";
import studentsRoutes from "./routes/students";
import staffRoutes from "./routes/staff";
import attendanceRoutes from "./routes/attendance";
import invoicesRoutes from "./routes/invoices";
import batchesRoutes from "./routes/batches";
import schedulesRoutes from "./routes/schedules";
import organizationsRoutes from "./routes/organizations";
import rolesRoutes from "./routes/roles";
import homeworkRoutes from "./routes/homework";
import subjectsRoutes from "./routes/subjects";
import transportRoutes from "./routes/transport";
import libraryRoutes from "./routes/library";
import announcementsRoutes from "./routes/announcements";
import reportsRoutes from "./routes/reports";
import settingsRoutes from "./routes/settings";
import examsRoutes from "./routes/exams";
import marksheetsRoutes from "./routes/marksheets";
import notificationsRoutes from "./routes/notifications";

dotenv.config();

// ── Startup Validation ─────────────────────────────────────────
if (!process.env.JWT_SECRET) {
  console.error("FATAL: JWT_SECRET environment variable is not set. Server cannot start.");
  process.exit(1);
}
if (!process.env.DATABASE_URL) {
  console.error("FATAL: DATABASE_URL environment variable is not set. Server cannot start.");
  process.exit(1);
}

const app = express();
const httpServer = createServer(app);
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

// CORS - Environment-specific whitelist (rejects unknown origins)
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || "http://localhost:5173,http://localhost:3000")
  .split(",")
  .map(o => o.trim());

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, server-to-server)
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      logger.warn(`CORS blocked: ${origin}`);
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Request-ID"],
}));
app.use(express.json());
app.use(sanitizeInput);
app.use(requestId);
app.use(securityHeaders);

// Rate limiting — general + strict for auth
const limiter     = rateLimit({ windowMs: 15 * 60 * 1000, max: 500, standardHeaders: true, legacyHeaders: false, message: { status: "error", message: "Too many requests, please try again later." } });
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20,  standardHeaders: true, legacyHeaders: false, message: { status: "error", message: "Too many login attempts, please try again later." } });
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
app.use("/api/v1/organizations", organizationsRoutes);
app.use("/api/v1/roles",      rolesRoutes);
app.use("/api/v1/homework",   homeworkRoutes);
app.use("/api/v1/subjects",   subjectsRoutes);
app.use("/api/v1/transport",  transportRoutes);
app.use("/api/v1/library",    libraryRoutes);
app.use("/api/v1/announcements", announcementsRoutes);
app.use("/api/v1/reports",    reportsRoutes);
app.use("/api/v1/settings",   settingsRoutes);
app.use("/api/v1/exams",      examsRoutes);
app.use("/api/v1/marksheets", marksheetsRoutes);
app.use("/api/v1/notifications", notificationsRoutes);

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
