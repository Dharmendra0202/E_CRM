-- Phase 9-10: Academic Management + Homework & Assignments

CREATE TABLE IF NOT EXISTS "Subject" (
    "id" TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Subject_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Subject_name_key" ON "Subject"("name");

CREATE TABLE IF NOT EXISTS "Homework" (
    "id" TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "subjectId" TEXT,
    "batchId" TEXT,
    "assignedBy" TEXT NOT NULL,
    "dueDate" DATE NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "maxScore" INTEGER,
    "attachments" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Homework_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Homework_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON UPDATE NO ACTION
);
CREATE INDEX IF NOT EXISTS "Homework_batchId_dueDate_idx" ON "Homework"("batchId", "dueDate" DESC);
CREATE INDEX IF NOT EXISTS "Homework_assignedBy_idx" ON "Homework"("assignedBy");

CREATE TABLE IF NOT EXISTS "HomeworkSubmission" (
    "id" TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
    "homeworkId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "content" TEXT,
    "attachments" TEXT,
    "score" INTEGER,
    "feedback" TEXT,
    "submittedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "gradedAt" TIMESTAMPTZ(6),
    "status" TEXT NOT NULL DEFAULT 'SUBMITTED',
    CONSTRAINT "HomeworkSubmission_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "HomeworkSubmission_homeworkId_fkey" FOREIGN KEY ("homeworkId") REFERENCES "Homework"("id") ON DELETE CASCADE ON UPDATE NO ACTION
);
CREATE UNIQUE INDEX IF NOT EXISTS "HomeworkSubmission_homeworkId_studentId_key" ON "HomeworkSubmission"("homeworkId", "studentId");
CREATE INDEX IF NOT EXISTS "HomeworkSubmission_studentId_idx" ON "HomeworkSubmission"("studentId");
