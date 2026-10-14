import { Response } from "express";
import logger from "./logger";

/**
 * Machine-readable error codes the frontend can branch on without parsing
 * human text. Keep these stable — the client depends on them.
 */
export type ApiErrorCode =
  | "DB_UNAVAILABLE"
  | "INTERNAL"
  | "UNAUTHORIZED"
  | "VALIDATION";

/**
 * Detects whether an error is a database-connectivity failure.
 *
 * On the Supabase free tier the project is PAUSED after inactivity, so the
 * first requests after a pause fail with Prisma's P1001 ("Can't reach database
 * server...") or a connection-pool timeout. Those raw messages contain the DB
 * host, file paths and model names, so they must NEVER be sent to the client.
 */
export function isDbUnavailable(err: any): boolean {
  const code = err?.code;
  if (code === "P1001" || code === "P1002" || code === "P1008" || code === "P1017") return true;
  const msg = String(err?.message || "").toLowerCase();
  return (
    msg.includes("can't reach database server") ||
    msg.includes("cannot reach database server") ||
    msg.includes("connection pool") ||
    msg.includes("econnrefused") ||
    msg.includes("etimedout") ||
    msg.includes("terminating connection")
  );
}

/**
 * Send a safe JSON error response.
 *
 * - Logs the FULL error server-side (stack included) for debugging.
 * - Returns only a generic, user-safe message + a stable `code` to the client.
 * - Never leaks Prisma/DB internals, file paths or host names.
 *
 * @param res       Express response
 * @param err       The caught error (logged, never serialized to the client)
 * @param fallback  User-facing message for the generic/internal case
 */
export function sendError(res: Response, err: any, fallback = "Something went wrong. Please try again."): void {
  if (isDbUnavailable(err)) {
    logger.error(`[DB_UNAVAILABLE] ${err?.code || ""} ${err?.message || err}`);
    res.status(503).json({
      status: "error",
      code: "DB_UNAVAILABLE" satisfies ApiErrorCode,
      message:
        "The service is temporarily unavailable (the database is waking up). " +
        "Please wait a minute and try again.",
    });
    return;
  }

  logger.error(`[INTERNAL] ${err?.stack || err?.message || err}`);
  res.status(500).json({
    status: "error",
    code: "INTERNAL" satisfies ApiErrorCode,
    message: fallback,
  });
}
