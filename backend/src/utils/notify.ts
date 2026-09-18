import { prisma } from "./prisma";

interface NotifyOptions {
  title: string;
  message: string;
  type?: string;      // GENERAL, ATTENDANCE, EXAM, HOMEWORK, ANNOUNCEMENT, SYSTEM
  priority?: string;  // LOW, NORMAL, HIGH, URGENT
  link?: string;      // e.g. "/attendance", "/schedule"
  includeTeacher?: boolean;
  includeStudents?: boolean;
}

/**
 * Resolve a batch → its teacher + active students' User IDs and create in-app
 * Notification rows for each. Non-blocking: never throws to the caller.
 */
export async function notifyBatch(batchId: string, opts: NotifyOptions): Promise<number> {
  const { includeTeacher = true, includeStudents = true } = opts;
  try {
    const batch = await prisma.batch.findUnique({
      where: { id: batchId },
      include: {
        teacher: { include: { user: { select: { id: true } } } },
        enrollments: {
          where: { status: "ACTIVE" },
          include: { student: { include: { user: { select: { id: true } } } } },
        },
      },
    });

    if (!batch) return 0;

    const userIds = new Set<string>();
    if (includeTeacher && batch.teacher?.user?.id) userIds.add(batch.teacher.user.id);
    if (includeStudents) {
      for (const e of batch.enrollments) {
        const uid = e.student?.user?.id;
        if (uid) userIds.add(uid);
      }
    }

    if (userIds.size === 0) return 0;

    // @ts-ignore - Notification model exists after prisma generate
    const result = await prisma.notification.createMany({
      data: Array.from(userIds).map((uid) => ({
        userId: uid,
        title: opts.title,
        message: opts.message,
        type: opts.type || "GENERAL",
        priority: opts.priority || "NORMAL",
        link: opts.link || null,
      })),
    });
    return result.count;
  } catch (err: any) {
    console.warn(`[notify] notifyBatch failed for batch ${batchId}: ${err.message}`);
    return 0;
  }
}

/**
 * Notify a single student by their Student id (resolves to their linked User).
 * No-op if the student has no linked user account yet. Non-blocking.
 */
export async function notifyStudent(studentId: string, opts: NotifyOptions): Promise<number> {
  try {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: { userId: true },
    });
    if (!student?.userId) return 0;
    return notifyUsers([student.userId], opts);
  } catch (err: any) {
    console.warn(`[notify] notifyStudent failed for ${studentId}: ${err.message}`);
    return 0;
  }
}

/**
 * Notify all ADMIN / SUPER_ADMIN users. Use for account events (new signup,
 * new inquiry, etc.) so the admin sees them in the notification center.
 * Non-blocking: never throws.
 */
export async function notifyAdmins(opts: NotifyOptions): Promise<number> {
  try {
    const admins = await prisma.user.findMany({
      where: { role: { in: ["ADMIN", "SUPER_ADMIN"] } },
      select: { id: true },
    });
    return notifyUsers(admins.map((a) => a.id), opts);
  } catch (err: any) {
    console.warn(`[notify] notifyAdmins failed: ${err.message}`);
    return 0;
  }
}

/**
 * Notify a list of specific User IDs directly.
 */
export async function notifyUsers(userIds: string[], opts: NotifyOptions): Promise<number> {
  try {
    const unique = Array.from(new Set(userIds.filter(Boolean)));
    if (unique.length === 0) return 0;
    // @ts-ignore
    const result = await prisma.notification.createMany({
      data: unique.map((uid) => ({
        userId: uid,
        title: opts.title,
        message: opts.message,
        type: opts.type || "GENERAL",
        priority: opts.priority || "NORMAL",
        link: opts.link || null,
      })),
    });
    return result.count;
  } catch (err: any) {
    console.warn(`[notify] notifyUsers failed: ${err.message}`);
    return 0;
  }
}
