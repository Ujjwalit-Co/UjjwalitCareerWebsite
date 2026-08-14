-- ============================================================
-- ADDITIVE MIGRATION: Statement of Achievement (SOA) as markdown text
-- A student keeps a single certificate_type (the certificate layout),
-- and this column carries an accompanying SOA statement rendered as
-- a letter/paragraph on the public profile page.
-- Safe to run on an existing database.
-- ============================================================

ALTER TABLE students ADD COLUMN IF NOT EXISTS achievement_statement TEXT;
