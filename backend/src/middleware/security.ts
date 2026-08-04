import { Request, Response, NextFunction } from "express";

/**
 * Input sanitization middleware — strips common XSS patterns from request body
 */
export function sanitizeInput(req: Request, _res: Response, next: NextFunction) {
  if (req.body && typeof req.body === "object") {
    sanitizeObject(req.body);
  }
  next();
}

function sanitizeObject(obj: any) {
  for (const key of Object.keys(obj)) {
    if (typeof obj[key] === "string") {
      // Remove script tags and event handlers
      obj[key] = obj[key]
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
        .replace(/on\w+\s*=\s*"[^"]*"/gi, "")
        .replace(/on\w+\s*=\s*'[^']*'/gi, "");
    } else if (typeof obj[key] === "object" && obj[key] !== null) {
      sanitizeObject(obj[key]);
    }
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
