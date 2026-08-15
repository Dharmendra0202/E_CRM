import { prisma } from "./prisma";
import { Request } from "express";
import { AuthRequest } from "../middleware/auth";

export interface AuditEntry {
  userId?: string;
  userEmail?: string;
  module: string;
  action: "CREATE" | "UPDATE" | "DELETE" | "LOGIN" | "LOGOUT" | "APPROVE" | "REJECT" | "REVERT";
  entityId?: string;
  previousValue?: any;
  newValue?: any;
  metadata?: any;
}

/**
 * Log an audit entry. Non-blocking — errors are logged but don't break the request.
 */
export async function logAudit(entry: AuditEntry, req?: Request | AuthRequest) {
  try {
    const authReq = req as AuthRequest | undefined;
    await prisma.auditLog.create({
      data: {
        userId: entry.userId || authReq?.user?.id || null,
        userEmail: entry.userEmail || authReq?.user?.email || null,
        module: entry.module,
        action: entry.action,
        entityId: entry.entityId || null,
        previousValue: entry.previousValue ? JSON.stringify(entry.previousValue) : null,
        newValue: entry.newValue ? JSON.stringify(entry.newValue) : null,
        ipAddress: req?.ip || req?.headers["x-forwarded-for"]?.toString() || null,
        userAgent: req?.headers["user-agent"] || null,
        metadata: entry.metadata ? JSON.stringify(entry.metadata) : null,
      },
    });
  } catch (err) {
    // Audit logging should never break the application
    console.error("[AuditLog] Failed to write audit entry:", err);
  }
}

/**
 * Helper to capture previous state before update/delete
 */
export function sanitizeForLog(obj: any): any {
  if (!obj) return null;
  const copy = { ...obj };
  // Remove sensitive fields
  delete copy.passwordHash;
  delete copy.refreshToken;
  delete copy.verificationToken;
  delete copy.resetToken;
  return copy;
}
