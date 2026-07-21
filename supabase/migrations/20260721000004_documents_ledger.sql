-- ============================================================
-- CFS — Documents + Bill Pay & Ledger  v1
--
-- Requires 20260721000001_matters.sql and 20260721000002_clients.sql.
-- Idempotent: safe to re-run.
-- ============================================================

-- ─── DOCUMENTS ────────────────────────────────────────────
-- Unlike the other pages, the file IS the record here, so the storage
-- pointer lives on the row rather than in sig_attachments. Files go in
-- the same private 'attachments' bucket under a document/ prefix.
CREATE TABLE IF NOT EXISTS sig_documents (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT NOT NULL,
  doc_type      TEXT NOT NULL DEFAULT 'other',
  status        TEXT NOT NULL DEFAULT 'draft',

  client_id     UUID REFERENCES sig_clients (id) ON DELETE SET NULL,
  matter_id     UUID REFERENCES sig_matters (id) ON DELETE SET NULL,

  file_name     TEXT,
  storage_path  TEXT,
  mime_type     TEXT,
  size_bytes    BIGINT,

  effective_at  DATE,
  -- Powers of attorney, insurance and bonds lapse. This is what the
  -- calendar view keys on so an expiry is visible before it happens.
  expires_at    DATE,

  uploaded_by   UUID REFERENCES sig_profiles (id) ON DELETE SET NULL,
  notes         TEXT,
  archived_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT sig_documents_type_check CHECK (doc_type IN (
    'court_filing', 'legal', 'medical', 'financial', 'insurance',
    'identification', 'correspondence', 'other'
  )),
  CONSTRAINT sig_documents_status_check CHECK (status IN (
    'draft', 'final', 'filed', 'expired'
  ))
);

CREATE INDEX IF NOT EXISTS idx_sig_documents_client   ON sig_documents (client_id);
CREATE INDEX IF NOT EXISTS idx_sig_documents_matter   ON sig_documents (matter_id);
CREATE INDEX IF NOT EXISTS idx_sig_documents_type     ON sig_documents (doc_type);
CREATE INDEX IF NOT EXISTS idx_sig_documents_status   ON sig_documents (status);
CREATE INDEX IF NOT EXISTS idx_sig_documents_expires  ON sig_documents (expires_at);
CREATE INDEX IF NOT EXISTS idx_sig_documents_archived ON sig_documents (archived_at);

-- ─── LEDGER ───────────────────────────────────────────────
-- The trust ledger: money held FOR a client, moving in and out.
--
-- amount_cents is BIGINT, deliberately. This is client trust money that
-- gets reported to a court; a floating-point cent that drifts on the
-- third reconciliation is a compliance problem, not a rounding nit.
-- Every amount is stored as a whole number of cents and formatted for
-- display. Signed: positive is money in, negative is money out, so a
-- balance is a plain SUM with no CASE on entry_type.
CREATE TABLE IF NOT EXISTS sig_ledger_entries (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id     UUID REFERENCES sig_clients (id) ON DELETE SET NULL,
  matter_id     UUID REFERENCES sig_matters (id) ON DELETE SET NULL,

  entry_type    TEXT NOT NULL DEFAULT 'disbursement',
  status        TEXT NOT NULL DEFAULT 'scheduled',
  amount_cents  BIGINT NOT NULL DEFAULT 0,

  description   TEXT NOT NULL,
  category      TEXT,
  payee_name    TEXT,
  -- Payees are care facilities, utilities and vendors — mappable.
  payee_address TEXT,
  payee_city    TEXT,
  payee_state   TEXT,

  method        TEXT,
  reference     TEXT,
  account_label TEXT,

  entry_date    DATE,
  due_date      DATE,
  cleared_at    DATE,

  notes         TEXT,
  archived_at   TIMESTAMPTZ,
  created_by    UUID REFERENCES sig_profiles (id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT sig_ledger_type_check CHECK (entry_type IN (
    'deposit', 'disbursement', 'fee', 'transfer', 'adjustment'
  )),
  CONSTRAINT sig_ledger_status_check CHECK (status IN (
    'scheduled', 'pending', 'cleared', 'void'
  )),
  CONSTRAINT sig_ledger_method_check CHECK (method IS NULL OR method IN (
    'check', 'ach', 'card', 'cash', 'wire', 'transfer'
  ))
);

CREATE INDEX IF NOT EXISTS idx_sig_ledger_client   ON sig_ledger_entries (client_id);
CREATE INDEX IF NOT EXISTS idx_sig_ledger_matter   ON sig_ledger_entries (matter_id);
CREATE INDEX IF NOT EXISTS idx_sig_ledger_status   ON sig_ledger_entries (status);
CREATE INDEX IF NOT EXISTS idx_sig_ledger_due      ON sig_ledger_entries (due_date);
CREATE INDEX IF NOT EXISTS idx_sig_ledger_date     ON sig_ledger_entries (entry_date);
CREATE INDEX IF NOT EXISTS idx_sig_ledger_archived ON sig_ledger_entries (archived_at);

-- ─── ROW LEVEL SECURITY ───────────────────────────────────
-- Server code uses the service-role key and bypasses this. These
-- policies keep a leaked anon key from reading client documents or
-- account balances.
ALTER TABLE sig_documents      ENABLE ROW LEVEL SECURITY;
ALTER TABLE sig_ledger_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS sig_documents_read ON sig_documents;
CREATE POLICY sig_documents_read ON sig_documents
  FOR SELECT USING (sig_is_active_internal());

DROP POLICY IF EXISTS sig_ledger_read ON sig_ledger_entries;
CREATE POLICY sig_ledger_read ON sig_ledger_entries
  FOR SELECT USING (sig_is_active_internal());

-- ─── updated_at ───────────────────────────────────────────
DROP TRIGGER IF EXISTS trg_sig_documents_updated_at ON sig_documents;
CREATE TRIGGER trg_sig_documents_updated_at
  BEFORE UPDATE ON sig_documents
  FOR EACH ROW EXECUTE FUNCTION sig_matters_touch_updated_at();

DROP TRIGGER IF EXISTS trg_sig_ledger_updated_at ON sig_ledger_entries;
CREATE TRIGGER trg_sig_ledger_updated_at
  BEFORE UPDATE ON sig_ledger_entries
  FOR EACH ROW EXECUTE FUNCTION sig_matters_touch_updated_at();
