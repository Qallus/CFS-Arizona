-- ============================================================
-- CFS — Employee HR: mileage expense log + document portal
--
--   sig_mileage_logs        — per-employee mileage expense entries
--   sig_employee_doc_types  — the required document checklist
--   sig_employee_documents  — an employee's uploaded/verified docs
--
-- Employees upload their own records; Super Admins verify them.
-- Additive + idempotent.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── MILEAGE EXPENSE LOG ──────────────────────────────────
CREATE TABLE IF NOT EXISTS sig_mileage_logs (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id     uuid        NOT NULL REFERENCES sig_profiles(id) ON DELETE CASCADE,
  trip_date      date        NOT NULL DEFAULT current_date,
  purpose        text,
  from_location  text,
  to_location    text,
  miles          numeric(8,2)  NOT NULL DEFAULT 0,
  rate_per_mile  numeric(6,3)  NOT NULL DEFAULT 0.700,
  amount         numeric(10,2) GENERATED ALWAYS AS (round(miles * rate_per_mile, 2)) STORED,
  -- Optional: mileage driven on behalf of a specific client/matter.
  contact_id     uuid        REFERENCES sig_contacts(id) ON DELETE SET NULL,
  notes          text,
  status         text        NOT NULL DEFAULT 'submitted', -- draft|submitted|approved|reimbursed
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_sig_mileage_profile ON sig_mileage_logs (profile_id);
CREATE INDEX IF NOT EXISTS idx_sig_mileage_date    ON sig_mileage_logs (trip_date DESC);
CREATE INDEX IF NOT EXISTS idx_sig_mileage_status  ON sig_mileage_logs (status);
DROP TRIGGER IF EXISTS sig_mileage_updated_at ON sig_mileage_logs;
CREATE TRIGGER sig_mileage_updated_at
  BEFORE UPDATE ON sig_mileage_logs FOR EACH ROW EXECUTE FUNCTION sig_set_updated_at();

-- ─── EMPLOYEE DOCUMENT TYPES (the checklist) ──────────────
CREATE TABLE IF NOT EXISTS sig_employee_doc_types (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  key           text        NOT NULL UNIQUE,
  name          text        NOT NULL,
  description   text,
  category      text        NOT NULL DEFAULT 'other', -- insurance|driving|agreement|credential|payroll|other
  required      boolean     NOT NULL DEFAULT true,
  tracks_expiry boolean     NOT NULL DEFAULT false,
  sort_order    integer     NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now()
);

INSERT INTO sig_employee_doc_types (key, name, description, category, required, tracks_expiry, sort_order)
VALUES
  ('auto_insurance',       'Auto insurance certificate', 'Proof of current auto liability coverage.',        'insurance',  true,  true,  10),
  ('drivers_license',      'Driver''s license',          'Current, unexpired driver''s license.',            'driving',    true,  true,  20),
  ('driving_record',       'Motor vehicle record (MVR)', 'Driving record pulled within the last 12 months.', 'driving',    true,  true,  30),
  ('employment_agreement', 'Employment agreement',       'Signed employment agreement.',                     'agreement',  true,  false, 40),
  ('confidentiality',      'Confidentiality & NDA',      'Signed confidentiality agreement.',                'agreement',  true,  false, 50),
  ('background_check',     'Background check',           'Completed background check authorization.',        'credential', true,  false, 60),
  ('fiduciary_cert',       'Fiduciary certification',    'AZ fiduciary certification, if applicable.',       'credential', false, true,  70),
  ('w4',                   'W-4 tax withholding',        'Signed federal W-4.',                              'payroll',    true,  false, 80),
  ('direct_deposit',       'Direct deposit form',        'Banking details for payroll.',                     'payroll',    false, false, 90)
ON CONFLICT (key) DO NOTHING;

-- ─── EMPLOYEE DOCUMENTS (uploads) ─────────────────────────
CREATE TABLE IF NOT EXISTS sig_employee_documents (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id   uuid        NOT NULL REFERENCES sig_profiles(id) ON DELETE CASCADE,
  doc_type_id  uuid        NOT NULL REFERENCES sig_employee_doc_types(id) ON DELETE CASCADE,
  file_name    text,
  file_url     text,
  status       text        NOT NULL DEFAULT 'uploaded', -- uploaded|verified|rejected
  expires_at   date,
  notes        text,
  uploaded_at  timestamptz NOT NULL DEFAULT now(),
  verified_at  timestamptz,
  verified_by  uuid        REFERENCES sig_profiles(id) ON DELETE SET NULL,
  updated_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (profile_id, doc_type_id)
);
CREATE INDEX IF NOT EXISTS idx_sig_emp_docs_profile ON sig_employee_documents (profile_id);
CREATE INDEX IF NOT EXISTS idx_sig_emp_docs_status  ON sig_employee_documents (status);
DROP TRIGGER IF EXISTS sig_emp_docs_updated_at ON sig_employee_documents;
CREATE TRIGGER sig_emp_docs_updated_at
  BEFORE UPDATE ON sig_employee_documents FOR EACH ROW EXECUTE FUNCTION sig_set_updated_at();

-- ─── ROW LEVEL SECURITY ───────────────────────────────────
ALTER TABLE sig_mileage_logs       ENABLE ROW LEVEL SECURITY;
ALTER TABLE sig_employee_doc_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE sig_employee_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS sig_mileage_read ON sig_mileage_logs;
CREATE POLICY sig_mileage_read ON sig_mileage_logs FOR SELECT USING (sig_is_active_internal());
DROP POLICY IF EXISTS sig_doc_types_read ON sig_employee_doc_types;
CREATE POLICY sig_doc_types_read ON sig_employee_doc_types FOR SELECT USING (sig_is_active_internal());
DROP POLICY IF EXISTS sig_emp_docs_read ON sig_employee_documents;
CREATE POLICY sig_emp_docs_read ON sig_employee_documents FOR SELECT USING (sig_is_active_internal());
