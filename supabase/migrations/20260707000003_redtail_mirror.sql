-- ============================================================
-- SIG360 — CRM Mirror (Redtail read-only sync)  v1
--
-- SIG360's own contact/household/note/appointment tables, populated
-- by a read-only sync from Redtail (Redtail stays source of truth).
-- Named generically with a `source` column so these also serve the
-- broader JSON→Supabase migration, not just Redtail.
--
-- Additive + idempotent-ish (uses IF NOT EXISTS where possible).
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Reuse the updated_at trigger fn from the RBAC migration if present;
-- (re)define defensively so this migration can stand alone.
CREATE OR REPLACE FUNCTION sig_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- True when the current auth user is an active internal SIG staff member.
CREATE OR REPLACE FUNCTION sig_is_active_internal()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM sig_profiles p
    WHERE p.auth_user_id = auth.uid()
      AND p.is_internal_user = true
      AND p.status = 'active'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ─── HOUSEHOLDS ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sig_households (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  source       text        NOT NULL DEFAULT 'redtail',
  external_id  text        NOT NULL,
  name         text,
  raw          jsonb,
  synced_at    timestamptz NOT NULL DEFAULT now(),
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (source, external_id)
);
DROP TRIGGER IF EXISTS sig_households_updated_at ON sig_households;
CREATE TRIGGER sig_households_updated_at
  BEFORE UPDATE ON sig_households FOR EACH ROW EXECUTE FUNCTION sig_set_updated_at();

-- ─── CONTACTS ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sig_contacts (
  id                          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  source                      text        NOT NULL DEFAULT 'redtail',
  external_id                 text        NOT NULL,

  first_name                  text,
  last_name                   text,
  full_name                   text,
  email                       text,
  phone                       text,
  mobile_phone                text,
  home_phone                  text,
  work_phone                  text,
  company_name                text,

  status                      text,
  contact_type                text,          -- client | lead | company

  city                        text,
  state                       text,
  zip_code                    text,
  country                     text,

  -- Household linkage (resolved during sync).
  household_external_id       text,
  household_id                uuid REFERENCES sig_households(id) ON DELETE SET NULL,

  -- Advisor assignments as they appear in Redtail (labels), plus a resolved
  -- link to a SIG staff profile when we can match by email/name.
  servicing_advisor           text,
  writing_advisor             text,
  assigned_planner            text,
  assigned_staff_id           uuid REFERENCES sig_profiles(id) ON DELETE SET NULL,

  tags                        jsonb,
  raw                         jsonb,

  redtail_created_at          timestamptz,
  redtail_updated_at          timestamptz,
  last_activity_at            timestamptz,

  synced_at                   timestamptz NOT NULL DEFAULT now(),
  created_at                  timestamptz NOT NULL DEFAULT now(),
  updated_at                  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (source, external_id)
);
CREATE INDEX IF NOT EXISTS idx_sig_contacts_email      ON sig_contacts (lower(email));
CREATE INDEX IF NOT EXISTS idx_sig_contacts_household  ON sig_contacts (household_id);
CREATE INDEX IF NOT EXISTS idx_sig_contacts_type       ON sig_contacts (contact_type);
CREATE INDEX IF NOT EXISTS idx_sig_contacts_staff      ON sig_contacts (assigned_staff_id);
DROP TRIGGER IF EXISTS sig_contacts_updated_at ON sig_contacts;
CREATE TRIGGER sig_contacts_updated_at
  BEFORE UPDATE ON sig_contacts FOR EACH ROW EXECUTE FUNCTION sig_set_updated_at();

-- ─── NOTES / ACTIVITIES (note-type) ───────────────────────
CREATE TABLE IF NOT EXISTS sig_notes (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  source               text        NOT NULL DEFAULT 'redtail',
  external_id          text        NOT NULL,
  contact_external_id  text,
  contact_id           uuid REFERENCES sig_contacts(id) ON DELETE SET NULL,
  body                 text,
  category             text,
  note_type            text,
  author               text,
  redtail_created_at   timestamptz,
  raw                  jsonb,
  synced_at            timestamptz NOT NULL DEFAULT now(),
  created_at           timestamptz NOT NULL DEFAULT now(),
  UNIQUE (source, external_id)
);
CREATE INDEX IF NOT EXISTS idx_sig_notes_contact ON sig_notes (contact_id);
CREATE INDEX IF NOT EXISTS idx_sig_notes_contact_ext ON sig_notes (contact_external_id);

-- ─── APPOINTMENTS / CALENDAR ──────────────────────────────
CREATE TABLE IF NOT EXISTS sig_appointments (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  source               text        NOT NULL DEFAULT 'redtail',
  external_id          text        NOT NULL,
  contact_external_id  text,
  contact_id           uuid REFERENCES sig_contacts(id) ON DELETE SET NULL,
  title                text,
  description          text,
  location             text,
  start_at             timestamptz,
  end_at               timestamptz,
  all_day              boolean     NOT NULL DEFAULT false,
  status               text,
  activity_type        text,
  assigned_to          text,
  raw                  jsonb,
  synced_at            timestamptz NOT NULL DEFAULT now(),
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now(),
  UNIQUE (source, external_id)
);
CREATE INDEX IF NOT EXISTS idx_sig_appts_contact ON sig_appointments (contact_id);
CREATE INDEX IF NOT EXISTS idx_sig_appts_start   ON sig_appointments (start_at);
DROP TRIGGER IF EXISTS sig_appointments_updated_at ON sig_appointments;
CREATE TRIGGER sig_appointments_updated_at
  BEFORE UPDATE ON sig_appointments FOR EACH ROW EXECUTE FUNCTION sig_set_updated_at();

-- ─── SYNC RUNS (observability) ────────────────────────────
CREATE TABLE IF NOT EXISTS sig_sync_runs (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  source        text        NOT NULL DEFAULT 'redtail',
  status        text        NOT NULL DEFAULT 'running', -- running | success | partial | error
  started_at    timestamptz NOT NULL DEFAULT now(),
  finished_at   timestamptz,
  counts        jsonb,
  error         text,
  triggered_by  uuid REFERENCES sig_profiles(id) ON DELETE SET NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_sig_sync_runs_started ON sig_sync_runs (started_at DESC);

-- ─── ROW LEVEL SECURITY ───────────────────────────────────
-- App reads/writes via the service role (bypasses RLS). These policies
-- gate any future direct client access: internal staff may read.
ALTER TABLE sig_households    ENABLE ROW LEVEL SECURITY;
ALTER TABLE sig_contacts      ENABLE ROW LEVEL SECURITY;
ALTER TABLE sig_notes         ENABLE ROW LEVEL SECURITY;
ALTER TABLE sig_appointments  ENABLE ROW LEVEL SECURITY;
ALTER TABLE sig_sync_runs     ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS sig_households_read ON sig_households;
CREATE POLICY sig_households_read ON sig_households FOR SELECT USING (sig_is_active_internal());
DROP POLICY IF EXISTS sig_contacts_read ON sig_contacts;
CREATE POLICY sig_contacts_read ON sig_contacts FOR SELECT USING (sig_is_active_internal());
DROP POLICY IF EXISTS sig_notes_read ON sig_notes;
CREATE POLICY sig_notes_read ON sig_notes FOR SELECT USING (sig_is_active_internal());
DROP POLICY IF EXISTS sig_appointments_read ON sig_appointments;
CREATE POLICY sig_appointments_read ON sig_appointments FOR SELECT USING (sig_is_active_internal());
DROP POLICY IF EXISTS sig_sync_runs_read ON sig_sync_runs;
CREATE POLICY sig_sync_runs_read ON sig_sync_runs FOR SELECT USING (sig_is_active_internal());
