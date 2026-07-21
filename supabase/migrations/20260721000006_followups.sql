-- ============================================================
-- CFS — PNFF client fields + the follow-up / reminder engine  v1
--
-- Two halves:
--   1. The remaining fields from the CFS PNFF Clients sheet, added to
--      both sig_contacts and sig_referrals so the two stay compatible.
--   2. sig_follow_ups — the "what do I do next, and when" record that
--      stops prospects slipping through the cracks.
--
-- Requires 20260721000005_referrals.sql. Idempotent: safe to re-run.
-- ============================================================

-- ─── PNFF SHEET FIELDS ────────────────────────────────────
-- Already present and deliberately not duplicated: first/last name,
-- email, phone, secondary_* (Client 2), address_*, referral_date,
-- status, notes.
--
-- "Send Follow Up Email", "Email Follow Up" and "Final Email/Closure
-- Notice" are DATE columns on the sheet, not flags — they record when
-- each step of the follow-up sequence actually went out. Kept as dates
-- so the history is preserved; sig_follow_ups drives what happens next.
ALTER TABLE sig_contacts ADD COLUMN IF NOT EXISTS cc_fee_due               TEXT;
ALTER TABLE sig_contacts ADD COLUMN IF NOT EXISTS staff_contact            TEXT;
-- NOT "contact_type": sig_contacts already has that column, and it means
-- something else entirely (the CRM's person/organization classifier). The
-- PNFF sheet's "Contact Type" is the kind of the most recent touch --
-- Initial Consult, Email Intro, Intake Meeting -- so it gets its own name.
ALTER TABLE sig_contacts ADD COLUMN IF NOT EXISTS last_contact_type        TEXT;
ALTER TABLE sig_contacts ADD COLUMN IF NOT EXISTS contact_date             DATE;
ALTER TABLE sig_contacts ADD COLUMN IF NOT EXISTS send_follow_up_email_at  DATE;
ALTER TABLE sig_contacts ADD COLUMN IF NOT EXISTS email_follow_up_at       DATE;
ALTER TABLE sig_contacts ADD COLUMN IF NOT EXISTS final_closure_notice_at  DATE;
ALTER TABLE sig_contacts ADD COLUMN IF NOT EXISTS status_notes             TEXT;

ALTER TABLE sig_referrals ADD COLUMN IF NOT EXISTS cc_fee_due              TEXT;
ALTER TABLE sig_referrals ADD COLUMN IF NOT EXISTS staff_contact           TEXT;
ALTER TABLE sig_referrals ADD COLUMN IF NOT EXISTS last_contact_type       TEXT;
ALTER TABLE sig_referrals ADD COLUMN IF NOT EXISTS contact_date            DATE;
ALTER TABLE sig_referrals ADD COLUMN IF NOT EXISTS send_follow_up_email_at DATE;
ALTER TABLE sig_referrals ADD COLUMN IF NOT EXISTS email_follow_up_at      DATE;
ALTER TABLE sig_referrals ADD COLUMN IF NOT EXISTS final_closure_notice_at DATE;
ALTER TABLE sig_referrals ADD COLUMN IF NOT EXISTS status_notes            TEXT;

CREATE INDEX IF NOT EXISTS idx_sig_contacts_contact_date ON sig_contacts (contact_date);
CREATE INDEX IF NOT EXISTS idx_sig_contacts_staff        ON sig_contacts (staff_contact);

-- ─── FOLLOW-UPS ───────────────────────────────────────────
-- One row per "next step": who to reach, how, when, and who owes it.
--
-- Attached to a contact OR a referral. Both are nullable and exactly one
-- is expected, because a prospect can slip through the cracks before
-- they are ever a contact.
CREATE TABLE IF NOT EXISTS sig_follow_ups (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  contact_id        UUID REFERENCES sig_contacts (id)  ON DELETE CASCADE,
  referral_id       UUID REFERENCES sig_referrals (id) ON DELETE CASCADE,

  -- When the next contact is due, and how it should happen.
  due_at            TIMESTAMPTZ NOT NULL,
  contact_method    TEXT NOT NULL DEFAULT 'phone',
  subject           TEXT,
  notes             TEXT,

  -- Who owes the work. Defaults to whoever created it.
  assigned_to       UUID REFERENCES sig_profiles (id) ON DELETE SET NULL,

  -- How the assignee gets nudged, and how far ahead.
  remind_channel    TEXT NOT NULL DEFAULT 'email',
  remind_before_minutes INTEGER NOT NULL DEFAULT 60,

  -- 'once' is the common case. Anything else re-creates the follow-up
  -- on completion rather than storing a schedule, so a missed week does
  -- not silently pile up a backlog of identical reminders.
  frequency         TEXT NOT NULL DEFAULT 'once',

  status            TEXT NOT NULL DEFAULT 'open',
  completed_at      TIMESTAMPTZ,
  -- Set when a reminder actually goes out, so the dispatcher never
  -- sends the same nudge twice.
  reminded_at       TIMESTAMPTZ,

  created_by        UUID REFERENCES sig_profiles (id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT sig_follow_ups_target_check CHECK (
    contact_id IS NOT NULL OR referral_id IS NOT NULL
  ),
  CONSTRAINT sig_follow_ups_method_check CHECK (contact_method IN (
    'phone', 'email', 'sms', 'meeting_in_person', 'meeting_video', 'mail', 'task'
  )),
  CONSTRAINT sig_follow_ups_remind_check CHECK (remind_channel IN (
    'none', 'email', 'sms', 'both'
  )),
  CONSTRAINT sig_follow_ups_frequency_check CHECK (frequency IN (
    'once', 'daily', 'weekly', 'biweekly', 'monthly', 'quarterly'
  )),
  CONSTRAINT sig_follow_ups_status_check CHECK (status IN (
    'open', 'done', 'snoozed', 'cancelled'
  ))
);

CREATE INDEX IF NOT EXISTS idx_sig_follow_ups_contact  ON sig_follow_ups (contact_id);
CREATE INDEX IF NOT EXISTS idx_sig_follow_ups_referral ON sig_follow_ups (referral_id);
CREATE INDEX IF NOT EXISTS idx_sig_follow_ups_assigned ON sig_follow_ups (assigned_to);
-- The dispatcher's query: open items already due, not yet reminded.
CREATE INDEX IF NOT EXISTS idx_sig_follow_ups_due
  ON sig_follow_ups (due_at) WHERE status = 'open';

-- ─── ROW LEVEL SECURITY ───────────────────────────────────
ALTER TABLE sig_follow_ups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS sig_follow_ups_read ON sig_follow_ups;
CREATE POLICY sig_follow_ups_read ON sig_follow_ups
  FOR SELECT USING (sig_is_active_internal());

-- ─── updated_at ───────────────────────────────────────────
DROP TRIGGER IF EXISTS trg_sig_follow_ups_updated_at ON sig_follow_ups;
CREATE TRIGGER trg_sig_follow_ups_updated_at
  BEFORE UPDATE ON sig_follow_ups
  FOR EACH ROW EXECUTE FUNCTION sig_matters_touch_updated_at();
