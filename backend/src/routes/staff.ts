import { prisma } from "../utils/prisma";
import { Router, Response } from "express";

import bcrypt from "bcryptjs";
import crypto from "crypto";
import { authenticate, authorize, AuthRequest } from "../middleware/auth";

const router = Router();

/**
 * Password for an admin-provisioned staff/teacher account when the caller does
 * not supply one.
 *
 * The enrollment UI used to send a hardcoded "Staff@123" for every teacher and
 * staff member, and these accounts are created pre-verified — so knowing the
 * convention plus an email address was enough to sign in as any of them. An
 * unguessable random value is used instead; the account holder signs in with
 * Google or sets a password via "Forgot password".
 */
function generateProvisionalPassword(): string {
  return crypto.randomBytes(24).toString("base64url");
}

// GET /api/v1/staff
router.get("/", authenticate, authorize("ADMIN"), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const users = await prisma.user.findMany({
      where: { role: { in: ["ADMIN", "TEACHER", "SUPPORT", "SALES", "BILLING"] } },
      select: { id: true, email: true, firstName: true, lastName: true, role: true, phone: true, createdAt: true, teacher: { select: { id: true, qualification: true, hourlyRate: true, bio: true } } },
      orderBy: { createdAt: "desc" },
    });
    res.json({ status: "success", data: users });
  } catch (err: any) { res.status(500).json({ status: "error", message: err.message }); }
});

// POST /api/v1/staff
router.post("/", authenticate, authorize("ADMIN"), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { email, password, firstName, lastName, role, phone, qualification, hourlyRate, bio } = req.body;
    if (!email || !firstName || !lastName || !role) {
      res.status(400).json({ status: "error", message: "Required fields missing." }); return;
    }
    // Only ADMIN reaches this handler, so assigning a role here is intentional.
    // Restrict it to real staff roles so this can't be used to mint a STUDENT
    // record or an unknown role string.
    const ALLOWED_STAFF_ROLES = ["ADMIN", "TEACHER", "SUPPORT", "SALES", "BILLING"];
    if (!ALLOWED_STAFF_ROLES.includes(role)) {
      res.status(400).json({
        status: "error",
        message: `role must be one of: ${ALLOWED_STAFF_ROLES.join(", ")}.`,
      });
      return;
    }
    const exists = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (exists) { res.status(409).json({ status: "error", message: "Email already registered." }); return; }

    // `password` is optional. When omitted a random one is generated, so no
    // account is ever created with a shared, guessable default.
    const hash = await bcrypt.hash(password || generateProvisionalPassword(), 12);
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(), passwordHash: hash, firstName, lastName, role, phone,
        // Admin-created accounts are pre-verified (admin vouches for them), so the
        // teacher/staff can log in immediately via Google OR email+password without
        // hitting the "verify your email" gate.
        emailVerified: true,
        ...(role === "TEACHER" && qualification ? {
          teacher: { create: { qualification, hourlyRate: parseFloat(hourlyRate) || 0, bio } }
        } : {}),
      },
      include: { teacher: true },
    });
    res.status(201).json({ status: "success", data: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role } });
  } catch (err: any) { res.status(500).json({ status: "error", message: err.message }); }
});

// PATCH /api/v1/staff/:id
router.patch("/:id", authenticate, authorize("ADMIN"), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { firstName, lastName, phone, role } = req.body;
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { firstName, lastName, phone, role },
      select: { id: true, email: true, firstName: true, lastName: true, role: true, phone: true },
    });
    res.json({ status: "success", data: user });
  } catch (err: any) { res.status(500).json({ status: "error", message: err.message }); }
});

// DELETE /api/v1/staff/:id
router.delete("/:id", authenticate, authorize("ADMIN"), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await prisma.user.delete({ where: { id: req.params.id } });
    res.json({ status: "success", message: "Staff member deleted." });
  } catch (err: any) { res.status(500).json({ status: "error", message: err.message }); }
});

// GET /api/v1/staff/all-users — all registered login users for export
router.get("/all-users", authenticate, authorize("ADMIN"), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, email: true, firstName: true, lastName: true, phone: true, role: true, emailVerified: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    });
    const mapped = users.map(u => ({
      id: u.id,
      name: `${u.firstName} ${u.lastName}`,
      email: u.email,
      phone: u.phone || "",
      role: u.role,
      emailVerified: u.emailVerified ? "Yes" : "No",
      createdAt: u.createdAt?.toISOString().split("T")[0] || "",
    }));
    res.json({ status: "success", data: mapped });
  } catch (err: any) { res.status(500).json({ status: "error", message: err.message }); }
});

export default router;
