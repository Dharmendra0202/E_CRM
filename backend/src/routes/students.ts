import { Router, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { authenticate, authorize, AuthRequest } from "../middleware/auth";
import bcrypt from "bcryptjs";
import { sendStudentOnboardingEmail } from "../utils/email";

const router = Router();
const prisma = new PrismaClient();

// GET /api/v1/students
router.get("/", authenticate, authorize("ADMIN", "TEACHER"), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const students = await prisma.student.findMany({
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
    const { parentName, parentPhone, parentEmail, dateOfBirth, firstName, lastName, email, phone, batch, feeAmount } = req.body;
    if (!parentName || !parentPhone || !parentEmail || !dateOfBirth || !firstName || !lastName || !email) {
      res.status(400).json({ status: "error", message: "Required fields missing." }); return;
    }
    
    // 1. Create or find the User account
    let user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) {
      const hash = await bcrypt.hash("Student@123", 12);
      user = await prisma.user.create({
        data: {
          email: email.toLowerCase(),
          passwordHash: hash,
          firstName,
          lastName,
          role: "STUDENT",
          phone: phone || null,
          emailVerified: true,
        }
      });
    }

    // 2. Create or update student profile
    let student = await prisma.student.findUnique({
      where: { userId: user.id }
    });

    if (student) {
      student = await prisma.student.update({
        where: { id: student.id },
        data: { parentName, parentPhone, parentEmail, dateOfBirth: new Date(dateOfBirth) },
        include: { user: true, enrollments: { include: { batch: true } }, invoices: true }
      });
    } else {
      student = await prisma.student.create({
        data: { userId: user.id, parentName, parentPhone, parentEmail, dateOfBirth: new Date(dateOfBirth) },
        include: { user: true, enrollments: { include: { batch: true } }, invoices: true }
      });
    }

    // 3. Batch enrollment if a batch is specified
    if (batch) {
      const foundBatch = await prisma.batch.findFirst({
        where: { name: batch }
      });
      if (foundBatch) {
        await prisma.batchEnrollment.create({
          data: {
            studentId: student.id,
            batchId: foundBatch.id,
            status: "ACTIVE"
          }
        });
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
      `${firstName} ${lastName}`,
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

// DELETE /api/v1/students/:id
router.delete("/:id", authenticate, authorize("ADMIN"), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const student = await prisma.student.findUnique({ where: { id: req.params.id } });
    if (student) {
      await prisma.student.delete({ where: { id: req.params.id } });
      if (student.userId) {
        await prisma.user.delete({ where: { id: student.userId } }).catch(() => {});
      }
    }
    res.json({ status: "success", message: "Student deleted." });
  } catch (err: any) { res.status(500).json({ status: "error", message: err.message }); }
});

export default router;
