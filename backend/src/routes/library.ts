import { prisma } from "../utils/prisma";
import { Router, Response } from "express";

import { authenticate, authorize, AuthRequest } from "../middleware/auth";

const router = Router();

// GET /api/v1/library/books
router.get("/books", authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { search, category } = req.query as any;
    const where: any = {};
    if (category) where.category = category;
    if (search) where.OR = [{ title: { contains: search, mode: "insensitive" } }, { author: { contains: search, mode: "insensitive" } }, { isbn: { contains: search } }];
    const books = await prisma.book.findMany({ where, orderBy: { title: "asc" } });
    res.json({ status: "success", data: books });
  } catch (err: any) { res.status(500).json({ status: "error", message: err.message }); }
});

// POST /api/v1/library/books
router.post("/books", authenticate, authorize("ADMIN"), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, author, isbn, publisher, category, totalCopies, shelfLocation } = req.body;
    if (!title || !author) { res.status(400).json({ status: "error", message: "title and author required." }); return; }
    const book = await prisma.book.create({
      data: { title, author, isbn: isbn || null, publisher: publisher || null, category: category || null, totalCopies: totalCopies || 1, availableCopies: totalCopies || 1, shelfLocation: shelfLocation || null },
    });
    res.status(201).json({ status: "success", data: book });
  } catch (err: any) { res.status(500).json({ status: "error", message: err.message }); }
});

// DELETE /api/v1/library/books/:id
router.delete("/books/:id", authenticate, authorize("ADMIN"), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await prisma.book.delete({ where: { id: req.params.id } });
    res.json({ status: "success", message: "Book deleted." });
  } catch (err: any) { res.status(500).json({ status: "error", message: err.message }); }
});

// POST /api/v1/library/books/:id/issue
router.post("/books/:id/issue", authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { issuedTo, dueDate } = req.body;
    if (!issuedTo || !dueDate) { res.status(400).json({ status: "error", message: "issuedTo and dueDate required." }); return; }
    const book = await prisma.book.findUnique({ where: { id: req.params.id } });
    if (!book || book.availableCopies <= 0) { res.status(400).json({ status: "error", message: "Book not available." }); return; }
    const issue = await prisma.bookIssue.create({
      data: { bookId: req.params.id, issuedTo, issuedBy: req.user?.id, dueDate: new Date(dueDate) },
    });
    await prisma.book.update({ where: { id: req.params.id }, data: { availableCopies: { decrement: 1 }, status: book.availableCopies - 1 <= 0 ? "OUT_OF_STOCK" : book.availableCopies - 1 <= 2 ? "LOW_STOCK" : "AVAILABLE" } });
    res.status(201).json({ status: "success", data: issue });
  } catch (err: any) { res.status(500).json({ status: "error", message: err.message }); }
});

// POST /api/v1/library/issues/:id/return
router.post("/issues/:id/return", authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const issue = await prisma.bookIssue.findUnique({ where: { id: req.params.id } });
    if (!issue || issue.status === "RETURNED") { res.status(400).json({ status: "error", message: "Invalid issue or already returned." }); return; }
    const isLate = new Date() > new Date(issue.dueDate);
    const daysLate = isLate ? Math.ceil((Date.now() - new Date(issue.dueDate).getTime()) / 86400000) : 0;
    const fine = daysLate * 2; // ₹2 per day
    await prisma.bookIssue.update({ where: { id: req.params.id }, data: { returnDate: new Date(), status: "RETURNED", fine } });
    await prisma.book.update({ where: { id: issue.bookId }, data: { availableCopies: { increment: 1 }, status: "AVAILABLE" } });
    res.json({ status: "success", data: { returned: true, daysLate, fine } });
  } catch (err: any) { res.status(500).json({ status: "error", message: err.message }); }
});

// GET /api/v1/library/issues
router.get("/issues", authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status } = req.query as any;
    const where: any = {};
    if (status) where.status = status;
    const issues = await prisma.bookIssue.findMany({ where, include: { book: true }, orderBy: { issueDate: "desc" } });
    res.json({ status: "success", data: issues });
  } catch (err: any) { res.status(500).json({ status: "error", message: err.message }); }
});

// GET /api/v1/library/stats
router.get("/stats", authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const totalBooks = await prisma.book.count();
    const totalCopies = await prisma.book.aggregate({ _sum: { totalCopies: true } });
    const issued = await prisma.bookIssue.count({ where: { status: "ISSUED" } });
    const overdue = await prisma.bookIssue.count({ where: { status: "ISSUED", dueDate: { lt: new Date() } } });
    res.json({ status: "success", data: { totalBooks, totalCopies: totalCopies._sum.totalCopies || 0, issued, overdue } });
  } catch (err: any) { res.status(500).json({ status: "error", message: err.message }); }
});

export default router;
