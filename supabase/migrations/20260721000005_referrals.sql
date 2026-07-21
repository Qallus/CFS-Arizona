-- ============================================================
-- CFS — Referrals + shared referral/secondary-party fields  v1
--
-- Two halves:
--   1. sig_referrals — the intake log. One row per referral received,
--      before it is necessarily a contact.
--   2. The same field set added to sig_contacts, so a referral that
--      becomes a client keeps everything it arrived with.
--
-- "Secondary" is the co-client: CFS serves couples ("Rosa & Manuel
-- Ibarra", "Robert & Anne Delgado"), and a spouse is a party to the
-- matter, not a note about it.
--
-- Requires 20260721000001_matters.sql. Idempotent: safe to re-run.
-- ============================================================

CREATE TABLE IF NOT EXISTS sig_referrals (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Free text: a referral often arrives as "the Okafor family" before
  -- anyone has confirmed how the names are actually spelled.
  client_name          TEXT NOT NULL,

  primary_first_name   TEXT,
  primary_last_name    TEXT,
  secondary_first_name TEXT,
  secondary_last_name  TEXT,

  primary_email        TEXT,
  secondary_email      TEXT,
  primary_phone        TEXT,
  secondary_phone      TEXT,

  address_line1        TEXT,
  address_line2        TEXT,
  city                 TEXT,
  state                TEXT,
  postal_code          TEXT,

  -- Comma-separated, matching sig_contacts.matter_type so the two can be
  -- copied across on conversion without translation.
  matter_type          TEXT,

  referral_date        DATE,
  referred_by          TEXT,
  referral_type        TEXT,
  attorney             TEXT,

  -- "Notes - Appointment - Focal" on the CFS intake sheet.
  appointment_notes    TEXT,

  -- Normalized for the pipeline board.
  status               TEXT NOT NULL DEFAULT 'awaiting',
  -- CFS's own wording, preserved verbatim. The 2025 sheet carries 20
  -- distinct phrasings ("Nominated CFS", "CFS Nominated", "Declined -
  -- no case capacity", "Refd to A. Lambson for acctg"). Collapsing
  -- those into six board columns is useful; losing them is not.
  status_detail        TEXT,
  notes                TEXT,

  -- Set once the referral has been turned into a contact, so the same
  -- referral is not worked twice.
  contact_id           UUID REFERENCES sig_contacts (id) ON DELETE SET NULL,
  assigned_staff_id    UUID REFERENCES sig_profiles (id) ON DELETE SET NULL,

  archived_at          TIMESTAMPTZ,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Derived from the real 2025 intake sheet rather than invented:
  -- a referral is awaiting a decision, nominated to CFS, accepted,
  -- declined, or sent to another fiduciary.
  CONSTRAINT sig_referrals_status_check CHECK (status IN (
    'awaiting', 'nominated', 'pending_decision', 'accepted',
    'declined', 'referred_out', 'converted'
  ))
);

CREATE INDEX IF NOT EXISTS idx_sig_referrals_status   ON sig_referrals (status);
CREATE INDEX IF NOT EXISTS idx_sig_referrals_date     ON sig_referrals (referral_date);
CREATE INDEX IF NOT EXISTS idx_sig_referrals_contact  ON sig_referrals (contact_id);
CREATE INDEX IF NOT EXISTS idx_sig_referrals_archived ON sig_referrals (archived_at);

-- ─── SAME FIELDS ON CONTACTS ──────────────────────────────
-- Deliberately NOT re-adding: first/last name, email, phone,
-- mobile_phone, matter_type, status, address_line1/2, city, state and
-- zip_code already exist on sig_contacts. Only the genuinely new ones
-- are added, so there is no second column meaning the same thing.
--
-- referral_source already holds "who referred them", so it is the
-- Referred By field rather than a new column beside it.
ALTER TABLE sig_contacts ADD COLUMN IF NOT EXISTS secondary_first_name TEXT;
ALTER TABLE sig_contacts ADD COLUMN IF NOT EXISTS secondary_last_name  TEXT;
ALTER TABLE sig_contacts ADD COLUMN IF NOT EXISTS secondary_email      TEXT;
ALTER TABLE sig_contacts ADD COLUMN IF NOT EXISTS secondary_phone      TEXT;
ALTER TABLE sig_contacts ADD COLUMN IF NOT EXISTS referral_date        DATE;
ALTER TABLE sig_contacts ADD COLUMN IF NOT EXISTS referral_type        TEXT;
ALTER TABLE sig_contacts ADD COLUMN IF NOT EXISTS attorney             TEXT;
ALTER TABLE sig_contacts ADD COLUMN IF NOT EXISTS appointment_notes    TEXT;
ALTER TABLE sig_contacts ADD COLUMN IF NOT EXISTS notes                TEXT;

-- ─── ROW LEVEL SECURITY ───────────────────────────────────
ALTER TABLE sig_referrals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS sig_referrals_read ON sig_referrals;
CREATE POLICY sig_referrals_read ON sig_referrals
  FOR SELECT USING (sig_is_active_internal());

-- ─── updated_at ───────────────────────────────────────────
DROP TRIGGER IF EXISTS trg_sig_referrals_updated_at ON sig_referrals;
CREATE TRIGGER trg_sig_referrals_updated_at
  BEFORE UPDATE ON sig_referrals
  FOR EACH ROW EXECUTE FUNCTION sig_matters_touch_updated_at();
