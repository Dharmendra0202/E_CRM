import { prisma } from "../utils/prisma";
import { Router, Response } from "express";

import { authenticate, authorize, AuthRequest } from "../middleware/auth";

const router = Router();

// ══════════════════════════════════════════════════════════════
// GET /api/v1/roles?org_id= — list roles for an organization
// ══════════════════════════════════════════════════════════════
router.get("/", authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { org_id } = req.query as any;

    const roles = await prisma.role.findMany({
      where: org_id ? { organizationId: org_id } : {},
      include: {
        permissions: { include: { permission: true } },
        _count: { select: { members: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    res.json({
      status: "success",
      data: roles.map((r) => ({
        id: r.id,
        name: r.name,
        slug: r.slug,
        description: r.description,
        isSystem: r.isSystem,
        memberCount: r._count.members,
        permissions: r.permissions.map((rp) => ({
          module: rp.permission.module,
          action: rp.permission.action,
        })),
      })),
    });
  } catch (err: any) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

// ══════════════════════════════════════════════════════════════
// POST /api/v1/roles — create custom role
// ══════════════════════════════════════════════════════════════
router.post("/", authenticate, authorize("ADMIN"), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { org_id, name, slug, description, permissions } = req.body;

    if (!org_id || !name || !slug) {
      res.status(400).json({ status: "error", message: "org_id, name, and slug are required." });
      return;
    }

    const role = await prisma.role.create({
      data: {
        organizationId: org_id,
        name,
        slug,
        description: description || null,
        isSystem: false,
      },
    });

    // Assign permissions if provided
    if (permissions?.length) {
      for (const perm of permissions) {
        const permission = await prisma.permission.findFirst({
          where: { module: perm.module, action: perm.action },
        });
        if (permission) {
          await prisma.rolePermission.create({
            data: { roleId: role.id, permissionId: permission.id },
          });
        }
      }
    }

    res.status(201).json({ status: "success", data: role });
  } catch (err: any) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

// ══════════════════════════════════════════════════════════════
// PUT /api/v1/roles/:id — update role
// ══════════════════════════════════════════════════════════════
router.put("/:id", authenticate, authorize("ADMIN"), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, description, permissions } = req.body;
    const roleId = req.params.id;

    const role = await prisma.role.findUnique({ where: { id: roleId } });
    if (!role) {
      res.status(404).json({ status: "error", message: "Role not found." });
      return;
    }

    // Update basic info
    await prisma.role.update({
      where: { id: roleId },
      data: { ...(name && { name }), ...(description !== undefined && { description }) },
    });

    // Update permissions if provided
    if (permissions) {
      // Remove all existing permissions
      await prisma.rolePermission.deleteMany({ where: { roleId } });

      // Add new permissions
      for (const perm of permissions) {
        const permission = await prisma.permission.findFirst({
          where: { module: perm.module, action: perm.action },
        });
        if (permission) {
          await prisma.rolePermission.create({
            data: { roleId, permissionId: permission.id },
          });
        }
      }
    }

    const updated = await prisma.role.findUnique({
      where: { id: roleId },
      include: { permissions: { include: { permission: true } } },
    });

    res.json({ status: "success", data: updated });
  } catch (err: any) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

// ══════════════════════════════════════════════════════════════
// DELETE /api/v1/roles/:id — delete custom role
// ══════════════════════════════════════════════════════════════
router.delete("/:id", authenticate, authorize("ADMIN"), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const role = await prisma.role.findUnique({ where: { id: req.params.id } });
    if (!role) {
      res.status(404).json({ status: "error", message: "Role not found." });
      return;
    }
    if (role.isSystem) {
      res.status(403).json({ status: "error", message: "System roles cannot be deleted." });
      return;
    }

    await prisma.role.delete({ where: { id: req.params.id } });
    res.json({ status: "success", message: "Role deleted." });
  } catch (err: any) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

// ══════════════════════════════════════════════════════════════
// GET /api/v1/roles/permissions — list all available permissions
// ══════════════════════════════════════════════════════════════
router.get("/permissions", authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const permissions = await prisma.permission.findMany({ orderBy: [{ module: "asc" }, { action: "asc" }] });

    // Group by module
    const grouped: Record<string, any[]> = {};
    for (const p of permissions) {
      if (!grouped[p.module]) grouped[p.module] = [];
      grouped[p.module].push({ id: p.id, action: p.action, description: p.description });
    }

    res.json({ status: "success", data: grouped });
  } catch (err: any) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

// ══════════════════════════════════════════════════════════════
// GET /api/v1/roles/members?org_id= — list org members
// ══════════════════════════════════════════════════════════════
router.get("/members", authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { org_id } = req.query as any;

    const members = await prisma.orgMember.findMany({
      where: org_id ? { organizationId: org_id } : {},
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true, role: true, createdAt: true } },
        role: true,
      },
      orderBy: { joinedAt: "desc" },
    });

    res.json({
      status: "success",
      data: members.map((m) => ({
        id: m.id,
        userId: m.user.id,
        name: `${m.user.firstName} ${m.user.lastName}`,
        email: m.user.email,
        phone: m.user.phone,
        role: m.role.name,
        roleSlug: m.role.slug,
        status: m.status,
        joinedAt: m.joinedAt,
      })),
    });
  } catch (err: any) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

// ══════════════════════════════════════════════════════════════
// PUT /api/v1/roles/members/:id — update member role/status
// ══════════════════════════════════════════════════════════════
router.put("/members/:id", authenticate, authorize("ADMIN"), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { roleId, status } = req.body;
    const memberId = req.params.id;

    const member = await prisma.orgMember.update({
      where: { id: memberId },
      data: {
        ...(roleId && { roleId }),
        ...(status && { status }),
      },
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
        role: true,
      },
    });

    res.json({ status: "success", data: member });
  } catch (err: any) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

export default router;
