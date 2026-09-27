-- Add email verification and security fields to User table
ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "emailVerified"       BOOLEAN     NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "verificationToken"   TEXT        UNIQUE,
  ADD COLUMN IF NOT EXISTS "verificationExpiry"  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS "resetToken"          TEXT        UNIQUE,
  ADD COLUMN IF NOT EXISTS "resetTokenExpiry"    TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS "loginAttempts"       INTEGER     NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "lockedUntil"         TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS "refreshToken"        TEXT        UNIQUE;

-- Index for fast token lookups
CREATE INDEX IF NOT EXISTS "User_verificationToken_idx" ON "User" ("verificationToken");
CREATE INDEX IF NOT EXISTS "User_resetToken_idx"        ON "User" ("resetToken");
CREATE INDEX IF NOT EXISTS "User_refreshToken_idx"      ON "User" ("refreshToken");
