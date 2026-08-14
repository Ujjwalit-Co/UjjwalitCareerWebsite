-- ============================================================
-- ADDITIVE MIGRATION: Multi-certificate templates & student profiles
-- Safe to run on an existing database. Does not drop or rewrite
-- any existing rows — existing data is preserved.
-- ============================================================

-- 1. Student profiles table (stable per-person identity keyed by email)
CREATE TABLE IF NOT EXISTS student_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. students: link to a profile + per-student certificate type
ALTER TABLE students ADD COLUMN IF NOT EXISTS profile_id UUID REFERENCES student_profiles(id) ON DELETE SET NULL;
ALTER TABLE students ADD COLUMN IF NOT EXISTS certificate_type TEXT NOT NULL DEFAULT 'none' CHECK (certificate_type IN ('none', 'completion', 'achievement', 'participation'));

-- 3. certificate_templates: type + description for the template library
ALTER TABLE certificate_templates ADD COLUMN IF NOT EXISTS template_type TEXT NOT NULL DEFAULT 'custom' CHECK (template_type IN ('completion', 'achievement', 'participation', 'custom'));
ALTER TABLE certificate_templates ADD COLUMN IF NOT EXISTS description TEXT;

-- 4. certificates: record which kind of certificate was issued
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS certificate_type TEXT NOT NULL DEFAULT 'completion' CHECK (certificate_type IN ('completion', 'achievement', 'participation'));

-- 5. Backfill: one profile per ACCEPTED student email (admin-approved / participating).
--    Un-accepted applicants do NOT get a profile page. New profiles are created
--    on-the-fly when an application is accepted (see admin applications flow).
INSERT INTO student_profiles (email, full_name, slug)
SELECT DISTINCT ON (LOWER(TRIM(a.email)))
  LOWER(TRIM(a.email)),
  a.full_name,
  'UJP-' || EXTRACT(YEAR FROM a.created_at) || '-' || LPAD((ROW_NUMBER() OVER (ORDER BY a.created_at))::TEXT, 4, '0')
FROM applications a
JOIN students s ON s.application_id = a.id
WHERE LOWER(TRIM(a.email)) NOT IN (SELECT LOWER(email) FROM student_profiles)
  AND a.email IS NOT NULL
  AND TRIM(a.email) <> ''
ORDER BY LOWER(TRIM(a.email)), a.created_at ASC;

UPDATE students s
SET profile_id = p.id
FROM applications a
JOIN student_profiles p ON LOWER(p.email) = LOWER(a.email)
WHERE s.application_id = a.id
  AND s.profile_id IS NULL;

-- 5b. Enforce the rule even if a broader backfill already ran on this DB:
--     drop profiles not linked to any accepted student.
DELETE FROM student_profiles p
WHERE NOT EXISTS (SELECT 1 FROM students s WHERE s.profile_id = p.id);

-- 6. Backfill: preserve existing eligibility as 'completion'
UPDATE students SET certificate_type = 'completion' WHERE certificate_eligible = TRUE AND certificate_type = 'none';

-- 7. Indexes
CREATE INDEX IF NOT EXISTS idx_students_profile ON students(profile_id);
CREATE INDEX IF NOT EXISTS idx_students_cert_type ON students(certificate_type);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON student_profiles(email);

-- 8. Trigger for profiles updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = '';

DROP TRIGGER IF EXISTS trg_profiles_updated ON student_profiles;
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON student_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 9. RLS for student_profiles (admin-managed; public reads go through the service-role API)
ALTER TABLE student_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can manage student profiles" ON student_profiles;
CREATE POLICY "Admins can manage student profiles" ON student_profiles FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 10. Seed default templates (idempotent)
INSERT INTO certificate_templates (name, template_type, description, fields, width, height, is_default)
SELECT 'Certificate of Completion (Default)', 'completion', 'Standard certificate issued to students who fully complete a Ujjwalit program.',
  '[
    {"id":"1","type":"text","label":"Title text","placeholder":"CERTIFICATE OF COMPLETION","x":400,"y":140,"fontSize":28,"fontFamily":"Serif","fontWeight":"bold","color":"#E8822A","textAlign":"center"},
    {"id":"2","type":"text","label":"Presenter line","placeholder":"This is proudly presented to","x":400,"y":220,"fontSize":14,"fontFamily":"Sans","fontWeight":"normal","color":"#64748B","textAlign":"center"},
    {"id":"3","type":"text","label":"Student Name","placeholder":"{{name}}","x":400,"y":280,"fontSize":32,"fontFamily":"Serif","fontWeight":"bold","color":"#0B1D3F","textAlign":"center"},
    {"id":"4","type":"text","label":"Description text","placeholder":"for successfully completing the {{program}} program","x":400,"y":340,"fontSize":13,"fontFamily":"Sans","fontWeight":"normal","color":"#64748B","textAlign":"center"},
    {"id":"5","type":"text","label":"Certificate ID Info","placeholder":"Certificate ID: {{id}}","x":80,"y":490,"fontSize":10,"fontFamily":"Mono","fontWeight":"normal","color":"#94A3B8","textAlign":"left"},
    {"id":"6","type":"text","label":"Issued Date Info","placeholder":"Issued Date: {{date}}","x":80,"y":515,"fontSize":10,"fontFamily":"Mono","fontWeight":"normal","color":"#94A3B8","textAlign":"left"},
    {"id":"7","type":"qrcode","label":"Security QR Code","placeholder":"QR CODE PLACEHOLDER","x":650,"y":440,"fontSize":75,"fontFamily":"Mono","fontWeight":"normal","color":"#000000","textAlign":"left"}
  ]'::jsonb, 800, 566, TRUE
WHERE NOT EXISTS (SELECT 1 FROM certificate_templates WHERE name = 'Certificate of Completion (Default)');

INSERT INTO certificate_templates (name, template_type, description, fields, width, height, is_default)
SELECT 'Statement of Achievement (Default)', 'achievement', 'Statement issued to students who participated meaningfully but did not fully complete the program requirements.',
  '[
    {"id":"1","type":"text","label":"Title text","placeholder":"STATEMENT OF ACHIEVEMENT","x":400,"y":120,"fontSize":26,"fontFamily":"Serif","fontWeight":"bold","color":"#1A8BA6","textAlign":"center"},
    {"id":"2","type":"text","label":"Presenter line","placeholder":"This statement is proudly presented to","x":400,"y":185,"fontSize":13,"fontFamily":"Sans","fontWeight":"normal","color":"#64748B","textAlign":"center"},
    {"id":"3","type":"text","label":"Student Name","placeholder":"{{name}}","x":400,"y":235,"fontSize":30,"fontFamily":"Serif","fontWeight":"bold","color":"#0B1D3F","textAlign":"center"},
    {"id":"4","type":"text","label":"Statement body","placeholder":"This is to certify that {{name}} of {{college}} has actively participated in the {{program}} program conducted by Ujjwalit Technologies Pvt. Ltd. (Batch: {{batch}}).\n\nThe student attended {{attendance}}% of the sessions and demonstrated sincere participation throughout the program.\n\nWe appreciate the student''s dedication and wish them continued success in their future endeavours.","x":120,"y":300,"fontSize":11,"fontFamily":"Sans","fontWeight":"normal","color":"#555555","textAlign":"left"},
    {"id":"5","type":"text","label":"Certificate ID Info","placeholder":"Certificate ID: {{id}}","x":80,"y":490,"fontSize":10,"fontFamily":"Mono","fontWeight":"normal","color":"#94A3B8","textAlign":"left"},
    {"id":"6","type":"text","label":"Issued Date Info","placeholder":"Issued Date: {{date}}","x":80,"y":515,"fontSize":10,"fontFamily":"Mono","fontWeight":"normal","color":"#94A3B8","textAlign":"left"},
    {"id":"7","type":"qrcode","label":"Security QR Code","placeholder":"QR CODE PLACEHOLDER","x":650,"y":440,"fontSize":75,"fontFamily":"Mono","fontWeight":"normal","color":"#000000","textAlign":"left"}
  ]'::jsonb, 800, 566, FALSE
WHERE NOT EXISTS (SELECT 1 FROM certificate_templates WHERE name = 'Statement of Achievement (Default)');

INSERT INTO certificate_templates (name, template_type, description, fields, width, height, is_default)
SELECT 'Certificate of Participation (Default)', 'participation', 'Certificate circulated to students who attended an event or workshop session.',
  '[
    {"id":"1","type":"text","label":"Title text","placeholder":"CERTIFICATE OF PARTICIPATION","x":400,"y":140,"fontSize":26,"fontFamily":"Serif","fontWeight":"bold","color":"#0B1D3F","textAlign":"center"},
    {"id":"2","type":"text","label":"Presenter line","placeholder":"This is proudly presented to","x":400,"y":200,"fontSize":13,"fontFamily":"Sans","fontWeight":"normal","color":"#64748B","textAlign":"center"},
    {"id":"3","type":"text","label":"Student Name","placeholder":"{{name}}","x":400,"y":250,"fontSize":30,"fontFamily":"Serif","fontWeight":"bold","color":"#0B1D3F","textAlign":"center"},
    {"id":"4","type":"text","label":"Description text","placeholder":"for actively participating in {{program}} conducted by Ujjwalit Technologies.","x":400,"y":320,"fontSize":13,"fontFamily":"Sans","fontWeight":"normal","color":"#64748B","textAlign":"center"},
    {"id":"5","type":"text","label":"Certificate ID Info","placeholder":"Certificate ID: {{id}}","x":80,"y":490,"fontSize":10,"fontFamily":"Mono","fontWeight":"normal","color":"#94A3B8","textAlign":"left"},
    {"id":"6","type":"text","label":"Issued Date Info","placeholder":"Issued Date: {{date}}","x":80,"y":515,"fontSize":10,"fontFamily":"Mono","fontWeight":"normal","color":"#94A3B8","textAlign":"left"},
    {"id":"7","type":"qrcode","label":"Security QR Code","placeholder":"QR CODE PLACEHOLDER","x":650,"y":440,"fontSize":75,"fontFamily":"Mono","fontWeight":"normal","color":"#000000","textAlign":"left"}
  ]'::jsonb, 800, 566, FALSE
WHERE NOT EXISTS (SELECT 1 FROM certificate_templates WHERE name = 'Certificate of Participation (Default)');

-- 11. Lock down public storage reads (linter: "Anyone can view X" SELECT policies removed from schema.sql)
DROP POLICY IF EXISTS "Anyone can view certificates" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view templates" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view opportunity assets" ON storage.objects;
