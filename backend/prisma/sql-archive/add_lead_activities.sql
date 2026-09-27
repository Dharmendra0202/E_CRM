-- Phase 5: Admissions CRM - Lead Activities & Pipeline Enhancement

-- Add new columns to Lead table
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "nextFollowUp" TIMESTAMPTZ(6);
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "expectedJoining" DATE;
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "course" TEXT;

-- Create LeadActivity table for timeline/notes
CREATE TABLE IF NOT EXISTS "LeadActivity" (
    "id" TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
    "leadId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "metadata" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LeadActivity_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "LeadActivity_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE NO ACTION
);

CREATE INDEX IF NOT EXISTS "LeadActivity_leadId_createdAt_idx" ON "LeadActivity"("leadId", "createdAt" DESC);
