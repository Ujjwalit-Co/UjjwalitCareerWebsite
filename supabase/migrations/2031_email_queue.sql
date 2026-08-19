-- ============================================================
-- ADDITIVE MIGRATION: email dispatch queue
-- Resend's free tier limits daily and per-second sends (100/day,
-- ~2/sec). Bulk dispatch now enqueues rows and processes them
-- sequentially with a rate-limit aware processor instead of
-- firing every email in parallel.
-- Safe to run on an existing database.
-- ============================================================

CREATE TABLE IF NOT EXISTS email_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    email_type TEXT NOT NULL,
    attach_certificate BOOLEAN NOT NULL DEFAULT true,
    attach_lor BOOLEAN NOT NULL DEFAULT false,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sending', 'sent', 'failed')),
    error TEXT,
    attempts INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    sent_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_email_queue_status ON email_queue(status);
CREATE INDEX IF NOT EXISTS idx_email_queue_created_at ON email_queue(created_at);

-- Queue is managed server-side (admin client bypasses RLS), but
-- grant admins full access in case the dashboard surfaces queue state.
ALTER TABLE email_queue ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage email queue" ON email_queue;
CREATE POLICY "Admins can manage email queue"
  ON email_queue FOR ALL TO authenticated
  USING (true) WITH CHECK (true);