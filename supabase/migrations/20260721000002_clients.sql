-- ============================================================
-- CFS — Clients & Wards  v1
--
-- Every protected person and estate CFS stewards, and the fiduciary
-- role CFS holds for each.
--
-- Person identity is NOT duplicated here: where the client is a
-- person already in the CRM, contact_id points at sig_contacts and
-- the name, DOB and contact details live there. display_name exists
-- because not every client is a person — "Whitfield Family Trust"
-- and "Harold Munro (Estate)" are clients with no contact record.
--
-- Idempotent: safe to re-run. Requires 20260721000001_matters.sql.
-- ============================================================

CREATE TABLE IF NOT EXISTS sig_clients (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name      TEXT NOT NULL,
  contact_id        UUID REFERENCES sig_contacts (id) ON DELETE SET NULL,
  matter_id         UUID REFERENCES sig_matters (id) ON DELETE SET NULL,

  client_kind       TEXT NOT NULL DEFAULT 'individual',
  fiduciary_role    TEXT NOT NULL DEFAULT 'trustee',
  court_supervised  BOOLEAN NOT NULL DEFAULT false,
  status            TEXT NOT NULL DEFAULT 'onboarding',

  -- Where a ward actually lives. Fiduciaries visit, and the facility
  -- is the single most-asked-for field on a protected person.
  residence_type    TEXT,
  facility_name     TEXT,
  room_number       TEXT,

  appointed_at      DATE,
  next_review_at    TIMESTAMPTZ,
  assigned_staff_id UUID REFERENCES sig_profiles (id) ON DELETE SET NULL,
  notes             TEXT,
  archived_at       TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT sig_clients_kind_check CHECK (client_kind IN (
    'individual', 'ward', 'estate', 'trust'
  )),
  CONSTRAINT sig_clients_role_check CHECK (fiduciary_role IN (
    'conservator', 'guardian', 'personal_representative',
    'trustee', 'successor_trustee', 'agent_poa'
  )),
  CONSTRAINT sig_clients_status_check CHECK (status IN (
    'onboarding', 'active', 'inactive', 'closed'
  ))
);

CREATE INDEX IF NOT EXISTS idx_sig_clients_status   ON sig_clients (status);
CREATE INDEX IF NOT EXISTS idx_sig_clients_contact  ON sig_clients (contact_id);
CREATE INDEX IF NOT EXISTS idx_sig_clients_matter   ON sig_clients (matter_id);
CREATE INDEX IF NOT EXISTS idx_sig_clients_assigned ON sig_clients (assigned_staff_id);
CREATE INDEX IF NOT EXISTS idx_sig_clients_review   ON sig_clients (next_review_at);
CREATE INDEX IF NOT EXISTS idx_sig_clients_archived ON sig_clients (archived_at);

-- ─── ROW LEVEL SECURITY ───────────────────────────────────
-- Server code uses the service-role key and bypasses this. The policy
-- exists so a leaked anon key cannot read protected-person data.
ALTER TABLE sig_clients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS sig_clients_read ON sig_clients;
CREATE POLICY sig_clients_read ON sig_clients
  FOR SELECT USING (sig_is_active_internal());

-- ─── updated_at ───────────────────────────────────────────
DROP TRIGGER IF EXISTS trg_sig_clients_updated_at ON sig_clients;
CREATE TRIGGER trg_sig_clients_updated_at
  BEFORE UPDATE ON sig_clients
  FOR EACH ROW EXECUTE FUNCTION sig_matters_touch_updated_at();
