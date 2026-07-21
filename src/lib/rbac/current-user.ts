/**
 * Current-user seam.
 *
 * Resolution order:
 *   1. Supabase Auth session (real per-user account) → its sig_profiles row
 *      supplies the real role + permissions.
 *   2. Legacy single-admin cookie → treated as super_admin so the owner is
 *      never locked out during/after the auth cutover.
 *
 * This is the ONE place that maps a live session to an RbacUser. When the
 * legacy admin is fully retired, delete the step-2 fallback and this file is
 * the only thing that changes.
 */
import { getSession } from '@/lib/auth';
import { supabaseAdmin, hasServiceRoleKey } from '@/lib/supabase';
import { createSupabaseServerClient, isSupabaseAuthConfigured } from '@/lib/supabase-server';
import { ROLES, isRole, type Role } from './roles';
import { USER_STATUSES, type UserStatus } from './user-statuses';
import type { RbacUser } from './types';

export interface SessionIdentity {
  email: string;
  name?: string;
  source: 'supabase' | 'legacy';
}

/** Who is making this request (Supabase session first, then legacy cookie). */
export async function getSessionIdentity(): Promise<SessionIdentity | null> {
  if (isSupabaseAuthConfigured()) {
    try {
      const supabase = await createSupabaseServerClient();
      const { data } = await supabase.auth.getUser();
      if (data?.user?.email) {
        const meta = (data.user.user_metadata ?? {}) as { name?: string; full_name?: string };
        return { email: data.user.email, name: meta.name || meta.full_name, source: 'supabase' };
      }
    } catch {
      // fall through to legacy
    }
  }
  const session = await getSession();
  if (session?.user?.email) {
    return { email: session.user.email, name: session.user.name, source: 'legacy' };
  }
  return null;
}

const PROFILE_COLS =
  'id, email, role, status, extra_permissions, revoked_permissions, client_id, household_id';

interface ProfileRowLite {
  id: string;
  email: string;
  role: string;
  status: string | null;
  extra_permissions: string[] | null;
  revoked_permissions: string[] | null;
  client_id: string | null;
  household_id: string | null;
}

function toRbacUser(data: ProfileRowLite): RbacUser {
  const role: Role = isRole(data.role) ? data.role : ROLES.SUPPORT_OPERATIONS;
  return {
    id: data.id,
    email: data.email,
    role,
    status: (data.status as UserStatus) ?? USER_STATUSES.ACTIVE,
    extraPermissions: data.extra_permissions ?? [],
    revokedPermissions: data.revoked_permissions ?? [],
    clientId: data.client_id ?? null,
    householdId: data.household_id ?? null,
  };
}

/** Service-role read of any profile (bypasses RLS). The normal path. */
async function loadProfileViaAdmin(email: string): Promise<RbacUser | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('sig_profiles')
      .select(PROFILE_COLS)
      .ilike('email', email)
      .maybeSingle();

    if (error) {
      console.error('[rbac] sig_profiles admin lookup failed:', error.message);
      return null;
    }
    if (!data) {
      // "No row" and "RLS hid the row" are indistinguishable here, and the
      // second happens whenever the service-role key is missing or wrong.
      console.warn(
        `[rbac] no sig_profiles row for ${email} via admin client` +
          (hasServiceRoleKey ? '' : ' (SUPABASE_SERVICE_ROLE_KEY missing — using the anon key)'),
      );
      return null;
    }
    return toRbacUser(data as ProfileRowLite);
  } catch (err) {
    // sig_profiles not migrated yet, or Supabase unconfigured.
    console.error('[rbac] sig_profiles admin lookup threw:', (err as Error).message);
    return null;
  }
}

/**
 * RLS-scoped read of the caller's OWN profile through their session.
 *
 * The `sig_profiles_self_read` policy grants `auth_user_id = auth.uid()`, so a
 * signed-in user can always reach their own row with just the anon key. This is
 * the safety net for the failure that is otherwise invisible: when the
 * service-role key is absent or belongs to another project, `supabaseAdmin`
 * quietly degrades to the anon client, every admin read comes back empty with
 * no error, and a fully provisioned user looks unauthenticated.
 *
 * Still filtered by email: the policy also grants admins every row via
 * `sig_is_admin()`, so an unfiltered read would return the whole table and
 * `maybeSingle()` would fail for exactly the admins who need this most.
 */
async function loadProfileViaSession(email: string): Promise<RbacUser | null> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from('sig_profiles')
      .select(PROFILE_COLS)
      .ilike('email', email)
      .maybeSingle();

    if (error || !data) return null;
    console.warn('[rbac] resolved profile via the session client — check SUPABASE_SERVICE_ROLE_KEY');
    return toRbacUser(data as ProfileRowLite);
  } catch {
    return null;
  }
}

/**
 * Resolve the current RbacUser, or null if unauthenticated / unprovisioned.
 * Server-only.
 */
export async function getCurrentRbacUser(): Promise<RbacUser | null> {
  const identity = await getSessionIdentity();
  if (!identity) return null;

  const profile =
    (await loadProfileViaAdmin(identity.email)) ??
    (identity.source === 'supabase' ? await loadProfileViaSession(identity.email) : null);
  if (profile) return profile;

  // Owner fallback → super_admin so the configured owner is never locked out,
  // whether they signed in via the legacy cookie OR via Supabase Auth without a
  // sig_profiles row yet. Gated to the legacy cookie or the configured admin
  // email; any other Supabase user with no profile has no access (returns null).
  // Owner emails: the legacy admin plus any extra emails in CFS_ADMIN_EMAILS
  // (comma-separated). Lets the real owner in whether they authenticate via the
  // legacy cookie or Supabase Auth, without a sig_profiles row yet.
  const ownerEmails = new Set(
    [process.env.SIG360_ADMIN_EMAIL, ...(process.env.CFS_ADMIN_EMAILS || '').split(',')]
      .map((e) => (e || '').trim().toLowerCase())
      .filter(Boolean),
  );
  const isOwner = identity.source === 'legacy' || ownerEmails.has(identity.email.trim().toLowerCase());
  if (isOwner) {
    return {
      id: 'legacy-admin',
      email: identity.email,
      role: ROLES.SUPER_ADMIN,
      status: USER_STATUSES.ACTIVE,
      extraPermissions: [],
      revokedPermissions: [],
      clientId: null,
      householdId: null,
    };
  }
  return null;
}
