-- ============================================================
-- UJJWALIT TECHNOLOGIES - CAREERS, EVENTS & CERTIFICATES
-- Complete resettable Supabase schema
-- ============================================================
-- This file is safe to run after dropping the project data, and it also
-- drops/recreates the public tables if you run it on an existing database.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DROP TABLE IF EXISTS certificate_templates CASCADE;
DROP TABLE IF EXISTS certificates CASCADE;
DROP TABLE IF EXISTS documents CASCADE;
DROP TABLE IF EXISTS student_profiles CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS applications CASCADE;
DROP TABLE IF EXISTS opportunities CASCADE;
DROP FUNCTION IF EXISTS update_updated_at() CASCADE;

CREATE TABLE opportunities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  type TEXT NOT NULL DEFAULT 'internship' CHECK (type IN ('internship', 'event', 'project')),
  title TEXT NOT NULL,
  short_title TEXT,
  tagline TEXT NOT NULL,
  description TEXT NOT NULL,
  details_markdown TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'open', 'closed', 'archived')),
  visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'private')),
  price_inr INTEGER NOT NULL DEFAULT 0 CHECK (price_inr >= 0),
  stipend_label TEXT NOT NULL DEFAULT 'No stipend',
  duration_label TEXT NOT NULL,
  location_label TEXT NOT NULL DEFAULT 'Remote',
  cohort_label TEXT,
  starts_on DATE,
  ends_on DATE,
  apply_by DATE,
  capacity INTEGER CHECK (capacity IS NULL OR capacity > 0),
  display_order INTEGER NOT NULL DEFAULT 100,
  accent TEXT NOT NULL DEFAULT 'teal' CHECK (accent IN ('teal', 'orange', 'blue', 'amber')),
  cover_image_url TEXT,
  certificate_template_id UUID,
  features JSONB NOT NULL DEFAULT '[]'::jsonb,
  outcomes JSONB NOT NULL DEFAULT '[]'::jsonb,
  eligibility JSONB NOT NULL DEFAULT '[]'::jsonb,
  project_links JSONB NOT NULL DEFAULT '[]'::jsonb,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  whatsapp TEXT,
  college TEXT NOT NULL,
  branch TEXT NOT NULL,
  year TEXT NOT NULL,
  linkedin_url TEXT,
  github_url TEXT,
  portfolio_url TEXT,
  motivation TEXT,
  internship_track TEXT NOT NULL,
  resume_url TEXT,
  application_status TEXT NOT NULL DEFAULT 'pending' CHECK (application_status IN ('pending', 'reviewing', 'accepted', 'rejected', 'waitlisted')),
  payment_status TEXT NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'pending', 'paid', 'waived', 'refunded')),
  payment_tx_id TEXT,
  remarks TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE student_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  remarks TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE SET NULL,
  profile_id UUID REFERENCES student_profiles(id) ON DELETE SET NULL,
  student_code TEXT NOT NULL UNIQUE,
  batch_name TEXT NOT NULL,
  attendance_percentage NUMERIC(5,2) DEFAULT 0 CHECK (attendance_percentage BETWEEN 0 AND 100),
  project_submitted BOOLEAN DEFAULT FALSE,
  project_score NUMERIC(5,2) DEFAULT 0 CHECK (project_score BETWEEN 0 AND 100),
  certificate_eligible BOOLEAN DEFAULT FALSE,
  certificate_type TEXT NOT NULL DEFAULT 'none' CHECK (certificate_type IN ('none', 'completion', 'participation')),
  acceptance_email_sent_at TIMESTAMPTZ,
  onboarding_email_sent_at TIMESTAMPTZ,
  completion_email_sent_at TIMESTAMPTZ,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE achievement_statements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  label TEXT NOT NULL,
  body_markdown TEXT NOT NULL,
  display_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE student_achievement_statements (
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  statement_id UUID NOT NULL REFERENCES achievement_statements(id) ON DELETE CASCADE,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (student_id, statement_id)
);

CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN ('acceptance', 'onboarding', 'completion', 'recommendation')),
  document_url TEXT NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE certificate_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  template_type TEXT NOT NULL DEFAULT 'custom' CHECK (template_type IN ('completion', 'achievement', 'participation', 'custom')),
  description TEXT,
  background_url TEXT,
  fields JSONB NOT NULL DEFAULT '[]'::jsonb,
  width NUMERIC NOT NULL DEFAULT 1122,
  height NUMERIC NOT NULL DEFAULT 793,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE opportunities ADD CONSTRAINT opportunities_certificate_template_id_fkey FOREIGN KEY (certificate_template_id) REFERENCES certificate_templates(id) ON DELETE SET NULL;

CREATE TABLE certificates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE SET NULL,
  template_id UUID REFERENCES certificate_templates(id) ON DELETE SET NULL,
  certificate_id TEXT NOT NULL UNIQUE,
  certificate_type TEXT NOT NULL DEFAULT 'completion' CHECK (certificate_type IN ('completion', 'achievement', 'participation')),
  verification_hash TEXT NOT NULL UNIQUE,
  qr_code_url TEXT,
  verification_url TEXT,
  certificate_pdf_url TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked')),
  issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_opportunities_status ON opportunities(status, visibility, display_order);
CREATE INDEX idx_opportunities_slug ON opportunities(slug);
CREATE INDEX idx_opportunities_type ON opportunities(type);
CREATE INDEX idx_applications_email ON applications(email);
CREATE INDEX idx_applications_status ON applications(application_status);
CREATE INDEX idx_applications_track ON applications(internship_track);
CREATE INDEX idx_applications_opportunity ON applications(opportunity_id);
CREATE INDEX idx_applications_created ON applications(created_at DESC);
CREATE INDEX idx_students_code ON students(student_code);
CREATE INDEX idx_students_batch ON students(batch_name);
CREATE INDEX idx_students_app_id ON students(application_id);
CREATE INDEX idx_students_opportunity ON students(opportunity_id);
CREATE INDEX idx_students_profile ON students(profile_id);
CREATE INDEX idx_students_cert_type ON students(certificate_type);
CREATE INDEX idx_student_soa ON student_achievement_statements(student_id);
CREATE INDEX idx_soa_active ON achievement_statements(is_active, display_order);
CREATE INDEX idx_profiles_email ON student_profiles(email);
CREATE INDEX idx_certificates_cert_id ON certificates(certificate_id);
CREATE INDEX idx_certificates_hash ON certificates(verification_hash);
CREATE INDEX idx_certificates_student ON certificates(student_id);
CREATE INDEX idx_certificates_opportunity ON certificates(opportunity_id);
CREATE INDEX idx_documents_student ON documents(student_id);

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = '';

CREATE TRIGGER trg_opportunities_updated BEFORE UPDATE ON opportunities FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_applications_updated BEFORE UPDATE ON applications FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_students_updated BEFORE UPDATE ON students FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON student_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_templates_updated BEFORE UPDATE ON certificate_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificate_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view public opportunities" ON opportunities FOR SELECT TO anon, authenticated USING (visibility = 'public');
CREATE POLICY "Admins can manage opportunities" ON opportunities FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Anyone can submit an application" ON applications FOR INSERT TO anon, authenticated WITH CHECK (
  opportunity_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM opportunities
    WHERE opportunities.id = applications.opportunity_id
      AND opportunities.status = 'open'
      AND opportunities.visibility = 'public'
  )
);
CREATE POLICY "Admins can manage applications" ON applications FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admins can manage students" ON students FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admins can manage student profiles" ON student_profiles FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admins can manage documents" ON documents FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can verify certificates" ON certificates FOR SELECT TO anon, authenticated USING (status = 'active');
CREATE POLICY "Admins can manage certificates" ON certificates FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admins can manage templates" ON certificate_templates FOR ALL TO authenticated USING (true) WITH CHECK (true);
ALTER TABLE achievement_statements ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_achievement_statements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage achievement statements" ON achievement_statements FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can view active achievement statements" ON achievement_statements FOR SELECT TO anon, authenticated USING (is_active = true);
CREATE POLICY "Admins can manage student achievement statements" ON student_achievement_statements FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can view student achievement statements" ON student_achievement_statements FOR SELECT TO anon, authenticated USING (true);

INSERT INTO storage.buckets (id, name, public) VALUES ('resumes', 'resumes', false) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('certificates', 'certificates', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('letters', 'letters', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('templates', 'templates', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('opportunity-assets', 'opportunity-assets', true) ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Anyone can upload resumes" ON storage.objects;
DROP POLICY IF EXISTS "Only admins can read resumes" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update resumes" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete resumes" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view certificates" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload certificates" ON storage.objects;
DROP POLICY IF EXISTS "Admins can manage letters" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view templates" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload templates" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update templates" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete templates" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view opportunity assets" ON storage.objects;
DROP POLICY IF EXISTS "Admins can manage opportunity assets" ON storage.objects;

CREATE POLICY "Anyone can upload resumes" ON storage.objects FOR INSERT TO anon, authenticated WITH CHECK (bucket_id = 'resumes');
CREATE POLICY "Only admins can read resumes" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'resumes');
CREATE POLICY "Admins can update resumes" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'resumes') WITH CHECK (bucket_id = 'resumes');
CREATE POLICY "Admins can delete resumes" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'resumes');
CREATE POLICY "Admins can upload certificates" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'certificates');
CREATE POLICY "Admins can manage letters" ON storage.objects FOR ALL TO authenticated USING (bucket_id = 'letters') WITH CHECK (bucket_id = 'letters');
CREATE POLICY "Admins can upload templates" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'templates');
CREATE POLICY "Admins can update templates" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'templates') WITH CHECK (bucket_id = 'templates');
CREATE POLICY "Admins can delete templates" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'templates');
CREATE POLICY "Anyone can view opportunity assets" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'opportunity-assets');
CREATE POLICY "Admins can manage opportunity assets" ON storage.objects FOR ALL TO authenticated USING (bucket_id = 'opportunity-assets') WITH CHECK (bucket_id = 'opportunity-assets');

-- ============================================================
-- DEFAULT CERTIFICATE TEMPLATES (Completion / Achievement / Participation)
-- ============================================================

INSERT INTO certificate_templates (name, template_type, description, fields, width, height, is_default)
VALUES (
  'Certificate of Completion (Default)',
  'completion',
  'Standard certificate issued to students who fully complete a Ujjwalit program.',
  '[
    {"id":"1","type":"text","label":"Title text","placeholder":"CERTIFICATE OF COMPLETION","x":400,"y":140,"fontSize":28,"fontFamily":"Serif","fontWeight":"bold","color":"#E8822A","textAlign":"center"},
    {"id":"2","type":"text","label":"Presenter line","placeholder":"This is proudly presented to","x":400,"y":220,"fontSize":14,"fontFamily":"Sans","fontWeight":"normal","color":"#64748B","textAlign":"center"},
    {"id":"3","type":"text","label":"Student Name","placeholder":"{{name}}","x":400,"y":280,"fontSize":32,"fontFamily":"Serif","fontWeight":"bold","color":"#0B1D3F","textAlign":"center"},
    {"id":"4","type":"text","label":"Description text","placeholder":"for successfully completing the {{program}} program","x":400,"y":340,"fontSize":13,"fontFamily":"Sans","fontWeight":"normal","color":"#64748B","textAlign":"center"},
    {"id":"5","type":"text","label":"Certificate ID Info","placeholder":"Certificate ID: {{id}}","x":80,"y":490,"fontSize":10,"fontFamily":"Mono","fontWeight":"normal","color":"#94A3B8","textAlign":"left"},
    {"id":"6","type":"text","label":"Issued Date Info","placeholder":"Issued Date: {{date}}","x":80,"y":515,"fontSize":10,"fontFamily":"Mono","fontWeight":"normal","color":"#94A3B8","textAlign":"left"},
    {"id":"7","type":"qrcode","label":"Security QR Code","placeholder":"QR CODE PLACEHOLDER","x":650,"y":440,"fontSize":75,"fontFamily":"Mono","fontWeight":"normal","color":"#000000","textAlign":"left"}
  ]'::jsonb,
  800, 566, TRUE
) ON CONFLICT DO NOTHING;

INSERT INTO certificate_templates (name, template_type, description, fields, width, height, is_default)
VALUES (
  'Statement of Achievement (Default)',
  'achievement',
  'Statement issued to students who participated meaningfully but did not fully complete the program requirements.',
  '[
    {"id":"1","type":"text","label":"Title text","placeholder":"STATEMENT OF ACHIEVEMENT","x":400,"y":120,"fontSize":26,"fontFamily":"Serif","fontWeight":"bold","color":"#1A8BA6","textAlign":"center"},
    {"id":"2","type":"text","label":"Presenter line","placeholder":"This statement is proudly presented to","x":400,"y":185,"fontSize":13,"fontFamily":"Sans","fontWeight":"normal","color":"#64748B","textAlign":"center"},
    {"id":"3","type":"text","label":"Student Name","placeholder":"{{name}}","x":400,"y":235,"fontSize":30,"fontFamily":"Serif","fontWeight":"bold","color":"#0B1D3F","textAlign":"center"},
    {"id":"4","type":"text","label":"Statement body","placeholder":"This is to certify that {{name}} of {{college}} has actively participated in the {{program}} program conducted by Ujjwalit Technologies Pvt. Ltd. (Batch: {{batch}}).\n\nThe student attended {{attendance}}% of the sessions and demonstrated sincere participation throughout the program.\n\nWe appreciate the student''s dedication and wish them continued success in their future endeavours.","x":120,"y":300,"fontSize":11,"fontFamily":"Sans","fontWeight":"normal","color":"#555555","textAlign":"left"},
    {"id":"5","type":"text","label":"Certificate ID Info","placeholder":"Certificate ID: {{id}}","x":80,"y":490,"fontSize":10,"fontFamily":"Mono","fontWeight":"normal","color":"#94A3B8","textAlign":"left"},
    {"id":"6","type":"text","label":"Issued Date Info","placeholder":"Issued Date: {{date}}","x":80,"y":515,"fontSize":10,"fontFamily":"Mono","fontWeight":"normal","color":"#94A3B8","textAlign":"left"},
    {"id":"7","type":"qrcode","label":"Security QR Code","placeholder":"QR CODE PLACEHOLDER","x":650,"y":440,"fontSize":75,"fontFamily":"Mono","fontWeight":"normal","color":"#000000","textAlign":"left"}
  ]'::jsonb,
  800, 566, FALSE
) ON CONFLICT DO NOTHING;

INSERT INTO certificate_templates (name, template_type, description, fields, width, height, is_default)
VALUES (
  'Certificate of Participation (Default)',
  'participation',
  'Certificate circulated to students who attended an event or workshop session.',
  '[
    {"id":"1","type":"text","label":"Title text","placeholder":"CERTIFICATE OF PARTICIPATION","x":400,"y":140,"fontSize":26,"fontFamily":"Serif","fontWeight":"bold","color":"#0B1D3F","textAlign":"center"},
    {"id":"2","type":"text","label":"Presenter line","placeholder":"This is proudly presented to","x":400,"y":200,"fontSize":13,"fontFamily":"Sans","fontWeight":"normal","color":"#64748B","textAlign":"center"},
    {"id":"3","type":"text","label":"Student Name","placeholder":"{{name}}","x":400,"y":250,"fontSize":30,"fontFamily":"Serif","fontWeight":"bold","color":"#0B1D3F","textAlign":"center"},
    {"id":"4","type":"text","label":"Description text","placeholder":"for actively participating in {{program}} conducted by Ujjwalit Technologies.","x":400,"y":320,"fontSize":13,"fontFamily":"Sans","fontWeight":"normal","color":"#64748B","textAlign":"center"},
    {"id":"5","type":"text","label":"Certificate ID Info","placeholder":"Certificate ID: {{id}}","x":80,"y":490,"fontSize":10,"fontFamily":"Mono","fontWeight":"normal","color":"#94A3B8","textAlign":"left"},
    {"id":"6","type":"text","label":"Issued Date Info","placeholder":"Issued Date: {{date}}","x":80,"y":515,"fontSize":10,"fontFamily":"Mono","fontWeight":"normal","color":"#94A3B8","textAlign":"left"},
    {"id":"7","type":"qrcode","label":"Security QR Code","placeholder":"QR CODE PLACEHOLDER","x":650,"y":440,"fontSize":75,"fontFamily":"Mono","fontWeight":"normal","color":"#000000","textAlign":"left"}
  ]'::jsonb,
  800, 566, FALSE
) ON CONFLICT DO NOTHING;