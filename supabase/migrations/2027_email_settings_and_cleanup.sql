-- ===================================================================
-- 2027_email_settings_and_cleanup.sql
-- Add is_enabled to email_templates
-- Delete rejected application profiles (keep count via archived_at)
-- ===================================================================

-- 1. Add is_enabled column to email_templates
ALTER TABLE email_templates ADD COLUMN IF NOT EXISTS is_enabled BOOLEAN NOT NULL DEFAULT true;

-- 2. Add LOR and completion templates if missing (upsert-safe)
INSERT INTO email_templates (template_key, subject, body_html, description, is_default)
VALUES
  ('onboarding',
   'Welcome to Ujjwalit — Your Internship Starts Now',
   '<p>Dear {{name}},</p><p>Congratulations! Your payment has been confirmed and you are now officially enrolled in the <strong>{{track}}</strong> internship batch.</p><p>Your student code is: <strong>{{code}}</strong></p><p>We will reach out with your onboarding credentials shortly.</p><p>Regards,<br/>Ujjwalit Technologies</p>',
   'Sent when an admin manually sends onboarding after payment is confirmed.',
   true),
  ('completion',
   'Ujjwalit — Your Certificate of Completion',
   '<p>Dear {{name}},</p><p>We are delighted to share your <strong>Certificate of Completion</strong> for the <strong>{{track}}</strong> programme.</p><p>Certificate ID: <strong>{{certId}}</strong></p><p>You can verify and share your certificate at: https://verify.ujjwalit.co.in/{{certId}}</p><p>Regards,<br/>Ujjwalit Technologies</p>',
   'Sent when admin dispatches a completion certificate.',
   true),
  ('recommendation',
   'Ujjwalit — Letter of Recommendation',
   '<p>Dear {{name}},</p><p>Please find attached your Letter of Recommendation for the <strong>{{track}}</strong> programme.</p><p>Regards,<br/>Ujjwalit Technologies</p>',
   'Sent when admin dispatches a Letter of Recommendation.',
   true)
ON CONFLICT (template_key) DO NOTHING;

-- 3. (Optional) Hard-delete rejected applications that were archived
-- Uncomment below ONLY after confirming you want to purge archived records.
-- The pipeline dashboard counts archivedApps.length from archived_at IS NOT NULL,
-- so the count is derived from the archived applications — purging them will zero the count.
-- Instead we keep the records but null out PII for GDPR-friendliness.
-- Run manually if/when needed:
--
-- UPDATE applications
-- SET full_name = 'Archived',
--     email = NULL,
--     phone = NULL,
--     whatsapp = NULL,
--     college = NULL,
--     branch = NULL,
--     linkedin_url = NULL,
--     github_url = NULL,
--     portfolio_url = NULL,
--     resume_url = NULL,
--     motivation = NULL
-- WHERE archived_at IS NOT NULL
--   AND application_status = 'rejected';
