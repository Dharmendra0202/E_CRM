import { prisma } from "../utils/prisma";
import { Router, Response } from "express";

import { authenticate, authorize, AuthRequest } from "../middleware/auth";
import bcrypt from "bcryptjs";
import { sendStudentOnboardingEmail } from "../utils/email";
import { logAudit } from "../utils/auditLog";

const router = Router();

// GET /api/v1/students
router.get("/", authenticate, authorize("ADMIN", "TEACHER"), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const students = await prisma.student.findMany({
      where: { deletedAt: null },
      include: { 
        user: { select: { email: true, firstName: true, lastName: true, phone: true } }, 
        enrollments: { include: { batch: true } },
        invoices: { orderBy: { dueDate: "desc" } }
      },
      orderBy: { createdAt: "desc" },
    });
    res.json({ status: "success", data: students });
  } catch (err: any) { res.status(500).json({ status: "error", message: err.message }); }
});

// GET /api/v1/students/:id
router.get("/:id", authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const student = await prisma.student.findUnique({
      where: { id: req.params.id },
      include: { user: true, enrollments: { include: { batch: { include: { teacher: { include: { user: true } } } } } }, invoices: true, attendance: { orderBy: { classDate: "desc" }, take: 20 } },
    });
    if (!student) { res.status(404).json({ status: "error", message: "Student not found." }); return; }
    res.json({ status: "success", data: student });
  } catch (err: any) { res.status(500).json({ status: "error", message: err.message }); }
});

// POST /api/v1/students
router.post("/", authenticate, authorize("ADMIN"), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { parentName, parentPhone, parentEmail, dateOfBirth, firstName, lastName, email, phone, batch, feeAmount, motherName, motherPhone, gender, address } = req.body;
    if (!parentName || !parentPhone || !parentEmail || !dateOfBirth || !firstName || !email) {
      res.status(400).json({ status: "error", message: "Required fields missing." }); return;
    }
    const finalLastName = lastName || firstName;
    
    // 1. Create a NEW User account for this student (each student gets their own user)
    let user: any;
    const existingUser = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    
    if (existingUser) {
      // Email already exists — check if it's a student with no changes needed or a different person
      const existingStudent = await prisma.student.findUnique({ where: { userId: existingUser.id } });
      
      if (existingStudent) {
        // Another student already uses this email — create a unique email for the new student
        const uniqueEmail = `${firstName.toLowerCase()}.${Date.now()}@student.local`;
        const hash = await bcrypt.hash("Student@123", 12);
        user = await prisma.user.create({
          data: {
            email: uniqueEmail,
            passwordHash: hash,
            firstName,
            lastName: finalLastName,
            role: "STUDENT",
            phone: phone || null,
            emailVerified: true,
          }
        });
      } else {
        // User exists but has no student profile — link them
        user = await prisma.user.update({
          where: { id: existingUser.id },
          data: { firstName, lastName: finalLastName, phone: phone || existingUser.phone },
        });
      }
    } else {
      // Brand new email — create fresh user
      const hash = await bcrypt.hash("Student@123", 12);
      user = await prisma.user.create({
        data: {
          email: email.toLowerCase(),
          passwordHash: hash,
          firstName,
          lastName: finalLastName,
          role: "STUDENT",
          phone: phone || null,
          emailVerified: true,
        }
      });
    }

    // 2. Always create a NEW student profile for this enrollment
    let student: any = await prisma.student.create({
      data: { userId: user.id, parentName, parentPhone, parentEmail, motherName: motherName || null, motherPhone: motherPhone || null, gender: gender || null, address: address || null, dateOfBirth: new Date(dateOfBirth) },
      include: { user: true, enrollments: { include: { batch: true } }, invoices: true }
    });

    // 3. Batch enrollment if a batch is specified
    if (batch) {
      let foundBatch = await prisma.batch.findFirst({
        where: { name: batch }
      });
      if (!foundBatch) {
        // Auto-create the batch if it doesn't exist
        const now = new Date();
        const endDate = new Date(now.getFullYear() + 1, 2, 31);
        // Find or create a default teacher
        let teacher = await prisma.teacher.findFirst();
        if (!teacher) {
          // Create a placeholder teacher from the admin user
          const adminUser = await prisma.user.findFirst({ where: { role: "ADMIN" } });
          if (adminUser) {
            teacher = await prisma.teacher.create({
              data: { userId: adminUser.id, qualification: "Admin", hourlyRate: 0 }
            });
          }
        }
        if (teacher) {
          foundBatch = await prisma.batch.create({
            data: {
              name: batch,
              subject: "General",
              startDate: now,
              endDate,
              capacity: 60,
              teacherId: teacher.id,
              feeAmount: feeAmount ? parseFloat(feeAmount) : 0,
              feeFrequency: "MONTHLY",
            }
          });
        }
      }
      if (foundBatch) {
        // Check if already enrolled in this batch
        const existingEnrollment = await prisma.batchEnrollment.findFirst({
          where: { studentId: student.id, batchId: foundBatch.id }
        });
        if (!existingEnrollment) {
          await prisma.batchEnrollment.create({
            data: {
              studentId: student.id,
              batchId: foundBatch.id,
              status: "ACTIVE"
            }
          });
        }
      }
    }

    // 4. Create invoice if feeAmount is specified
    if (feeAmount) {
      const parsedFee = parseFloat(feeAmount);
      if (!isNaN(parsedFee) && parsedFee > 0) {
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 30);
        await prisma.invoice.create({
          data: {
            studentId: student.id,
            totalAmount: parsedFee,
            dueDate,
            status: "UNPAID"
          }
        });
      }
    }

    // Refetch the updated student with its relations
    const completedStudent = await prisma.student.findUnique({
      where: { id: student.id },
      include: {
        user: { select: { email: true, firstName: true, lastName: true, phone: true } },
        enrollments: { include: { batch: true } },
        invoices: { orderBy: { dueDate: "desc" } }
      }
    });

    // Generate WhatsApp group invite link for batch
    const sanitizeBatch = (batch || "Class").replace(/\s+/g, "_").toUpperCase();
    const whatsappLink = `https://chat.whatsapp.com/ECRM_BATCH_${sanitizeBatch}`;

    // Send onboarding email (non-blocking)
    sendStudentOnboardingEmail(
      email.toLowerCase(),
      `${firstName} ${finalLastName}`,
      batch || "Standard Batch",
      whatsappLink,
      feeAmount ? parseFloat(feeAmount) : 8500
    ).catch(console.error);

    res.status(201).json({
      status: "success",
      data: completedStudent,
      whatsappLink,
      onboardingEmailSent: true
    });

    // Audit log
    logAudit({ module: "students", action: "CREATE", entityId: completedStudent?.id, newValue: { firstName, lastName: finalLastName, email, batch } }, req);
  } catch (err: any) { res.status(500).json({ status: "error", message: err.message }); }
});

// PATCH /api/v1/students/:id
router.patch("/:id", authenticate, authorize("ADMIN"), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { parentName, parentPhone, parentEmail, dateOfBirth } = req.body;
    const student = await prisma.student.update({
      where: { id: req.params.id },
      data: { parentName, parentPhone, parentEmail, ...(dateOfBirth && { dateOfBirth: new Date(dateOfBirth) }) },
    });
    res.json({ status: "success", data: student });
  } catch (err: any) { res.status(500).json({ status: "error", message: err.message }); }
});

// DELETE /api/v1/students/:id — soft delete (preserves financial records)
router.delete("/:id", authenticate, authorize("ADMIN"), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const student = await prisma.student.findUnique({ where: { id: req.params.id } });
    if (!student) { res.status(404).json({ status: "error", message: "Student not found." }); return; }
    // Soft delete — mark as deleted but preserve record and all related financial data
    await prisma.student.update({
      where: { id: req.params.id },
      data: { deletedAt: new Date(), deletedBy: (req as any).user?.id || null },
    });
    // Audit log
    logAudit({ module: "students", action: "DELETE", entityId: req.params.id, previousValue: { name: student.parentName } }, req);
    res.json({ status: "success", message: "Student archived (soft deleted). Financial records preserved." });
  } catch (err: any) { res.status(500).json({ status: "error", message: err.message }); }
});

// ══════════════════════════════════════════════════════════════
// GET /api/v1/students/stats — student overview stats
// ══════════════════════════════════════════════════════════════
router.get("/stats", authenticate, authorize("ADMIN", "TEACHER"), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const total = await prisma.student.count();
    const activeEnrollments = await prisma.batchEnrollment.count({ where: { status: "ACTIVE" } });
    const thisMonth = await prisma.student.count({
      where: { createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } },
    });

    // Attendance stats
    const totalAttendance = await prisma.attendance.count();
    const presentCount = await prisma.attendance.count({ where: { status: { in: ["PRESENT", "LATE"] } } });
    const avgAttendance = totalAttendance > 0 ? Math.round((presentCount / totalAttendance) * 100) : 0;

    // Fee stats
    const unpaidInvoices = await prisma.invoice.count({ where: { status: "UNPAID" } });

    res.json({
      status: "success",
      data: { total, activeEnrollments, thisMonth, avgAttendance, unpaidInvoices },
    });
  } catch (err: any) { res.status(500).json({ status: "error", message: err.message }); }
});

// ══════════════════════════════════════════════════════════════
// GET /api/v1/students/:id/profile — full student profile
// ══════════════════════════════════════════════════════════════
router.get("/:id/profile", authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const student = await prisma.student.findUnique({
      where: { id: req.params.id },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true, createdAt: true } },
        enrollments: {
          include: { batch: { include: { teacher: { include: { user: { select: { firstName: true, lastName: true } } } } } } },
          orderBy: { enrolledAt: "desc" },
        },
        invoices: {
          include: { payments: true },
          orderBy: { dueDate: "desc" },
        },
        attendance: {
          orderBy: { classDate: "desc" },
          take: 50,
          include: { schedule: { select: { batch: { select: { name: true } } } } },
        },
      },
    });

    if (!student) { res.status(404).json({ status: "error", message: "Student not found." }); return; }

    // Calculate attendance rate
    const totalAtt = student.attendance.length;
    const presentAtt = student.attendance.filter((a) => a.status === "PRESENT" || a.status === "LATE").length;
    const attendanceRate = totalAtt > 0 ? Math.round((presentAtt / totalAtt) * 100) : 0;

    // Fee summary
    const totalFees = student.invoices.reduce((s, i) => s + Number(i.totalAmount), 0);
    const totalPaid = student.invoices.reduce((s, i) => s + i.payments.reduce((ps, p) => ps + Number(p.amount), 0), 0);
    const outstanding = totalFees - totalPaid;

    res.json({
      status: "success",
      data: {
        ...student,
        stats: { attendanceRate, totalFees, totalPaid, outstanding, totalClasses: totalAtt },
      },
    });
  } catch (err: any) { res.status(500).json({ status: "error", message: err.message }); }
});

// ══════════════════════════════════════════════════════════════
// POST /api/v1/students/bulk — bulk import students
// ══════════════════════════════════════════════════════════════
router.post("/bulk", authenticate, authorize("ADMIN"), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { students } = req.body;
    if (!students?.length) { res.status(400).json({ status: "error", message: "students array required." }); return; }

    const results = { created: 0, failed: 0, errors: [] as string[] };

    for (const s of students) {
      try {
        if (!s.firstName || !s.lastName || !s.email || !s.parentName || !s.parentPhone || !s.parentEmail || !s.dateOfBirth) {
          results.failed++;
          results.errors.push(`${s.email || "unknown"}: Missing required fields`);
          continue;
        }

        let user = await prisma.user.findUnique({ where: { email: s.email.toLowerCase() } });
        if (!user) {
          const hash = await bcrypt.hash("Student@123", 12);
          user = await prisma.user.create({
            data: { email: s.email.toLowerCase(), passwordHash: hash, firstName: s.firstName, lastName: s.lastName, role: "STUDENT", phone: s.phone || null, emailVerified: true },
          });
        }

        const existing = await prisma.student.findUnique({ where: { userId: user.id } });
        if (!existing) {
          await prisma.student.create({
            data: { userId: user.id, parentName: s.parentName, parentPhone: s.parentPhone, parentEmail: s.parentEmail, dateOfBirth: new Date(s.dateOfBirth) },
          });
        }
        results.created++;
      } catch (e: any) {
        results.failed++;
        results.errors.push(`${s.email || "unknown"}: ${e.message}`);
      }
    }

    res.json({ status: "success", data: results });
  } catch (err: any) { res.status(500).json({ status: "error", message: err.message }); }
});

export default router;
