import { prisma } from "../utils/prisma";
import { Router, Response } from "express";

import { authenticate, authorize, AuthRequest } from "../middleware/auth";

const router = Router();

// GET /api/v1/settings — get organization settings (first org for current user)
router.get("/", authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const membership = await prisma.orgMember.findFirst({
      where: { userId: req.user!.id },
      include: {
        organization: {
          include: {
            campuses: true,
            departments: true,
            academicYears: { orderBy: { startDate: "desc" } },
          },
        },
      },
    });

    if (!membership) {
      // No org yet — return defaults
      res.json({
        status: "success",
        data: {
          organization: null,
          workingDays: [1, 2, 3, 4, 5, 6], // Mon-Sat
          holidays: [],
        },
      });
      return;
    }

    res.json({
      status: "success",
      data: {
        organization: membership.organization,
        workingDays: [1, 2, 3, 4, 5, 6],
        holidays: [],
      },
    });
  } catch (err: any) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

// PUT /api/v1/settings/organization — update org profile
router.put("/organization", authenticate, authorize("ADMIN"), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const membership = await prisma.orgMember.findFirst({ where: { userId: req.user!.id } });
    if (!membership) {
      res.status(404).json({ status: "error", message: "No organization found." });
      return;
    }

    const { name, email, phone, website, address, city, state, pincode, timezone, currency, language, logo } = req.body;

    const org = await prisma.organization.update({
      where: { id: membership.organizationId },
      data: {
        ...(name && { name }),
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
        ...(logo !== undefined && { logo }),
      },
    });

    res.json({ status: "success", data: org });
  } catch (err: any) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

// POST /api/v1/settings/departments — add department
router.post("/departments", authenticate, authorize("ADMIN"), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const membership = await prisma.orgMember.findFirst({ where: { userId: req.user!.id } });
    if (!membership) { res.status(404).json({ status: "error", message: "No organization." }); return; }

    const { name, code } = req.body;
    if (!name) { res.status(400).json({ status: "error", message: "name required." }); return; }

    const dept = await prisma.department.create({
      data: { organizationId: membership.organizationId, name, code: code || null },
    });
    res.status(201).json({ status: "success", data: dept });
  } catch (err: any) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

// DELETE /api/v1/settings/departments/:id
router.delete("/departments/:id", authenticate, authorize("ADMIN"), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await prisma.department.delete({ where: { id: req.params.id } });
    res.json({ status: "success", message: "Department deleted." });
  } catch (err: any) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

// POST /api/v1/settings/academic-years — add academic year
router.post("/academic-years", authenticate, authorize("ADMIN"), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const membership = await prisma.orgMember.findFirst({ where: { userId: req.user!.id } });
    if (!membership) { res.status(404).json({ status: "error", message: "No organization." }); return; }

    const { name, startDate, endDate, isCurrent } = req.body;
    if (!name || !startDate || !endDate) { res.status(400).json({ status: "error", message: "name, startDate, endDate required." }); return; }

    if (isCurrent) {
      await prisma.academicYear.updateMany({ where: { organizationId: membership.organizationId }, data: { isCurrent: false } });
    }

    const ay = await prisma.academicYear.create({
      data: { organizationId: membership.organizationId, name, startDate: new Date(startDate), endDate: new Date(endDate), isCurrent: isCurrent || false },
    });
    res.status(201).json({ status: "success", data: ay });
  } catch (err: any) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

export default router;
