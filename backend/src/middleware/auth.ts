import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthRequest extends Request {
  user?: { id: string; role: string; email: string };
}

/**
 * Token type claim.
 *
 * Access and refresh tokens are signed with the SAME secret, so without an
 * explicit type claim a long-lived (7 day) refresh token would verify happily
 * on every `authenticate`-protected route — turning it into a general-purpose
 * API credential. Every token now carries `typ`, and each consumer asserts the
 * type it expects.
 */
export type TokenType = "access" | "refresh";

export interface AccessTokenClaims {
  id: string;
  role: string;
  email: string;
}

/** Sign a short-lived access token. */
export const signAccessToken = (user: AccessTokenClaims): string =>
  jwt.sign({ ...user, typ: "access" satisfies TokenType }, process.env.JWT_SECRET!, {
    expiresIn: process.env.JWT_EXPIRES_IN || "15m",
  } as any);

/** Sign a long-lived refresh token. Carries only the user id. */
export const signRefreshToken = (userId: string): string =>
  jwt.sign({ id: userId, typ: "refresh" satisfies TokenType }, process.env.JWT_SECRET!, {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || "7d",
  } as any);

/**
 * Verify a token and assert its type. Throws if the signature is invalid, the
 * token is expired, or it is not of the expected type.
 */
export function verifyToken(token: string, expected: TokenType): any {
  const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
  if (decoded?.typ !== expected) {
    throw new Error(`Expected a ${expected} token.`);
  }
  return decoded;
}

/** Verify a bearer access token. */
export const verifyAccessToken = (token: string): AccessTokenClaims =>
  verifyToken(token, "access") as AccessTokenClaims;

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ status: "error", message: "No token provided." });
    return;
  }
  const token = authHeader.split(" ")[1];
  // NOTE: the hardcoded "demo-offline-token" ADMIN bypass was REMOVED. It was
  // gated only on `NODE_ENV !== "production"`, which fails OPEN whenever that
  // variable is unset, misspelled, or set to something like "staging" — anyone
  // sending that literal string would have received full ADMIN access.
  try {
    const decoded = verifyAccessToken(token);
    req.user = { id: decoded.id, role: decoded.role, email: decoded.email };
    next();
  } catch {
    res.status(401).json({ status: "error", message: "Invalid or expired token." });
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ status: "error", message: "Access denied: insufficient permissions." });
      return;
    }
    next();
  };
};
