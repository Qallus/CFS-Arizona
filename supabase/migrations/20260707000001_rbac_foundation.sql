-- ============================================================
-- SIG360 — RBAC Foundation  v1
-- User management, roles, statuses, assignments, audit logs.
--
-- Additive migration: creates SIG360's own schema. It does not
-- modify or depend on any existing table, so it is safe to apply
-- to a fresh Supabase project without breaking current workflows.
--
-- Role/permission *values* are mirrored in src/lib/rbac/* so the
-- app and the database stay in sync. Keep the two in lockstep.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── updated_at trigger ───────────────────────────────────
CREATE OR REPLACE FUNCTION sig_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ─── ENUMS ────────────────────────────────────────────────
-- Internal + external roles. Mirrors ROLES in src/lib/rbac/roles.ts.
CREATE TYPE sig_user_role AS ENUM (
  -- internal
  'super_admin',
  'owner_leadership',
  'admin',
  'financial_planner',
  'writing_advisor',
  'servicing_advisor',
  'planner_administrator',
  'client_service_associate',
  'marketing_manager',
  'event_coordinator',
  'compliance_reviewer',
  'support_operations',
  'read_only',
  -- external
  'client',
  'household_member',
  'prospect',
  'referral_partner',
  'professional_partner',
  'investment_committee',
  'vendor_partner',
  'event_guest'
);

-- Mirrors USER_STATUSES in src/lib/rbac/user-statuses.ts.
CREATE TYPE sig_user_status AS ENUM (
  'invited',
  'active',
  'pending_setup',
  'pending_review',
  'suspended',
  'inactive',
  'archived',
  'deleted'
);

-- ─── PROFILES ─────────────────────────────────────────────
-- One row per person known to SIG360 that can (or may later) log in.
-- auth_user_id links to Supabase Auth when that user has credentials;
-- it is nullable so invited/record-only users can exist first.
CREATE TABLE sig_profiles (
  id                            uuid            PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id                  uuid            UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,

  first_name                    text,
  last_name                     text,
  display_name                  text,
  email                         text            NOT NULL,
  phone                         text,
  mobile_phone                  text,
  profile_photo_url             text,

  role                          sig_user_role   NOT NULL DEFAULT 'support_operations',
  title                         text,
  department                    text,
  bio                           text,
  calendar_link                 text,
  timezone                      text,
  status                        sig_user_status NOT NULL DEFAULT 'invited',

  -- Per-user permission tuning layered on top of the role map.
  extra_permissions             text[]          NOT NULL DEFAULT '{}',
  revoked_permissions           text[]          NOT NULL DEFAULT '{}',

  -- Relationships (kept as columns for the common single-assignee cases;
  -- many-to-many client/household assignments live in sig_client_assignments).
  assigned_planner_id           uuid            REFERENCES sig_profiles(id) ON DELETE SET NULL,
  assigned_servicing_advisor_id uuid            REFERENCES sig_profiles(id) ON DELETE SET NULL,
  company_id                    uuid,
  household_id                  uuid,

  -- Cross-system linkage to existing CRM records (Redtail / Fluent / leads).
  client_id                     text,
  contact_id                    text,
  lead_id                       text,
  prospect_id                   text,

  is_internal_user              boolean         NOT NULL DEFAULT true,
  is_external_user              boolean         NOT NULL DEFAULT false,
  can_login                     boolean         NOT NULL DEFAULT true,

  created_by                    uuid            REFERENCES sig_profiles(id) ON DELETE SET NULL,
  created_at                    timestamptz     NOT NULL DEFAULT now(),
  updated_at                    timestamptz     NOT NULL DEFAULT now(),
  last_login_at                 timestamptz
);
CREATE UNIQUE INDEX idx_sig_profiles_email_lower ON sig_profiles (lower(email));
CREATE INDEX idx_sig_profiles_role     ON sig_profiles (role);
CREATE INDEX idx_sig_profiles_status   ON sig_profiles (status);
CREATE INDEX idx_sig_profiles_planner  ON sig_profiles (assigned_planner_id);
CREATE INDEX idx_sig_profiles_servicer ON sig_profiles (assigned_servicing_advisor_id);
CREATE TRIGGER sig_profiles_updated_at
  BEFORE UPDATE ON sig_profiles FOR EACH ROW EXECUTE FUNCTION sig_set_updated_at();

-- ─── CLIENT / HOUSEHOLD ASSIGNMENTS ───────────────────────
-- Which advisor/staff member is assigned to which client or household,
-- and in what capacity. Drives canAccessClient / canAccessHousehold.
CREATE TABLE sig_client_assignments (
  id            uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id      uuid          NOT NULL REFERENCES sig_profiles(id) ON DELETE CASCADE,
  -- Assignment targets an app-level client and/or household record.
  -- Stored as text ids so they can reference Redtail/Fluent/local records.
  client_id     text,
  household_id  text,
  relationship  text          NOT NULL DEFAULT 'planner', -- planner | writing_advisor | servicing_advisor | planner_administrator | csa
  created_by    uuid          REFERENCES sig_profiles(id) ON DELETE SET NULL,
  created_at    timestamptz   NOT NULL DEFAULT now(),
  CHECK (client_id IS NOT NULL OR household_id IS NOT NULL)
);
CREATE INDEX idx_sig_assignments_staff     ON sig_client_assignments (staff_id);
CREATE INDEX idx_sig_assignments_client    ON sig_client_assignments (client_id);
CREATE INDEX idx_sig_assignments_household ON sig_client_assignments (household_id);

-- ─── AUDIT LOGS ───────────────────────────────────────────
-- Fields match the spec (Docs/features/SIG360-user-management-roles-permissions.md).
CREATE TABLE sig_audit_logs (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id  uuid        REFERENCES sig_profiles(id) ON DELETE SET NULL,
  target_user_id uuid        REFERENCES sig_profiles(id) ON DELETE SET NULL,
  action         text        NOT NULL,
  entity_type    text,
  entity_id      text,
  old_value      jsonb,
  new_value      jsonb,
  metadata_json  jsonb,
  ip_address     text,
  user_agent     text,
  created_at     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_sig_audit_actor   ON sig_audit_logs (actor_user_id);
CREATE INDEX idx_sig_audit_target  ON sig_audit_logs (target_user_id);
CREATE INDEX idx_sig_audit_action  ON sig_audit_logs (action);
CREATE INDEX idx_sig_audit_created ON sig_audit_logs (created_at DESC);

-- ─── ROW LEVEL SECURITY ───────────────────────────────────
-- Server code uses the service-role key (bypasses RLS) so existing
-- routes keep working. These policies protect any client-side/anon
-- access and prepare for Supabase Auth adoption.
ALTER TABLE sig_profiles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE sig_client_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE sig_audit_logs         ENABLE ROW LEVEL SECURITY;

-- True when the current auth user is an internal admin-class role.
CREATE OR REPLACE FUNCTION sig_is_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM sig_profiles p
    WHERE p.auth_user_id = auth.uid()
      AND p.role IN ('super_admin', 'owner_leadership', 'admin')
      AND p.status = 'active'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Profiles: a user can read/update their own row; admins manage all.
CREATE POLICY sig_profiles_self_read ON sig_profiles
  FOR SELECT USING (auth_user_id = auth.uid() OR sig_is_admin());
CREATE POLICY sig_profiles_self_update ON sig_profiles
  FOR UPDATE USING (auth_user_id = auth.uid() OR sig_is_admin());
CREATE POLICY sig_profiles_admin_write ON sig_profiles
  FOR INSERT WITH CHECK (sig_is_admin());
CREATE POLICY sig_profiles_admin_delete ON sig_profiles
  FOR DELETE USING (sig_is_admin());

-- Assignments: staff can see their own; admins manage all.
CREATE POLICY sig_assignments_read ON sig_client_assignments
  FOR SELECT USING (
    sig_is_admin()
    OR staff_id IN (SELECT id FROM sig_profiles WHERE auth_user_id = auth.uid())
  );
CREATE POLICY sig_assignments_admin_write ON sig_client_assignments
  FOR ALL USING (sig_is_admin()) WITH CHECK (sig_is_admin());

-- Audit logs: readable by admins/compliance; never client-writable.
CREATE POLICY sig_audit_read ON sig_audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM sig_profiles p
      WHERE p.auth_user_id = auth.uid()
        AND p.role IN ('super_admin', 'owner_leadership', 'admin', 'compliance_reviewer', 'read_only')
        AND p.status = 'active'
    )
  );
