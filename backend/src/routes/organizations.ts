import { prisma } from "../utils/prisma";
import { Router, Response } from "express";

import { authenticate, authorize, AuthRequest } from "../middleware/auth";

const router = Router();

// ── Helper: generate slug from name ──
function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .substring(0, 50);
}

// ══════════════════════════════════════════════════════════════
// GET /api/v1/organizations — list user's organizations
// ══════════════════════════════════════════════════════════════
router.get("/", authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const memberships = await prisma.orgMember.findMany({
      where: { userId: req.user!.id },
      include: {
        organization: true,
        role: true,
      },
    });

    res.json({
      status: "success",
      data: memberships.map((m) => ({
        ...m.organization,
        role: m.role.name,
        roleSlug: m.role.slug,
        memberStatus: m.status,
      })),
    });
  } catch (err: any) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

// ══════════════════════════════════════════════════════════════
// GET /api/v1/organizations/:id — get single org details
// ══════════════════════════════════════════════════════════════
router.get("/:id", authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const org = await prisma.organization.findUnique({
      where: { id: req.params.id },
      include: {
        campuses: true,
        departments: true,
        academicYears: { orderBy: { startDate: "desc" } },
        members: {
          include: { user: { select: { id: true, firstName: true, lastName: true, email: true, role: true } }, role: true },
        },
      },
    });

    if (!org) {
      res.status(404).json({ status: "error", message: "Organization not found." });
      return;
    }

    res.json({ status: "success", data: org });
  } catch (err: any) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

// ══════════════════════════════════════════════════════════════
// POST /api/v1/organizations — create new organization (onboarding step 1)
// ══════════════════════════════════════════════════════════════
router.post("/", authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, type, email, phone, website, address, city, state, pincode } = req.body;

    if (!name) {
      res.status(400).json({ status: "error", message: "Organization name is required." });
      return;
    }

    // Generate unique slug
    let slug = slugify(name);
    const existing = await prisma.organization.findUnique({ where: { slug } });
    if (existing) slug = `${slug}-${Date.now().toString(36)}`;

    // Create organization
    const org = await prisma.organization.create({
      data: {
        name,
        slug,
        type: type || "COACHING",
        email: email || null,
        phone: phone || null,
        website: website || null,
        address: address || null,
        city: city || null,
        state: state || null,
        pincode: pincode || null,
        setupStep: 2,
      },
    });

    // Create default "Organization Admin" role
    const adminRole = await prisma.role.create({
      data: {
        organizationId: org.id,
        name: "Organization Admin",
        slug: "org_admin",
        description: "Full access to all organization features",
        isSystem: true,
      },
    });

    // Create default roles
    await prisma.role.createMany({
      data: [
        { organizationId: org.id, name: "Teacher", slug: "teacher", description: "Manage classes, attendance, homework", isSystem: true },
        { organizationId: org.id, name: "Student", slug: "student", description: "View own academic data", isSystem: true },
        { organizationId: org.id, name: "Parent", slug: "parent", description: "View child data", isSystem: true },
        { organizationId: org.id, name: "Accountant", slug: "accountant", description: "Manage fees and payments", isSystem: true },
        { organizationId: org.id, name: "Receptionist", slug: "receptionist", description: "Manage admissions and enquiries", isSystem: true },
      ],
    });

    // Add current user as org admin
    await prisma.orgMember.create({
      data: {
        userId: req.user!.id,
        organizationId: org.id,
        roleId: adminRole.id,
        status: "ACTIVE",
      },
    });

    res.status(201).json({ status: "success", data: org });
  } catch (err: any) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

// ══════════════════════════════════════════════════════════════
// PUT /api/v1/organizations/:id — update organization details
// ══════════════════════════════════════════════════════════════
router.put("/:id", authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, type, logo, email, phone, website, address, city, state, pincode, timezone, currency, language } = req.body;

    const org = await prisma.organization.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name }),
        ...(type && { type }),
        ...(logo !== undefined && { logo }),
        ...(email !== undefined && { email }),
        ...(phone !== undefined && { phone }),
        ...(website !== undefined && { website }),
        ...(address !== undefined && { address }),
        ...(city !== undefined && { city }),
        ...(state !== undefined && { state }),
        ...(pincode !== undefined && { pincode }),
        ...(timezone && { timezone }),
        ...(currency && { currency }),
        ...(language && { language }),
      },
    });

    res.json({ status: "success", data: org });
  } catch (err: any) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

// ══════════════════════════════════════════════════════════════
// POST /api/v1/organizations/:id/setup — advance setup wizard step
// ══════════════════════════════════════════════════════════════
router.post("/:id/setup", authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { step, data } = req.body;
    const orgId = req.params.id;

    switch (step) {
      case 2: // Campus Setup
        if (data.campuses?.length) {
          for (const campus of data.campuses) {
            await prisma.campus.create({
              data: { organizationId: orgId, name: campus.name, address: campus.address || null, city: campus.city || null, phone: campus.phone || null, isMain: campus.isMain || false },
            });
          }
        }
        break;

      case 3: // Academic Year
        if (data.academicYear) {
          await prisma.academicYear.create({
            data: { organizationId: orgId, name: data.academicYear.name, startDate: new Date(data.academicYear.startDate), endDate: new Date(data.academicYear.endDate), isCurrent: true },
          });
        }
        break;

      case 4: // Departments
        if (data.departments?.length) {
          await prisma.department.createMany({
            data: data.departments.map((d: any) => ({ organizationId: orgId, name: d.name, code: d.code || null })),
          });
        }
        break;

      case 5: // Complete Setup
        await prisma.organization.update({ where: { id: orgId }, data: { setupComplete: true, setupStep: 5 } });
        break;
    }

    // Advance step
    if (step < 5) {
      await prisma.organization.update({ where: { id: orgId }, data: { setupStep: step + 1 } });
    }

    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      include: { campuses: true, departments: true, academicYears: true },
    });

    res.json({ status: "success", data: org });
  } catch (err: any) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

// ══════════════════════════════════════════════════════════════
// POST /api/v1/organizations/:id/invite — invite a user
// ══════════════════════════════════════════════════════════════
router.post("/:id/invite", authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { email, roleSlug } = req.body;
    const orgId = req.params.id;

    if (!email || !roleSlug) {
      res.status(400).json({ status: "error", message: "email and roleSlug required." });
      return;
    }

    // Find the role
    const role = await prisma.role.findFirst({ where: { organizationId: orgId, slug: roleSlug } });
    if (!role) {
      res.status(404).json({ status: "error", message: `Role '${roleSlug}' not found.` });
      return;
    }

    // Find or check user exists
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(404).json({ status: "error", message: "User not found. They must register first." });
      return;
    }

    // Check if already a member
    const existing = await prisma.orgMember.findUnique({
      where: { userId_organizationId: { userId: user.id, organizationId: orgId } },
    });
    if (existing) {
      res.status(409).json({ status: "error", message: "User is already a member of this organization." });
      return;
    }

    const member = await prisma.orgMember.create({
      data: { userId: user.id, organizationId: orgId, roleId: role.id, status: "INVITED" },
      include: { user: { select: { firstName: true, lastName: true, email: true } }, role: true },
    });

    res.status(201).json({ status: "success", data: member });
  } catch (err: any) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

export default router;
