-- ============================================================
-- CFS CRM — Client Funnel  v1
--
-- Adds the Opportunity object (the funnel record that carries the
-- stage + disposition), a unified Activity log, and configurable
-- follow-up sequences. Extends sig_contacts with CIF fields.
--
-- Builds on 20260707000003_redtail_mirror.sql (sig_contacts,
-- sig_set_updated_at(), sig_is_active_internal()).
--
-- Additive + idempotent (IF NOT EXISTS / ON CONFLICT throughout).
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── CONTACTS: CIF fields ─────────────────────────────────
-- Default, extensible Client Information File fields. The `cif`
-- jsonb absorbs future workbook fields without a schema change.
ALTER TABLE sig_contacts ADD COLUMN IF NOT EXISTS preferred_name          text;
ALTER TABLE sig_contacts ADD COLUMN IF NOT EXISTS salutation              text;
ALTER TABLE sig_contacts ADD COLUMN IF NOT EXISTS date_of_birth           date;
ALTER TABLE sig_contacts ADD COLUMN IF NOT EXISTS address_line1           text;
ALTER TABLE sig_contacts ADD COLUMN IF NOT EXISTS address_line2           text;
ALTER TABLE sig_contacts ADD COLUMN IF NOT EXISTS referral_source         text;
ALTER TABLE sig_contacts ADD COLUMN IF NOT EXISTS referral_source_detail  text;
ALTER TABLE sig_contacts ADD COLUMN IF NOT EXISTS matter_type             text;   -- trust | estate | poa | conservatorship | guardianship | other
ALTER TABLE sig_contacts ADD COLUMN IF NOT EXISTS preferred_contact_method text;  -- phone | email | mail | text
ALTER TABLE sig_contacts ADD COLUMN IF NOT EXISTS cif                     jsonb NOT NULL DEFAULT '{}'::jsonb;

-- ─── OPPORTUNITIES (the funnel record) ────────────────────
-- One per engagement. Holds the current stage and disposition.
--   stage:       awareness | interest | intake | nurture
--   disposition: active | re_engagement | dormant_no_response | dormant_deferred | exit
CREATE TABLE IF NOT EXISTS sig_opportunities (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  source              text        NOT NULL DEFAULT 'manual',
  contact_id          uuid        NOT NULL REFERENCES sig_contacts(id) ON DELETE CASCADE,

  stage               text        NOT NULL DEFAULT 'awareness',
  disposition         text        NOT NULL DEFAULT 'active',

  -- Stage entry gates (per the CFS outline).
  interest_meeting_at timestamptz,
  intake_meeting_at   timestamptz,
  cif_complete        boolean     NOT NULL DEFAULT false,
  ep_docs_complete    boolean     NOT NULL DEFAULT false,
  fee_complete        boolean     NOT NULL DEFAULT false,

  -- Close / disposition bookkeeping.
  closed_won_at       timestamptz,
  closed_at           timestamptz,
  close_reason        text,
  deferred_until      timestamptz,
  next_follow_up_at   timestamptz,

  assigned_staff_id   uuid REFERENCES sig_profiles(id) ON DELETE SET NULL,

  notes               text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_sig_opps_contact     ON sig_opportunities (contact_id);
CREATE INDEX IF NOT EXISTS idx_sig_opps_stage       ON sig_opportunities (stage);
CREATE INDEX IF NOT EXISTS idx_sig_opps_disposition ON sig_opportunities (disposition);
CREATE INDEX IF NOT EXISTS idx_sig_opps_staff       ON sig_opportunities (assigned_staff_id);
CREATE INDEX IF NOT EXISTS idx_sig_opps_followup    ON sig_opportunities (next_follow_up_at);
DROP TRIGGER IF EXISTS sig_opportunities_updated_at ON sig_opportunities;
CREATE TRIGGER sig_opportunities_updated_at
  BEFORE UPDATE ON sig_opportunities FOR EACH ROW EXECUTE FUNCTION sig_set_updated_at();

-- ─── ACTIVITIES (unified logged action) ───────────────────
-- A single logged action attached to a Contact (and optionally an Opportunity).
--   type:      call | email | sms | meeting | reminder | mail | note
--   direction: in | out
CREATE TABLE IF NOT EXISTS sig_activities (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id        uuid        NOT NULL REFERENCES sig_contacts(id) ON DELETE CASCADE,
  opportunity_id    uuid        REFERENCES sig_opportunities(id) ON DELETE SET NULL,
  type              text        NOT NULL DEFAULT 'note',
  direction         text,
  subject           text,
  body              text,
  occurred_at       timestamptz NOT NULL DEFAULT now(),
  billable_minutes  integer     NOT NULL DEFAULT 0,
  created_by        uuid REFERENCES sig_profiles(id) ON DELETE SET NULL,
  metadata          jsonb       NOT NULL DEFAULT '{}'::jsonb,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_sig_activities_contact  ON sig_activities (contact_id);
CREATE INDEX IF NOT EXISTS idx_sig_activities_opp      ON sig_activities (opportunity_id);
CREATE INDEX IF NOT EXISTS idx_sig_activities_occurred ON sig_activities (occurred_at DESC);
DROP TRIGGER IF EXISTS sig_activities_updated_at ON sig_activities;
CREATE TRIGGER sig_activities_updated_at
  BEFORE UPDATE ON sig_activities FOR EACH ROW EXECUTE FUNCTION sig_set_updated_at();

-- ─── FOLLOW-UP SEQUENCES (configurable cadence) ───────────
-- Structure only; intervals/channel/copy are configurable placeholders
-- (CFS finalizes them later — NOT hard-coded).
CREATE TABLE IF NOT EXISTS sig_follow_up_sequences (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text        NOT NULL,
  stall_stage  text        NOT NULL,   -- awareness | interest | intake | dormant
  active       boolean     NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (name)
);
DROP TRIGGER IF EXISTS sig_sequences_updated_at ON sig_follow_up_sequences;
CREATE TRIGGER sig_sequences_updated_at
  BEFORE UPDATE ON sig_follow_up_sequences FOR EACH ROW EXECUTE FUNCTION sig_set_updated_at();

CREATE TABLE IF NOT EXISTS sig_sequence_steps (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id  uuid        NOT NULL REFERENCES sig_follow_up_sequences(id) ON DELETE CASCADE,
  step_order   integer     NOT NULL,
  offset_days  integer     NOT NULL,   -- e.g. 7 / 28 / 56 (placeholder)
  channel      text        NOT NULL DEFAULT 'email',  -- phone | email | sms | mail
  template_ref text,
  message      text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (sequence_id, step_order)
);
CREATE INDEX IF NOT EXISTS idx_sig_seq_steps_sequence ON sig_sequence_steps (sequence_id);

-- ─── ROW LEVEL SECURITY ───────────────────────────────────
-- App reads/writes via the service role (bypasses RLS). Policies gate any
-- future direct client access: active internal staff may read.
ALTER TABLE sig_opportunities        ENABLE ROW LEVEL SECURITY;
ALTER TABLE sig_activities           ENABLE ROW LEVEL SECURITY;
ALTER TABLE sig_follow_up_sequences  ENABLE ROW LEVEL SECURITY;
ALTER TABLE sig_sequence_steps       ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS sig_opportunities_read ON sig_opportunities;
CREATE POLICY sig_opportunities_read ON sig_opportunities FOR SELECT USING (sig_is_active_internal());
DROP POLICY IF EXISTS sig_activities_read ON sig_activities;
CREATE POLICY sig_activities_read ON sig_activities FOR SELECT USING (sig_is_active_internal());
DROP POLICY IF EXISTS sig_sequences_read ON sig_follow_up_sequences;
CREATE POLICY sig_sequences_read ON sig_follow_up_sequences FOR SELECT USING (sig_is_active_internal());
DROP POLICY IF EXISTS sig_sequence_steps_read ON sig_sequence_steps;
CREATE POLICY sig_sequence_steps_read ON sig_sequence_steps FOR SELECT USING (sig_is_active_internal());

-- ─── SEED: default stall follow-up cadence (placeholders) ──
INSERT INTO sig_follow_up_sequences (name, stall_stage, active)
VALUES ('Standard stall follow-up', 'interest', true)
ON CONFLICT (name) DO NOTHING;

INSERT INTO sig_sequence_steps (sequence_id, step_order, offset_days, channel, message)
SELECT s.id, v.step_order, v.offset_days, v.channel, v.message
FROM sig_follow_up_sequences s
CROSS JOIN (VALUES
  (1, 7,  'phone', 'Day 7 touch — placeholder script (to be finalized by CFS).'),
  (2, 28, 'email', 'Day 28 touch — placeholder copy (to be finalized by CFS).'),
  (3, 56, 'mail',  'Day 56 touch — placeholder letter (to be finalized by CFS).')
) AS v(step_order, offset_days, channel, message)
WHERE s.name = 'Standard stall follow-up'
ON CONFLICT (sequence_id, step_order) DO NOTHING;
