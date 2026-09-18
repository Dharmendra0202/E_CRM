import { prisma } from "../utils/prisma";
import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { z } from "zod";
import { OAuth2Client } from "google-auth-library";

import { sendVerificationEmail, sendPasswordResetEmail } from "../utils/email";
import { logAudit } from "../utils/auditLog";

const googleClient = new OAuth2Client();

const router = Router();

// Emails automatically granted ADMIN role on Google login.
// Configured via the ADMIN_EMAILS env var (comma-separated, case-insensitive),
// so the owner sets their own admin account without editing source code.
// e.g. ADMIN_EMAILS="owner@gmail.com,principal@gmail.com"
const ADMIN_EMAIL_ALLOWLIST = (process.env.ADMIN_EMAILS || "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

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
  jwt.sign(user, process.env.JWT_SECRET!, { expiresIn: "15m" } as any);

const signRefreshToken = (userId: string) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET!, { expiresIn: "7d" } as any);

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
    logAudit({ userId: user.id, userEmail: user.email, module: "auth", action: "LOGIN", metadata: { role: user.role } }, req);
  } catch (err: any) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

// ── POST /auth/demo ──────────────────────────────────────────
router.post("/demo", async (req: Request, res: Response): Promise<void> => {
  try {
    let user = await prisma.user.findUnique({ where: { email: "demo@ecrm.com" } });
    if (!user) {
      const hash = await bcrypt.hash("Demo@123456", 10);
      user = await prisma.user.create({
        data: {
          email: "demo@ecrm.com",
          firstName: "Dharmendra",
          lastName: "Admin",
          passwordHash: hash,
          role: "ADMIN",
          emailVerified: true,
        },
      });
    }
    const refreshToken = signRefreshToken(user.id);
    const accessToken = signAccessToken({ id: user.id, role: user.role, email: user.email });
    res.json({
      status: "success",
      token: accessToken,
      refreshToken,
      user: { id: user.id, email: user.email, role: user.role, firstName: user.firstName, lastName: user.lastName },
    });
  } catch (err: any) {
    const secret = process.env.JWT_SECRET || "fallback_secret";
    const token = jwt.sign({ id: "demo-user", role: "ADMIN", email: "demo@ecrm.com" }, secret, { expiresIn: "7d" });
    res.json({
      status: "success",
      token,
      user: { id: "demo-user", email: "demo@ecrm.com", role: "ADMIN", firstName: "Dharmendra", lastName: "Admin" },
    });
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
    const payload = jwt.verify(refreshToken, process.env.JWT_SECRET!) as any;
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



// ── GET /auth/profile ────────────────────────────────────────
router.get("/profile", async (req: Request, res: Response): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) { res.status(401).json({ status: "error", message: "Unauthorized." }); return; }
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true, email: true, firstName: true, lastName: true, role: true,
        phone: true, emailVerified: true, authProvider: true, createdAt: true,
        student: {
          select: {
            id: true, parentName: true, parentPhone: true, parentEmail: true,
            motherName: true, motherPhone: true, gender: true, address: true,
            dateOfBirth: true,
            enrollments: { include: { batch: { select: { id: true, name: true, subject: true } } }, where: { status: "ACTIVE" } },
          },
        },
        teacher: {
          select: { id: true, bio: true, qualification: true, hourlyRate: true },
        },
      },
    });
    if (!user) { res.status(404).json({ status: "error", message: "User not found." }); return; }
    res.json({ status: "success", data: user });
  } catch { res.status(401).json({ status: "error", message: "Invalid token." }); }
});

// ── PUT /auth/profile — Update own profile ───────────────────
router.put("/profile", async (req: Request, res: Response): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) { res.status(401).json({ status: "error", message: "Unauthorized." }); return; }
    const decoded = jwt.verify(authHeader.split(" ")[1], process.env.JWT_SECRET!) as any;

    const { firstName, lastName, phone, parentName, parentPhone, parentEmail, motherName, motherPhone, gender, address, bio, qualification } = req.body;

    // Update core User fields
    const updatedUser = await prisma.user.update({
      where: { id: decoded.id },
      data: {
        ...(firstName !== undefined && { firstName }),
        ...(lastName !== undefined && { lastName }),
        ...(phone !== undefined && { phone }),
      },
      select: { id: true, email: true, firstName: true, lastName: true, role: true, phone: true },
    });

    // Update Student-specific fields if user has a student profile
    if (updatedUser.role === "STUDENT") {
      const student = await prisma.student.findUnique({ where: { userId: decoded.id } });
      if (student) {
        await prisma.student.update({
          where: { id: student.id },
          data: {
            ...(parentName !== undefined && { parentName }),
            ...(parentPhone !== undefined && { parentPhone }),
            ...(parentEmail !== undefined && { parentEmail }),
            ...(motherName !== undefined && { motherName }),
            ...(motherPhone !== undefined && { motherPhone }),
            ...(gender !== undefined && { gender }),
            ...(address !== undefined && { address }),
          },
        });
      }
    }

    // Update Teacher-specific fields if user has a teacher profile
    if (updatedUser.role === "TEACHER") {
      const teacher = await prisma.teacher.findUnique({ where: { userId: decoded.id } });
      if (teacher) {
        await prisma.teacher.update({
          where: { id: teacher.id },
          data: {
            ...(bio !== undefined && { bio }),
            ...(qualification !== undefined && { qualification }),
          },
        });
      }
    }

    // Re-fetch the full profile to return
    const fullProfile = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true, email: true, firstName: true, lastName: true, role: true,
        phone: true, emailVerified: true, authProvider: true, createdAt: true,
        student: {
          select: {
            id: true, parentName: true, parentPhone: true, parentEmail: true,
            motherName: true, motherPhone: true, gender: true, address: true,
            dateOfBirth: true,
            enrollments: { include: { batch: { select: { id: true, name: true, subject: true } } }, where: { status: "ACTIVE" } },
          },
        },
        teacher: {
          select: { id: true, bio: true, qualification: true, hourlyRate: true },
        },
      },
    });

    logAudit({ userId: decoded.id, userEmail: updatedUser.email, module: "auth", action: "UPDATE", metadata: { updated: "profile" } }, req);

    res.json({ status: "success", message: "Profile updated successfully.", data: fullProfile });
  } catch (err: any) { res.status(500).json({ status: "error", message: err.message || "Failed to update profile." }); }
});

// ── PUT /auth/change-password ────────────────────────────────
router.put("/change-password", async (req: Request, res: Response): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) { res.status(401).json({ status: "error", message: "Unauthorized." }); return; }
    const decoded = jwt.verify(authHeader.split(" ")[1], process.env.JWT_SECRET!) as any;
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) { res.status(400).json({ status: "error", message: "currentPassword and newPassword required." }); return; }
    if (newPassword.length < 8) { res.status(400).json({ status: "error", message: "New password must be at least 8 characters." }); return; }
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user) { res.status(404).json({ status: "error", message: "User not found." }); return; }
    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) { res.status(401).json({ status: "error", message: "Current password is incorrect." }); return; }
    const hash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash: hash, refreshToken: null } });
    res.json({ status: "success", message: "Password changed successfully." });
  } catch { res.status(401).json({ status: "error", message: "Invalid token." }); }
});

// ── DELETE /auth/logout-all — terminate all sessions ─────────
router.delete("/logout-all", async (req: Request, res: Response): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) { res.status(401).json({ status: "error", message: "Unauthorized." }); return; }
    const decoded = jwt.verify(authHeader.split(" ")[1], process.env.JWT_SECRET!) as any;
    await prisma.user.update({ where: { id: decoded.id }, data: { refreshToken: null } });
    logAudit({ userId: decoded.id, module: "auth", action: "LOGOUT" }, req);
    res.json({ status: "success", message: "All sessions terminated." });
  } catch { res.status(401).json({ status: "error", message: "Invalid token." }); }
});



// ── POST /auth/google — Google OAuth login/register ──────────
router.post("/google", async (req: Request, res: Response): Promise<void> => {
  const { credential } = req.body;
  if (!credential) {
    res.status(400).json({ status: "error", message: "Google credential token is required." });
    return;
  }
  try {
    // Verify the Google ID token
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      res.status(401).json({ status: "error", message: "Invalid Google token." });
      return;
    }

    const { sub: googleId, email, given_name, family_name, email_verified } = payload;

    // Check if a user already exists with this Google ID
    let user = await prisma.user.findFirst({ where: { googleId } });

    if (!user) {
      // Check if a user with this email already exists (linked via email/password)
      user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });

      if (user) {
        // Link Google account to existing user
        user = await prisma.user.update({
          where: { id: user.id },
          data: { googleId, authProvider: user.authProvider === "local" ? "local+google" : user.authProvider, emailVerified: true },
        });
      } else {
        // NEW Google user — allowlisted emails become ADMIN, everyone else is a
        // STUDENT by default. Users can NEVER pick their own role (prevents anyone
        // from self-assigning ADMIN/TEACHER). Admins promote teachers/staff in the app.
        const isAllowlistedAdmin = ADMIN_EMAIL_ALLOWLIST.includes(email.toLowerCase());
        user = await prisma.user.create({
          data: {
            email: email.toLowerCase(),
            passwordHash: "", // No password for Google-only users
            firstName: given_name || "User",
            lastName: family_name || "",
            role: isAllowlistedAdmin ? "ADMIN" : "STUDENT",
            googleId,
            authProvider: "google",
            emailVerified: email_verified ?? true,
          },
        });
      }
    }

    // Enforce ADMIN for allowlisted owners on every login (fixes accounts created with any other role)
    if (user.role !== "ADMIN" && ADMIN_EMAIL_ALLOWLIST.includes(user.email.toLowerCase())) {
      user = await prisma.user.update({ where: { id: user.id }, data: { role: "ADMIN" } });
    }

    // Safety net: any legacy PENDING Google account is treated as STUDENT.
    // (Existing users keep their real DB role, so admin-enrolled teachers stay TEACHER.)
    if (user.role === "PENDING") {
      user = await prisma.user.update({ where: { id: user.id }, data: { role: "STUDENT" } });
    }

    // Issue JWT tokens
    const refreshToken = signRefreshToken(user.id);
    await prisma.user.update({ where: { id: user.id }, data: { refreshToken } });

    const accessToken = signAccessToken({ id: user.id, role: user.role, email: user.email });

    res.json({
      status: "success",
      token: accessToken,
      refreshToken,
      user: { id: user.id, email: user.email, role: user.role, firstName: user.firstName, lastName: user.lastName },
    });
  } catch (err: any) {
    res.status(401).json({ status: "error", message: err.message || "Google authentication failed." });
  }
});



// ── POST /auth/set-role — Set role for new Google users ──────────
router.post("/set-role", async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, role } = req.body;
    if (!userId || !role) { res.status(400).json({ status: "error", message: "userId and role required." }); return; }
    
    const validRoles = ["STUDENT", "TEACHER", "STAFF"];
    if (!validRoles.includes(role)) {
      res.status(400).json({ status: "error", message: "Role must be STUDENT, TEACHER, or STAFF." }); return;
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.role !== "PENDING") {
      res.status(400).json({ status: "error", message: "Invalid user or role already assigned." }); return;
    }

    const updated = await prisma.user.update({ where: { id: userId }, data: { role } });

    // Issue JWT tokens
    const refreshToken = signRefreshToken(updated.id);
    await prisma.user.update({ where: { id: updated.id }, data: { refreshToken } });
    const accessToken = signAccessToken({ id: updated.id, role: updated.role, email: updated.email });

    logAudit({ userId: updated.id, userEmail: updated.email, module: "auth", action: "CREATE", metadata: { role, provider: "google" } });

    res.json({
      status: "success",
      token: accessToken,
      refreshToken,
      user: { id: updated.id, email: updated.email, role: updated.role, firstName: updated.firstName, lastName: updated.lastName },
    });
  } catch (err: any) { res.status(500).json({ status: "error", message: err.message }); }
});



export default router;
