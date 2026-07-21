-- ============================================================
-- CFS — Date of birth for the second client  v1
--
-- The contact form now carries a DOB for both parties. Client 1's has
-- always existed (date_of_birth); Client 2 had a name, email and phone
-- but no date of birth, which matters for a practice whose clients are
-- mostly elderly couples.
--
-- Idempotent: safe to re-run.
-- ============================================================

ALTER TABLE sig_contacts
  ADD COLUMN IF NOT EXISTS secondary_date_of_birth DATE;
