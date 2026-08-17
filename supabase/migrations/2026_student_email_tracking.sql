-- Add email tracking columns to students table
ALTER TABLE students ADD COLUMN IF NOT EXISTS acceptance_email_sent_at TIMESTAMPTZ;
ALTER TABLE students ADD COLUMN IF NOT EXISTS onboarding_email_sent_at TIMESTAMPTZ;
ALTER TABLE students ADD COLUMN IF NOT EXISTS completion_email_sent_at TIMESTAMPTZ;
