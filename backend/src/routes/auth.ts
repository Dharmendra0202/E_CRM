import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { z } from "zod";
import { PrismaClient } from "@prisma/client";
import { sendVerificationEmail, sendPasswordResetEmail } from "../utils/email";

const router = Router();
const prisma = new PrismaClient();

// ── Zod Schemas ─────────────────────────────────────────────
const LoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const RegisterSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  role: z.enum(["ADMIN", "TEACHER", "STUDENT", "PARENT"]),
  phone: z.string().optional(),
});

const ForgotSchema = z.object({
  email: z.string().email("Invalid email address"),
});

const ResetSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

// ── Helpers ──────────────────────────────────────────────────
const signAccessToken = (user: { id: string; role: string; email: string }) =>
  jwt.sign(user, process.env.JWT_SECRET || "secret", { expiresIn: "15m" } as any);

const signRefreshToken = (userId: string) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET || "secret", { expiresIn: "7d" } as any);

const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_DURATION_MINUTES = 15;

// ── POST /auth/register ──────────────────────────────────────
router.post("/register", async (req: Request, res: Response): Promise<void> => {
  const parsed = RegisterSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ status: "error", message: parsed.error.issues[0].message });
    return;
  }
  const { email, password, firstName, lastName, role, phone } = parsed.data;
  try {
    const exists = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (exists) {
      res.status(409).json({ status: "error", message: "Email already registered." });
      return;
    }
    const hash = await bcrypt.hash(password, 12);
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(), passwordHash: hash,
        firstName, lastName, role, phone,
        verificationToken, verificationExpiry,
        emailVerified: false,
      },
    });

    // Send verification email (non-blocking)
    sendVerificationEmail(user.email, user.firstName, verificationToken).catch(console.error);

    res.status(201).json({
      status: "success",
      message: "Account created. Please check your email to verify your account.",
      user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role },
    });
  } catch (err: any) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

// ── POST /auth/login ─────────────────────────────────────────
router.post("/login", async (req: Request, res: Response): Promise<void> => {
  const parsed = LoginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ status: "error", message: parsed.error.issues[0].message });
    return;
  }
  const { email, password } = parsed.data;
  try {
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) {
      res.status(401).json({ status: "error", message: "Invalid email or password." });
      return;
    }

    // Check account lock
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const minutesLeft = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
      res.status(423).json({ status: "error", message: `Account locked. Try again in ${minutesLeft} minute(s).` });
      return;
    }

    // Check email verification
    if (!user.emailVerified) {
      res.status(403).json({ status: "error", code: "EMAIL_NOT_VERIFIED", message: "Please verify your email before logging in." });
      return;
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      const attempts = user.loginAttempts + 1;
      const lockData = attempts >= MAX_LOGIN_ATTEMPTS
        ? { loginAttempts: 0, lockedUntil: new Date(Date.now() + LOCK_DURATION_MINUTES * 60 * 1000) }
        : { loginAttempts: attempts };
      await prisma.user.update({ where: { id: user.id }, data: lockData });
      const remaining = MAX_LOGIN_ATTEMPTS - attempts;
      res.status(401).json({
        status: "error",
        message: attempts >= MAX_LOGIN_ATTEMPTS
          ? `Account locked for ${LOCK_DURATION_MINUTES} minutes after too many failed attempts.`
          : `Invalid email or password. ${remaining} attempt(s) remaining.`,
      });
      return;
    }

    // Reset login attempts on success
    const refreshToken = signRefreshToken(user.id);
    await prisma.user.update({ where: { id: user.id }, data: { loginAttempts: 0, lockedUntil: null, refreshToken } });

    const accessToken = signAccessToken({ id: user.id, role: user.role, email: user.email });

    res.json({
      status: "success",
      token: accessToken,
      refreshToken,
      user: { id: user.id, email: user.email, role: user.role, firstName: user.firstName, lastName: user.lastName },
    });
  } catch (err: any) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

// ── GET /auth/verify/:token ──────────────────────────────────
router.get("/verify/:token", async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findFirst({
      where: { verificationToken: req.params.token, verificationExpiry: { gte: new Date() } },
    });
    if (!user) {
      res.status(400).json({ status: "error", message: "Verification link is invalid or has expired." });
      return;
    }
    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true, verificationToken: null, verificationExpiry: null },
    });
    res.json({ status: "success", message: "Email verified successfully. You can now log in." });
  } catch (err: any) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

// ── POST /auth/resend-verification ───────────────────────────
router.post("/resend-verification", async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body;
  if (!email) { res.status(400).json({ status: "error", message: "Email is required." }); return; }
  try {
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user || user.emailVerified) {
      res.json({ status: "success", message: "If this email exists and is unverified, a new link has been sent." });
      return;
    }
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await prisma.user.update({ where: { id: user.id }, data: { verificationToken, verificationExpiry } });
    sendVerificationEmail(user.email, user.firstName, verificationToken).catch(console.error);
    res.json({ status: "success", message: "Verification email sent. Please check your inbox." });
  } catch (err: any) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

// ── POST /auth/forgot-password ───────────────────────────────
router.post("/forgot-password", async (req: Request, res: Response): Promise<void> => {
  const parsed = ForgotSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ status: "error", message: parsed.error.issues[0].message }); return; }
  try {
    const user = await prisma.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
    // Always return success to prevent email enumeration
    if (user) {
      const resetToken = crypto.randomBytes(32).toString("hex");
      const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1h
      await prisma.user.update({ where: { id: user.id }, data: { resetToken, resetTokenExpiry } });
      sendPasswordResetEmail(user.email, user.firstName, resetToken).catch(console.error);
    }
    res.json({ status: "success", message: "If that email exists, a password reset link has been sent." });
  } catch (err: any) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

// ── POST /auth/reset-password ────────────────────────────────
router.post("/reset-password", async (req: Request, res: Response): Promise<void> => {
  const parsed = ResetSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ status: "error", message: parsed.error.issues[0].message }); return; }
  const { token, password } = parsed.data;
  try {
    const user = await prisma.user.findFirst({
      where: { resetToken: token, resetTokenExpiry: { gte: new Date() } },
    });
    if (!user) {
      res.status(400).json({ status: "error", message: "Reset link is invalid or has expired." });
      return;
    }
    const hash = await bcrypt.hash(password, 12);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: hash, resetToken: null, resetTokenExpiry: null, loginAttempts: 0, lockedUntil: null },
    });
    res.json({ status: "success", message: "Password reset successful. You can now log in." });
  } catch (err: any) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

// ── POST /auth/refresh ───────────────────────────────────────
router.post("/refresh", async (req: Request, res: Response): Promise<void> => {
  const { refreshToken } = req.body;
  if (!refreshToken) { res.status(400).json({ status: "error", message: "Refresh token required." }); return; }
  try {
    const payload = jwt.verify(refreshToken, process.env.JWT_SECRET || "secret") as any;
    const user = await prisma.user.findFirst({ where: { id: payload.id, refreshToken } });
    if (!user) { res.status(401).json({ status: "error", message: "Invalid refresh token." }); return; }
    const newToken = signAccessToken({ id: user.id, role: user.role, email: user.email });
    const newRefresh = signRefreshToken(user.id);
    await prisma.user.update({ where: { id: user.id }, data: { refreshToken: newRefresh } });
    res.json({ status: "success", token: newToken, refreshToken: newRefresh });
  } catch {
    res.status(401).json({ status: "error", message: "Invalid or expired refresh token." });
  }
});

export default router;
