-- ============================================================
--  E-CRM — Full PostgreSQL Schema for Supabase
--  Paste this entire block in Supabase SQL Editor and Run
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── 1. users ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "User" (
  "id"           TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "email"        TEXT        NOT NULL UNIQUE,
  "passwordHash" TEXT        NOT NULL,
  "role"         TEXT        NOT NULL CHECK ("role" IN ('ADMIN','TEACHER','STUDENT','PARENT')),
  "firstName"    TEXT        NOT NULL,
  "lastName"     TEXT        NOT NULL,
  "phone"        TEXT,
  "createdAt"    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS "User_email_lower_idx" ON "User" (LOWER("email"));

-- ── 2. leads ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "Lead" (
  "id"              TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "name"            TEXT        NOT NULL,
  "email"           TEXT        NOT NULL,
  "phone"           TEXT        NOT NULL DEFAULT '',
  "status"          TEXT        NOT NULL DEFAULT 'NEW'
                                CHECK ("status" IN ('NEW','CONTACTED','DEMO_SCHEDULED','ENROLLED','LOST')),
  "source"          TEXT        NOT NULL DEFAULT 'Manual Entry',
  "notes"           TEXT,
  "assignedAdminId" TEXT        REFERENCES "User"("id") ON DELETE SET NULL,
  "createdAt"       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "Lead_status_createdAt_idx" ON "Lead" ("status", "createdAt" DESC);

-- ── 3. students ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "Student" (
  "id"          TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "userId"      TEXT        UNIQUE REFERENCES "User"("id") ON DELETE SET NULL,
  "parentName"  TEXT        NOT NULL,
  "parentPhone" TEXT        NOT NULL,
  "parentEmail" TEXT        NOT NULL,
  "dateOfBirth" DATE        NOT NULL,
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 4. teachers ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "Teacher" (
  "id"            TEXT    PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "userId"        TEXT    NOT NULL UNIQUE REFERENCES "User"("id") ON DELETE RESTRICT,
  "bio"           TEXT,
  "qualification" TEXT    NOT NULL,
  "hourlyRate"    NUMERIC(10,2) NOT NULL DEFAULT 0
);

-- ── 5. batches ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "Batch" (
  "id"           TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "name"         TEXT        NOT NULL,
  "subject"      TEXT        NOT NULL,
  "startDate"    DATE        NOT NULL,
  "endDate"      DATE        NOT NULL,
  "capacity"     INTEGER     NOT NULL DEFAULT 30,
  "teacherId"    TEXT        NOT NULL REFERENCES "Teacher"("id") ON DELETE RESTRICT,
  "feeAmount"    NUMERIC(10,2) NOT NULL DEFAULT 0,
  "feeFrequency" TEXT        NOT NULL CHECK ("feeFrequency" IN ('MONTHLY','TERM','ONETIME'))
);

-- ── 6. batch_enrollments ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS "BatchEnrollment" (
  "id"         TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "studentId"  TEXT        NOT NULL REFERENCES "Student"("id") ON DELETE RESTRICT,
  "batchId"    TEXT        NOT NULL REFERENCES "Batch"("id") ON DELETE RESTRICT,
  "enrolledAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "status"     TEXT        NOT NULL DEFAULT 'ACTIVE'
                           CHECK ("status" IN ('ACTIVE','COMPLETED','SUSPENDED')),
  UNIQUE ("studentId", "batchId")
);

-- ── 7. schedules ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "Schedule" (
  "id"         TEXT    PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "batchId"    TEXT    NOT NULL REFERENCES "Batch"("id") ON DELETE CASCADE,
  "roomOrLink" TEXT    NOT NULL DEFAULT '',
  "dayOfWeek"  INTEGER NOT NULL CHECK ("dayOfWeek" BETWEEN 1 AND 7),
  "startTime"  TEXT    NOT NULL,
  "endTime"    TEXT    NOT NULL
);

CREATE INDEX IF NOT EXISTS "Schedule_batchId_idx" ON "Schedule" ("batchId");
CREATE INDEX IF NOT EXISTS "Schedule_day_time_idx"  ON "Schedule" ("dayOfWeek", "startTime", "endTime");

-- ── 8. attendance ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "Attendance" (
  "id"          TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "scheduleId"  TEXT        NOT NULL REFERENCES "Schedule"("id") ON DELETE RESTRICT,
  "studentId"   TEXT        NOT NULL REFERENCES "Student"("id") ON DELETE RESTRICT,
  "classDate"   DATE        NOT NULL,
  "status"      TEXT        NOT NULL CHECK ("status" IN ('PRESENT','ABSENT','LATE')),
  "remarks"     TEXT,
  "markedById"  TEXT        NOT NULL REFERENCES "User"("id") ON DELETE RESTRICT,
  "recordedAt"  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE ("scheduleId", "studentId", "classDate")
);

CREATE INDEX IF NOT EXISTS "Attendance_studentId_idx"  ON "Attendance" ("studentId");
CREATE INDEX IF NOT EXISTS "Attendance_scheduleId_idx" ON "Attendance" ("scheduleId");

-- ── 9. invoices ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "Invoice" (
  "id"                    TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "studentId"             TEXT        NOT NULL REFERENCES "Student"("id") ON DELETE RESTRICT,
  "totalAmount"           NUMERIC(10,2) NOT NULL,
  "status"                TEXT        NOT NULL DEFAULT 'UNPAID'
                                      CHECK ("status" IN ('UNPAID','PARTIAL','PAID','VOID')),
  "dueDate"               DATE        NOT NULL,
  "paidAt"                TIMESTAMPTZ,
  "stripePaymentIntentId" TEXT        UNIQUE
);

CREATE INDEX IF NOT EXISTS "Invoice_studentId_idx" ON "Invoice" ("studentId");
CREATE INDEX IF NOT EXISTS "Invoice_status_idx"    ON "Invoice" ("status");

-- ── 10. payments ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "Payment" (
  "id"                   TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "invoiceId"            TEXT        NOT NULL REFERENCES "Invoice"("id") ON DELETE RESTRICT,
  "amount"               NUMERIC(10,2) NOT NULL,
  "paymentMethod"        TEXT        NOT NULL CHECK ("paymentMethod" IN ('CARD','CASH','BANK_TRANSFER')),
  "transactionReference" TEXT        UNIQUE,
  "paidAt"               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Auto-update updatedAt on User ─────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS "User_updatedAt" ON "User";
CREATE TRIGGER "User_updatedAt"
  BEFORE UPDATE ON "User"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── Row Level Security (RLS) — enable but keep open for now ───
ALTER TABLE "User"            ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Lead"            ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Student"         ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Teacher"         ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Batch"           ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BatchEnrollment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Schedule"        ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Attendance"      ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Invoice"         ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Payment"         ENABLE ROW LEVEL SECURITY;

-- Allow service_role full access (used by backend)
CREATE POLICY "service_role_all" ON "User"            FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON "Lead"            FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON "Student"         FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON "Teacher"         FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON "Batch"           FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON "BatchEnrollment" FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON "Schedule"        FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON "Attendance"      FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON "Invoice"         FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON "Payment"         FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============================================================
--  Done! All 10 tables created.
-- ============================================================
