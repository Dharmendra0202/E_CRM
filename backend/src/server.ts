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
import { sanitizeInput, requestId, securityHeaders, payloadSizeCheck } from "./middleware/security";
import { verifyAccessToken } from "./middleware/auth";
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
import paymentsRoutes from "./routes/payments";
import onlineClassesRoutes from "./routes/onlineClasses";

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

// In production, refuse to start with a weak or sample JWT secret. A guessable
// secret lets anyone forge ADMIN tokens, so this is a hard fail rather than a warning.
if (process.env.NODE_ENV === "production") {
  const secret = process.env.JWT_SECRET;
  const KNOWN_WEAK = ["ecrm-super-secret-jwt-key-2026", "change-this-to-a-long-random-secret", "fallback_secret"];
  if (secret.length < 32 || KNOWN_WEAK.includes(secret)) {
    console.error(
      "FATAL: JWT_SECRET is too weak for production. Use a unique random value of at least 32 characters.\n" +
      "  Generate one with: node -e \"console.log(require('crypto').randomBytes(48).toString('hex'))\""
    );
    process.exit(1);
  }
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

/**
 * Socket.IO authentication.
 *
 * The connection was previously anonymous: any client could connect and emit
 * `join_batch` with an arbitrary batch id, then receive everything broadcast to
 * that room (attendance updates, schedule changes, announcements). Every socket
 * must now present a valid access token, and joining a batch room is checked
 * against that user's actual access.
 */
io.use((socket, next) => {
  const token =
    (socket.handshake.auth && (socket.handshake.auth as any).token) ||
    (typeof socket.handshake.query.token === "string" ? socket.handshake.query.token : undefined);

  if (!token) return next(new Error("Unauthorized: no token provided."));
  try {
    const user = verifyAccessToken(String(token));
    (socket.data as any).user = { id: user.id, role: user.role, email: user.email };
    next();
  } catch {
    next(new Error("Unauthorized: invalid or expired token."));
  }
});

/** Staff can observe any batch; a student/parent only their own enrolments. */
async function canJoinBatch(user: { id: string; role: string }, batchId: string): Promise<boolean> {
  const STAFF_ROLES = ["ADMIN", "SUPER_ADMIN", "TEACHER", "STAFF", "SUPPORT", "SALES", "BILLING"];
  if (STAFF_ROLES.includes(user.role)) return true;
  const enrolment = await prisma.batchEnrollment.findFirst({
    where: { batchId, student: { userId: user.id } },
    select: { id: true },
  });
  return enrolment !== null;
}

io.on("connection", (socket) => {
  const user = (socket.data as any).user as { id: string; role: string; email: string };
  logger.info(`Socket connected: ${socket.id} (user ${user.email}, ${user.role})`);

  socket.on("join_batch", async (batchId: string) => {
    if (!batchId || typeof batchId !== "string") return;
    try {
      if (!(await canJoinBatch(user, batchId))) {
        logger.warn(`Socket ${socket.id} (${user.email}) denied join batch_${batchId}`);
        socket.emit("join_denied", { batchId, message: "You do not have access to this batch." });
        return;
      }
      socket.join(`batch_${batchId}`);
      logger.info(`Socket ${socket.id} joined batch_${batchId}`);
    } catch (err: any) {
      logger.error(`join_batch failed for ${socket.id}: ${err.message}`);
    }
  });

  socket.on("leave_batch", (batchId: string) => {
    if (!batchId || typeof batchId !== "string") return;
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

// CORS - Environment-specific whitelist (rejects unknown origins).
// Includes Capacitor WebView origins so the Android APK can call the API.
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS ||
  "http://localhost:5173,http://localhost:3000,http://localhost,capacitor://localhost,https://localhost")
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
// Cap request bodies. express.json's own 100kb default is too small for the
// bulk student import, so raise it deliberately and reject anything larger
// before the body is parsed.
app.use(payloadSizeCheck(10));
app.use(express.json({ limit: "10mb" }));
app.use(sanitizeInput);
app.use(requestId);
app.use(securityHeaders);

// Behind a reverse proxy / PaaS load balancer (Railway, Render, Fly, Nginx),
// req.ip is the PROXY's address unless we trust the X-Forwarded-For header.
// Without this every client shares one rate-limit bucket: the 20-request auth
// limit would be consumed by the whole user base at once (a self-inflicted
// login outage) while a distributed attacker stays unaffected.
// Only enabled in production, where a proxy is actually in front of us —
// trusting the header locally would let anyone spoof their IP.
if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", Number(process.env.TRUST_PROXY_HOPS || 1));
}

// Rate limiting — general + strict for auth
const limiter     = rateLimit({ windowMs: 15 * 60 * 1000, max: 500, standardHeaders: true, legacyHeaders: false, message: { status: "error", message: "Too many requests, please try again later." } });
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20,  standardHeaders: true, legacyHeaders: false, message: { status: "error", message: "Too many login attempts, please try again later." } });
// Public, unauthenticated write endpoint — stricter than the general bucket.
// Each call creates a Lead + a LeadActivity and fans out a notification to every
// admin, so it is an easy DB-growth / notification-flood vector.
const inquiryLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 10, standardHeaders: true, legacyHeaders: false, message: { status: "error", message: "Too many inquiries submitted. Please try again later." } });
app.use("/api/",        limiter);
app.use("/api/v1/auth", authLimiter);
app.use("/api/v1/leads/inquiry", inquiryLimiter);

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
app.use("/api/v1/payments",      paymentsRoutes);
app.use("/api/v1/online-classes", onlineClassesRoutes);

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
// Log the real error server-side, but do NOT return err.message to the client in
// production: Prisma errors leak model names, column names and sometimes record
// values, which is useful reconnaissance for an attacker. The request id lets
// support correlate a user report with the server log.
app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  const reqId = req.headers["x-request-id"];
  logger.error(`${req.method} ${req.url} [${reqId}] — ${err.stack || err.message}`);

  // CORS rejections are a client-side mistake, not a server fault.
  if (/not allowed by CORS/i.test(err.message)) {
    res.status(403).json({ status: "error", message: "Origin not allowed." });
    return;
  }

  res.status(500).json({
    status: "error",
    message: process.env.NODE_ENV === "production"
      ? "An unexpected server error occurred. Please try again."
      : err.message,
    requestId: reqId,
  });
});

httpServer.listen(PORT, () => logger.info(`E-CRM API running on http://localhost:${PORT}`));

process.on("SIGINT", async () => {
  await prisma.$disconnect();
  io.close();
  logger.info("DB disconnected. WebSocket closed. Bye.");
  process.exit(0);
});

export { app, prisma };
