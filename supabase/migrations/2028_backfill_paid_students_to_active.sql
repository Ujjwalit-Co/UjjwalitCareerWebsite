-- ===================================================================
-- 2028_backfill_paid_students_to_active.sql
-- Backfill existing students whose applications are paid to 'active' stage
-- ===================================================================

UPDATE students
SET stage = 'active'
FROM applications
WHERE students.application_id = applications.id
  AND applications.payment_status = 'paid'
  AND students.stage = 'accepted';
