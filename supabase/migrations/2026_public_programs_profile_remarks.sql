-- ============================================================
-- ADDITIVE MIGRATION: Public read of past programs + profile remarks
-- Safe to run on an existing database. Does not drop or rewrite
-- any existing rows.
-- ============================================================

-- 1. RLS: allow anon/authenticated SELECT of ALL public opportunities
--    (open, closed, archived). The careers site renders the Previous
--    Programs section (closed/archived) and their detail pages.
--    Applications INSERT policy still requires status = 'open', so
--    applying remains limited to open programs only.
DROP POLICY IF EXISTS "Anyone can view open public opportunities" ON opportunities;
DROP POLICY IF EXISTS "Anyone can view public opportunities" ON opportunities;
CREATE POLICY "Anyone can view public opportunities" ON opportunities FOR SELECT TO anon, authenticated USING (visibility = 'public');

-- 2. student_profiles: admin remarks/notes shown on the public profile page
ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS remarks TEXT;
