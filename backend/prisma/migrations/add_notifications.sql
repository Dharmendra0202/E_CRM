-- Notification log table
CREATE TABLE IF NOT EXISTS "Notification" (
  "id"          TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "studentId"   TEXT        REFERENCES "Student"("id") ON DELETE SET NULL,
  "type"        TEXT        NOT NULL CHECK ("type" IN ('ABSENCE_ALERT','FEE_REMINDER','CLASS_UPDATE','CUSTOM')),
  "channel"     TEXT        NOT NULL CHECK ("channel" IN ('EMAIL','SMS','WHATSAPP','ALL')),
  "recipient"   TEXT        NOT NULL,
  "message"     TEXT        NOT NULL,
  "status"      TEXT        NOT NULL DEFAULT 'SENT' CHECK ("status" IN ('SENT','FAILED','PENDING')),
  "errorMsg"    TEXT,
  "sentAt"      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "Notification_studentId_idx" ON "Notification" ("studentId");
CREATE INDEX IF NOT EXISTS "Notification_sentAt_idx"    ON "Notification" ("sentAt" DESC);
CREATE INDEX IF NOT EXISTS "Notification_type_idx"      ON "Notification" ("type");

-- RLS
ALTER TABLE "Notification" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_all" ON "Notification" FOR ALL TO service_role USING (true) WITH CHECK (true);
