-- ============================================================
-- CFS — Matters  v1
--
-- The caseload spine: one row per engagement CFS is appointed to.
-- Ships with three GENERIC companion tables (favorites, shares,
-- attachments) keyed by (entity_type, entity_id) so the remaining
-- dashboard pages reuse them instead of each growing its own.
--
-- Idempotent: safe to re-run.
-- ============================================================

-- ─── MATTERS ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sig_matters (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  matter_ref        TEXT NOT NULL,
  title             TEXT,
  matter_type       TEXT NOT NULL DEFAULT 'trust_administration',
  status            TEXT NOT NULL DEFAULT 'onboarding',
  contact_id        UUID REFERENCES sig_contacts (id) ON DELETE SET NULL,
  client_name       TEXT,
  venue             TEXT,
  court_case_number TEXT,
  opened_at         DATE,
  closed_at         DATE,
  next_deadline_at  TIMESTAMPTZ,
  assigned_staff_id UUID REFERENCES sig_profiles (id) ON DELETE SET NULL,
  notes             TEXT,
  archived_at       TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT sig_matters_type_check CHECK (matter_type IN (
    'conservatorship', 'guardianship', 'estate_administration',
    'trust_administration', 'power_of_attorney', 'special_needs_trust'
  )),
  CONSTRAINT sig_matters_status_check CHECK (status IN (
    'onboarding', 'active', 'court_supervision', 'closed'
  ))
);

-- Matter refs are the practice's own file numbers; keep them unique.
CREATE UNIQUE INDEX IF NOT EXISTS idx_sig_matters_ref ON sig_matters (lower(matter_ref));
CREATE INDEX IF NOT EXISTS idx_sig_matters_status   ON sig_matters (status);
CREATE INDEX IF NOT EXISTS idx_sig_matters_contact  ON sig_matters (contact_id);
CREATE INDEX IF NOT EXISTS idx_sig_matters_assigned ON sig_matters (assigned_staff_id);
CREATE INDEX IF NOT EXISTS idx_sig_matters_deadline ON sig_matters (next_deadline_at);
CREATE INDEX IF NOT EXISTS idx_sig_matters_archived ON sig_matters (archived_at);

-- ─── FAVORITES (generic) ──────────────────────────────────
-- One row per (user, thing). Favoriting is per-user, never shared.
CREATE TABLE IF NOT EXISTS sig_favorites (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id  UUID NOT NULL REFERENCES sig_profiles (id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,
  entity_id   UUID NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_sig_favorites_unique
  ON sig_favorites (profile_id, entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_sig_favorites_entity ON sig_favorites (entity_type, entity_id);

-- ─── SHARES (generic) ─────────────────────────────────────
-- An explicit grant of one record to one teammate. Deliberately
-- internal-only: nothing here mints a public link, because these
-- records concern vulnerable adults under court supervision.
CREATE TABLE IF NOT EXISTS sig_shares (
  id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type            TEXT NOT NULL,
  entity_id              UUID NOT NULL,
  shared_with_profile_id UUID NOT NULL REFERENCES sig_profiles (id) ON DELETE CASCADE,
  shared_by_profile_id   UUID REFERENCES sig_profiles (id) ON DELETE SET NULL,
  permission             TEXT NOT NULL DEFAULT 'view',
  note                   TEXT,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT sig_shares_permission_check CHECK (permission IN ('view', 'edit'))
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_sig_shares_unique
  ON sig_shares (entity_type, entity_id, shared_with_profile_id);
CREATE INDEX IF NOT EXISTS idx_sig_shares_recipient ON sig_shares (shared_with_profile_id);

-- ─── ATTACHMENTS (generic) ────────────────────────────────
CREATE TABLE IF NOT EXISTS sig_attachments (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type  TEXT NOT NULL,
  entity_id    UUID NOT NULL,
  file_name    TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  mime_type    TEXT,
  size_bytes   BIGINT,
  uploaded_by  UUID REFERENCES sig_profiles (id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_sig_attachments_entity ON sig_attachments (entity_type, entity_id);

-- ─── STORAGE ──────────────────────────────────────────────
-- PRIVATE, unlike the profile-photos bucket. These files are court
-- filings, medical records and financial statements for people under
-- guardianship. Reads go through short-lived signed URLs issued by the
-- server after an RBAC check -- never a public object URL.
INSERT INTO storage.buckets (id, name, public)
VALUES ('attachments', 'attachments', false)
ON CONFLICT (id) DO UPDATE SET public = false;

-- No anon/authenticated policies on this bucket on purpose: every read
-- and write is brokered by the server using the service role.

-- ─── ROW LEVEL SECURITY ───────────────────────────────────
-- Server code uses the service-role key and bypasses all of this. The
-- policies exist so that a leaked anon key cannot read client data.
ALTER TABLE sig_matters     ENABLE ROW LEVEL SECURITY;
ALTER TABLE sig_favorites   ENABLE ROW LEVEL SECURITY;
ALTER TABLE sig_shares      ENABLE ROW LEVEL SECURITY;
ALTER TABLE sig_attachments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS sig_matters_read ON sig_matters;
CREATE POLICY sig_matters_read ON sig_matters
  FOR SELECT USING (sig_is_active_internal());

DROP POLICY IF EXISTS sig_attachments_read ON sig_attachments;
CREATE POLICY sig_attachments_read ON sig_attachments
  FOR SELECT USING (sig_is_active_internal());

-- Favorites are personal: you see only your own.
DROP POLICY IF EXISTS sig_favorites_own ON sig_favorites;
CREATE POLICY sig_favorites_own ON sig_favorites
  FOR ALL USING (
    profile_id IN (SELECT id FROM sig_profiles WHERE auth_user_id = auth.uid())
  ) WITH CHECK (
    profile_id IN (SELECT id FROM sig_profiles WHERE auth_user_id = auth.uid())
  );

-- Shares are visible to the sender and the recipient.
DROP POLICY IF EXISTS sig_shares_read ON sig_shares;
CREATE POLICY sig_shares_read ON sig_shares
  FOR SELECT USING (
    shared_with_profile_id IN (SELECT id FROM sig_profiles WHERE auth_user_id = auth.uid())
    OR shared_by_profile_id IN (SELECT id FROM sig_profiles WHERE auth_user_id = auth.uid())
  );

-- ─── updated_at ───────────────────────────────────────────
CREATE OR REPLACE FUNCTION sig_matters_touch_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sig_matters_updated_at ON sig_matters;
CREATE TRIGGER trg_sig_matters_updated_at
  BEFORE UPDATE ON sig_matters
  FOR EACH ROW EXECUTE FUNCTION sig_matters_touch_updated_at();
