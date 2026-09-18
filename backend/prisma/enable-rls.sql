-- ═══════════════════════════════════════════════════════════════
-- ENABLE ROW LEVEL SECURITY (RLS) ON ALL TABLES
-- ═══════════════════════════════════════════════════════════════
-- Run this ONCE in Supabase → SQL Editor.
--
-- Why: the Supabase "anon" public key can hit the database directly. With RLS
-- OFF ("Unrestricted"), that key could read/write everything. This app does NOT
-- use the anon key at all — all data goes through the backend API, which uses the
-- secret service/direct connection that BYPASSES RLS. So enabling RLS with NO
-- public policies makes the anon key useless to an attacker while the app keeps
-- working normally.
--
-- Safe to run: it does not delete data and does not affect the backend.
-- ═══════════════════════════════════════════════════════════════

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', r.tablename);
    EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY;', r.tablename);
  END LOOP;
END $$;

-- With RLS enabled and NO policies created, the anon/public role is denied all
-- access by default. The backend (service_role / direct Postgres connection)
-- bypasses RLS, so the application continues to work unchanged.

-- To verify afterwards, every table should show "RLS enabled" and no policies:
--   SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname='public';
