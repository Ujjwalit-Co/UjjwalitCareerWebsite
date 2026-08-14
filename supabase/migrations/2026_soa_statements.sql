-- ============================================================
-- ADDITIVE MIGRATION: Statement of Achievement as selectable snippets
-- Replaces the free-form achievement_statement column with a library of
-- admin-defined skill/achievement snippets that admins toggle per student.
-- Also retires 'achievement' as a certificate type (legacy rows are
-- migrated to 'completion').
-- Safe to run on an existing database.
-- ============================================================

-- 1. Snippet library (admin-managed)
CREATE TABLE IF NOT EXISTS achievement_statements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  label TEXT NOT NULL,
  body_markdown TEXT NOT NULL,
  display_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Junction: which snippets are shown on each student's profile
CREATE TABLE IF NOT EXISTS student_achievement_statements (
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  statement_id UUID NOT NULL REFERENCES achievement_statements(id) ON DELETE CASCADE,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (student_id, statement_id)
);

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_student_soa ON student_achievement_statements(student_id);
CREATE INDEX IF NOT EXISTS idx_soa_active ON achievement_statements(is_active, display_order);

-- 4. updated_at trigger for the snippet library
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = '';

DROP TRIGGER IF EXISTS trg_soa_updated ON achievement_statements;
CREATE TRIGGER trg_soa_updated BEFORE UPDATE ON achievement_statements FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 5. Seed default snippets (idempotent)
INSERT INTO achievement_statements (label, body_markdown, display_order)
SELECT 'Program Completion', 'Completed the program curriculum and capstone project with dedication.', 10
WHERE NOT EXISTS (SELECT 1 FROM achievement_statements WHERE label = 'Program Completion');

INSERT INTO achievement_statements (label, body_markdown, display_order)
SELECT 'Technical Skills', 'Demonstrated strong skills in **Frontend Development** and **React**.', 20
WHERE NOT EXISTS (SELECT 1 FROM achievement_statements WHERE label = 'Technical Skills');

INSERT INTO achievement_statements (label, body_markdown, display_order)
SELECT 'Production-Ready Delivery', 'Delivered a production-ready project as part of the internship.', 30
WHERE NOT EXISTS (SELECT 1 FROM achievement_statements WHERE label = 'Production-Ready Delivery');

INSERT INTO achievement_statements (label, body_markdown, display_order)
SELECT 'Attendance & Participation', 'Maintained **{{attendance}}%** attendance and actively participated in mentorship sessions.', 40
WHERE NOT EXISTS (SELECT 1 FROM achievement_statements WHERE label = 'Attendance & Participation');

INSERT INTO achievement_statements (label, body_markdown, display_order)
SELECT 'Problem Solving & Teamwork', 'Exhibited strong problem-solving and teamwork throughout the program.', 50
WHERE NOT EXISTS (SELECT 1 FROM achievement_statements WHERE label = 'Problem Solving & Teamwork');

-- 6. Retire 'achievement' as a certificate type: migrate legacy students
UPDATE students SET certificate_type = 'completion' WHERE certificate_type = 'achievement';

-- 7. Tighten students.certificate_type CHECK (drop 'achievement')
ALTER TABLE students DROP CONSTRAINT IF EXISTS students_certificate_type_check;
ALTER TABLE students ADD CONSTRAINT students_certificate_type_check CHECK (certificate_type IN ('none', 'completion', 'participation'));

-- 8. The legacy achievement_statement column is unused; data is kept harmlessly.
--    certificates / certificate_templates keep their CHECK values for history.
