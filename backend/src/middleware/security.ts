import { Request, Response, NextFunction } from "express";

/**
 * Strips raw HTML markup from string values in the request body.
 *
 * IMPORTANT — what this is and is not:
 *
 * This is defence in depth ONLY. The real protection against XSS is output
 * encoding at render time, which React gives us by default (it escapes any value
 * interpolated into JSX). Never treat this middleware as the reason the app is
 * safe.
 *
 * The previous implementation removed `<script>` blocks and *quoted* `on…=`
 * handlers with a regex. That let obvious payloads through — `<img src=x
 * onerror=alert(1)>` and `<svg onload=…>` have unquoted handlers — while also
 * silently rewriting legitimate user text (an address or note containing
 * `onchange="x"` was corrupted before being stored).
 *
 * Instead of trying to allow "safe" HTML, we strip angle-bracket tags entirely
 * and decode nothing. Field content in this app is plain text (names, addresses,
 * notes), so removing markup is both safer and more predictable than a
 * blocklist.
 */
export function sanitizeInput(req: Request, _res: Response, next: NextFunction) {
  if (req.body && typeof req.body === "object") {
    sanitizeValue(req.body, 0);
  }
  next();
}

/**
 * Fields that must pass through byte-for-byte.
 *
 * Passwords may legitimately contain `<` or `>`, and tokens/signatures are
 * opaque credentials — rewriting any of these would corrupt authentication or
 * payment verification.
 */
const SKIP_FIELDS = new Set([
  "password",
  "currentPassword",
  "newPassword",
  "confirmPassword",
  "passwordHash",
  "token",
  "refreshToken",
  "verificationToken",
  "credential",          // Google ID token (JWT)
  "razorpaySignature",
  "razorpayOrderId",
  "razorpayPaymentId",
]);

/** Remove HTML tags and control characters from a plain-text field. */
function cleanString(input: string): string {
  return input
    // Drop any <...> tag, including unclosed ones at the end of the string.
    .replace(/<[^>]*>?/g, "")
    // Strip NULs and other C0 control chars except tab/newline/carriage return.
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "");
}

/**
 * Walk the body depth-first. `depth` guards against pathological nesting and
 * the array branch is handled explicitly so indices are not treated as keys.
 */
function sanitizeValue(node: any, depth: number): void {
  if (depth > 10) return;
  if (Array.isArray(node)) {
    for (let i = 0; i < node.length; i++) {
      if (typeof node[i] === "string") node[i] = cleanString(node[i]);
      else if (node[i] && typeof node[i] === "object") sanitizeValue(node[i], depth + 1);
    }
    return;
  }
  for (const key of Object.keys(node)) {
    if (SKIP_FIELDS.has(key)) continue;
    const value = node[key];
    if (typeof value === "string") node[key] = cleanString(value);
    else if (value && typeof value === "object") sanitizeValue(value, depth + 1);
  }
}

/**
 * Request ID middleware — adds unique ID to each request for tracing
 */
export function requestId(req: Request, _res: Response, next: NextFunction) {
  req.headers["x-request-id"] = req.headers["x-request-id"] || crypto.randomUUID();
  next();
}

/**
 * Security headers middleware (supplement to helmet)
 */
export function securityHeaders(_req: Request, res: Response, next: NextFunction) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  next();
}

/**
 * Request size limiter — prevents oversized payloads
 */
export function payloadSizeCheck(maxMB: number = 10) {
  return (req: Request, res: Response, next: NextFunction) => {
    const contentLength = parseInt(req.headers["content-length"] || "0");
    if (contentLength > maxMB * 1024 * 1024) {
      res.status(413).json({ status: "error", message: `Payload too large. Max ${maxMB}MB.` });
      return;
    }
    next();
  };
}
