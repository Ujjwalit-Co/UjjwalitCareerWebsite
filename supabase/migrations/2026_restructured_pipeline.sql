-- 1. Create email_templates table
CREATE TABLE IF NOT EXISTS email_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_key TEXT NOT NULL UNIQUE,
    subject TEXT NOT NULL,
    body_html TEXT NOT NULL,
    description TEXT,
    is_enabled BOOLEAN NOT NULL DEFAULT true,
    is_default BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add the trg_email_templates_updated trigger using update_updated_at()
DROP TRIGGER IF EXISTS trg_email_templates_updated ON email_templates;
CREATE TRIGGER trg_email_templates_updated
BEFORE UPDATE ON email_templates
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 2. Add stage to students
ALTER TABLE students ADD COLUMN IF NOT EXISTS stage TEXT NOT NULL DEFAULT 'accepted';
ALTER TABLE students DROP CONSTRAINT IF EXISTS students_stage_check;
ALTER TABLE students ADD CONSTRAINT students_stage_check CHECK (stage IN ('accepted', 'active', 'completed', 'archived'));

-- 3. Add archived_at to applications
ALTER TABLE applications ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

-- 4. Clean up existing duplicates in documents (keep only latest per (student_id, document_type))
DELETE FROM documents
WHERE id IN (
    SELECT id
    FROM (
        SELECT id, ROW_NUMBER() OVER(PARTITION BY student_id, document_type ORDER BY generated_at DESC) as rn
        FROM documents
    ) t
    WHERE rn > 1
);

-- Add unique constraint on (student_id, document_type) to documents
ALTER TABLE documents DROP CONSTRAINT IF EXISTS uq_documents_student_type;
ALTER TABLE documents ADD CONSTRAINT uq_documents_student_type UNIQUE (student_id, document_type);

-- 5. Add opportunity_id to documents
ALTER TABLE documents ADD COLUMN IF NOT EXISTS opportunity_id UUID REFERENCES opportunities(id) ON DELETE SET NULL;

-- 6. Add cleanup of stale applications
UPDATE applications
SET application_status = 'rejected',
    archived_at = NOW()
FROM opportunities
WHERE applications.opportunity_id = opportunities.id
  AND applications.application_status IN ('pending', 'reviewing')
  AND opportunities.status IN ('closed', 'archived');

-- 7. Backfill opportunity_id for legacy records
UPDATE students s
SET opportunity_id = a.opportunity_id
FROM applications a
WHERE s.application_id = a.id
  AND s.opportunity_id IS NULL
  AND a.opportunity_id IS NOT NULL;

UPDATE certificates c
SET opportunity_id = s.opportunity_id
FROM students s
WHERE c.student_id = s.id
  AND c.opportunity_id IS NULL
  AND s.opportunity_id IS NOT NULL;

-- 8. Seed default email templates
INSERT INTO email_templates (template_key, subject, body_html, description, is_default)
VALUES
('acceptance', 'Congratulations! You have been accepted', '<p>Dear student,</p><p>You have been accepted into the program!</p>', 'Default acceptance email', true),
('onboarding', 'Welcome to the Onboarding Process', '<p>Welcome!</p><p>Please complete your onboarding tasks.</p>', 'Default onboarding email', true),
('completion', 'Certificate of Completion', '<p>Congratulations on completing the program!</p>', 'Default completion email', true),
('recommendation', 'Recommendation Letter Request', '<p>Please find attached the requested recommendation details.</p>', 'Default recommendation email', true)
ON CONFLICT (template_key) DO NOTHING;
