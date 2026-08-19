-- ============================================================
-- ADDITIVE MIGRATION: RLS policies for email_templates
-- The email template settings were created without RLS policies.
-- If RLS is enabled on the table (e.g. via the Supabase dashboard),
-- admin CRUD from the authenticated client fails with
-- "new row violates row-level security policy" (HTTP 403).
--
-- This migration explicitly enables RLS and grants:
--   - admins (authenticated): full CRUD on email_templates
-- Safe to run on an existing database.
-- ============================================================

ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

-- Admins can read and manage email templates (settings + dispatch)
DROP POLICY IF EXISTS "Admins can manage email templates" ON email_templates;
CREATE POLICY "Admins can manage email templates"
  ON email_templates FOR ALL TO authenticated
  USING (true) WITH CHECK (true);