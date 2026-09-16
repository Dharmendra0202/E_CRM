import { prisma } from "../utils/prisma";
import { Router, Response, Request } from "express";
import { logAudit } from "../utils/auditLog";
import { notifyUsers } from "../utils/notify";

import { authenticate, authorize, AuthRequest } from "../middleware/auth";

const router = Router();

// ══════════════════════════════════════════════════════════════
// POST /api/v1/leads/inquiry — PUBLIC (no auth) landing-page inquiry
// Creates a lead and notifies every admin so they get pinged instantly.
// ══════════════════════════════════════════════════════════════
router.post("/inquiry", async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, phone, message, course } = req.body;
    if (!name || !email) {
      res.status(400).json({ status: "error", message: "Name and email are required." });
      return;
    }

    const lead = await prisma.lead.create({
      data: {
        name: String(name).trim(),
        email: String(email).trim().toLowerCase(),
        phone: phone ? String(phone).trim() : "",
        source: "Website Inquiry",
        notes: message ? String(message).trim() : null,
        course: course ? String(course).trim() : null,
        status: "NEW",
      },
    });

    await prisma.leadActivity.create({
      data: { leadId: lead.id, type: "NOTE", content: "New inquiry submitted from the website landing page." },
    });

    // Notify all admins in-app so they see the inquiry in their notification center
    const admins = await prisma.user.findMany({
      where: { role: { in: ["ADMIN", "SUPER_ADMIN"] } },
      select: { id: true },
    });
    await notifyUsers(
      admins.map((a) => a.id),
      {
        title: "New Website Inquiry",
        message: `${lead.name} (${lead.email}${lead.phone ? `, ${lead.phone}` : ""}) wants to reach you.${lead.notes ? ` "${lead.notes.slice(0, 120)}"` : ""}`,
        type: "GENERAL",
        priority: "HIGH",
        link: "/leads",
      }
    );

    res.status(201).json({ status: "success", message: "Inquiry received. Our team will reach out to you shortly." });
  } catch (err: any) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

// ══════════════════════════════════════════════════════════════
// GET /api/v1/leads — list leads with filters
// ══════════════════════════════════════════════════════════════
router.get("/", authenticate, authorize("ADMIN", "TEACHER"), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, source, search, page = "1", limit = "50" } = req.query as any;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where: any = {};
    if (status) where.status = status;
    if (source) where.source = source;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: "desc" },
        include: { activities: { take: 1, orderBy: { createdAt: "desc" } } },
      }),
      prisma.lead.count({ where }),
    ]);

    res.json({
      status: "success",
      pagination: { page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)), totalItems: total },
      data,
    });
  } catch (err: any) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

// ══════════════════════════════════════════════════════════════
// GET /api/v1/leads/stats — pipeline stats for dashboard
// ══════════════════════════════════════════════════════════════
router.get("/stats", authenticate, authorize("ADMIN", "TEACHER"), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const counts = await prisma.lead.groupBy({ by: ["status"], _count: { id: true } });
    const total = await prisma.lead.count();
    const thisMonth = await prisma.lead.count({
      where: { createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } },
    });
    const pendingFollowUps = await prisma.lead.count({
      where: { nextFollowUp: { lte: new Date() }, status: { notIn: ["ENROLLED", "LOST"] } },
    });

    const pipeline: Record<string, number> = {};
    for (const c of counts) pipeline[c.status] = c._count.id;

    const enrolled = pipeline["ENROLLED"] || 0;
    const conversionRate = total > 0 ? Math.round((enrolled / total) * 100) : 0;

    res.json({
      status: "success",
      data: { total, thisMonth, pendingFollowUps, conversionRate, pipeline },
    });
  } catch (err: any) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

// ══════════════════════════════════════════════════════════════
// GET /api/v1/leads/:id — single lead with full activities
// ══════════════════════════════════════════════════════════════
router.get("/:id", authenticate, authorize("ADMIN", "TEACHER"), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const lead = await prisma.lead.findUnique({
      where: { id: req.params.id },
      include: {
        activities: { orderBy: { createdAt: "desc" }, take: 50 },
        assignedAdmin: { select: { firstName: true, lastName: true, email: true } },
      },
    });
    if (!lead) { res.status(404).json({ status: "error", message: "Lead not found." }); return; }
    res.json({ status: "success", data: lead });
  } catch (err: any) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

// ══════════════════════════════════════════════════════════════
// POST /api/v1/leads — create new lead
// ══════════════════════════════════════════════════════════════
router.post("/", authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, email, phone, source, notes, course, expectedJoining } = req.body;
    if (!name || !email) { res.status(400).json({ status: "error", message: "Name and email required." }); return; }

    const lead = await prisma.lead.create({
      data: {
        name,
        email,
        phone: phone || "",
        source: source || "Manual Entry",
        notes: notes || null,
        course: course || null,
        expectedJoining: expectedJoining ? new Date(expectedJoining) : null,
        status: "NEW",
      },
    });

    // Auto-create activity
    await prisma.leadActivity.create({
      data: { leadId: lead.id, type: "STATUS_CHANGE", content: "Lead created with status NEW", createdBy: req.user?.id },
    });

    res.status(201).json({ status: "success", data: lead });
  } catch (err: any) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

// ══════════════════════════════════════════════════════════════
// PATCH /api/v1/leads/:id — update lead fields
// ══════════════════════════════════════════════════════════════
router.patch("/:id", authenticate, authorize("ADMIN"), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, name, email, phone, source, notes, course, nextFollowUp, expectedJoining, assignedAdminId } = req.body;
    const oldLead = await prisma.lead.findUnique({ where: { id: req.params.id } });
    if (!oldLead) { res.status(404).json({ status: "error", message: "Lead not found." }); return; }

    const lead = await prisma.lead.update({
      where: { id: req.params.id },
      data: {
        ...(status && { status }),
        ...(name && { name }),
        ...(email && { email }),
        ...(phone !== undefined && { phone }),
        ...(source && { source }),
        ...(notes !== undefined && { notes }),
        ...(course !== undefined && { course }),
        ...(nextFollowUp !== undefined && { nextFollowUp: nextFollowUp ? new Date(nextFollowUp) : null }),
        ...(expectedJoining !== undefined && { expectedJoining: expectedJoining ? new Date(expectedJoining) : null }),
        ...(assignedAdminId !== undefined && { assignedAdminId }),
      },
    });

    // Log status change as activity
    if (status && status !== oldLead.status) {
      await prisma.leadActivity.create({
        data: {
          leadId: lead.id,
          type: "STATUS_CHANGE",
          content: `Status changed from ${oldLead.status} to ${status}`,
          createdBy: req.user?.id,
        },
      });
    }

    res.json({ status: "success", data: lead });
  } catch (err: any) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

// ══════════════════════════════════════════════════════════════
// POST /api/v1/leads/:id/activities — add note/activity
// ══════════════════════════════════════════════════════════════
router.post("/:id/activities", authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { type, content, metadata } = req.body;
    if (!type || !content) { res.status(400).json({ status: "error", message: "type and content required." }); return; }

    const activity = await prisma.leadActivity.create({
      data: {
        leadId: req.params.id,
        type,
        content,
        metadata: metadata ? JSON.stringify(metadata) : null,
        createdBy: req.user?.id,
      },
    });

    // If follow-up type, update lead's nextFollowUp
    if (type === "FOLLOW_UP" && metadata?.followUpDate) {
      await prisma.lead.update({
        where: { id: req.params.id },
        data: { nextFollowUp: new Date(metadata.followUpDate) },
      });
    }

    res.status(201).json({ status: "success", data: activity });
  } catch (err: any) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

// ══════════════════════════════════════════════════════════════
// GET /api/v1/leads/:id/activities — get lead timeline
// ══════════════════════════════════════════════════════════════
router.get("/:id/activities", authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const activities = await prisma.leadActivity.findMany({
      where: { leadId: req.params.id },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    res.json({ status: "success", data: activities });
  } catch (err: any) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

// ══════════════════════════════════════════════════════════════
// DELETE /api/v1/leads/:id — delete lead
// ══════════════════════════════════════════════════════════════
router.delete("/:id", authenticate, authorize("ADMIN"), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await prisma.lead.update({
      where: { id: req.params.id },
      data: { deletedAt: new Date(), deletedBy: (req as any).user?.id || null },
    });
    logAudit({ module: "leads", action: "DELETE", entityId: req.params.id }, req);
    res.json({ status: "success", message: "Lead archived." });
  } catch (err: any) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

export default router;
