-- ============================================================
-- ADDITIVE MIGRATION: RLS policies for Statement of Achievement tables
-- The snippet library (achievement_statements) and the per-student
-- junction (student_achievement_statements) were created without RLS
-- policies. If RLS is enabled on these tables (e.g. via the Supabase
-- dashboard), admin CRUD from the authenticated client fails with
-- "new row violates row-level security policy".
--
-- This migration explicitly enables RLS and grants:
--   - admins (authenticated): full CRUD on both tables
--   - public (anon/authenticated): SELECT of active snippets only
-- Safe to run on an existing database.
-- ============================================================

ALTER TABLE achievement_statements ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_achievement_statements ENABLE ROW LEVEL SECURITY;

-- Admins can fully manage the snippet library
DROP POLICY IF EXISTS "Admins can manage achievement statements" ON achievement_statements;
CREATE POLICY "Admins can manage achievement statements"
  ON achievement_statements FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- Public can only read active snippets (e.g. public profile rendering)
DROP POLICY IF EXISTS "Anyone can view active achievement statements" ON achievement_statements;
CREATE POLICY "Anyone can view active achievement statements"
  ON achievement_statements FOR SELECT TO anon, authenticated
  USING (is_active = true);

-- Admins can fully manage the per-student junction
DROP POLICY IF EXISTS "Admins can manage student achievement statements" ON student_achievement_statements;
CREATE POLICY "Admins can manage student achievement statements"
  ON student_achievement_statements FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- Public can read the junction through the public profile API
DROP POLICY IF EXISTS "Anyone can view student achievement statements" ON student_achievement_statements;
CREATE POLICY "Anyone can view student achievement statements"
  ON student_achievement_statements FOR SELECT TO anon, authenticated
  USING (true);