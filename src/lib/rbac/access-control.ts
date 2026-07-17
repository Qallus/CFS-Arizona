/**
 * Access-control helpers. Pure functions — no I/O — so they are safe to
 * use in server routes, server actions, and (for visibility) the client.
 *
 * IMPORTANT: frontend checks are for UX only. Every mutating route or
 * server action must call these on the server too (see route-guards.ts).
 */
import {
  ROLES,
  INTERNAL_ROLES,
  EXTERNAL_ROLES,
  FIRM_WIDE_ROLES,
  ADVISOR_ROLES,
  ROLE_RANK,
  type Role,
} from './roles';
import { ROLE_PERMISSIONS } from './role-permissions';
import { WILDCARD_PERMISSION, type Permission } from './permissions';
import type { RbacUser, ClientAssignment } from './types';

// ─── Role checks ────────────────────────────────────────────
export function hasRole(user: Pick<RbacUser, 'role'> | null | undefined, role: Role): boolean {
  return !!user && user.role === role;
}

export function hasAnyRole(
  user: Pick<RbacUser, 'role'> | null | undefined,
  roles: readonly Role[],
): boolean {
  return !!user && roles.includes(user.role);
}

export function isInternalUser(user: Pick<RbacUser, 'role'> | null | undefined): boolean {
  return !!user && (INTERNAL_ROLES as readonly Role[]).includes(user.role);
}

export function isExternalUser(user: Pick<RbacUser, 'role'> | null | undefined): boolean {
  return !!user && (EXTERNAL_ROLES as readonly Role[]).includes(user.role);
}

export function isFirmWide(user: Pick<RbacUser, 'role'> | null | undefined): boolean {
  return hasAnyRole(user, FIRM_WIDE_ROLES);
}

export function isAdvisor(user: Pick<RbacUser, 'role'> | null | undefined): boolean {
  return hasAnyRole(user, ADVISOR_ROLES);
}

// ─── Permission resolution ──────────────────────────────────
/**
 * The effective permission set for a user:
 *   role defaults  ∪  extraPermissions  −  revokedPermissions
 * super_admin (wildcard) short-circuits to "everything".
 */
export function getEffectivePermissions(
  user: Pick<RbacUser, 'role' | 'extraPermissions' | 'revokedPermissions'> | null | undefined,
): Set<string> {
  if (!user) return new Set();

  const base = ROLE_PERMISSIONS[user.role] ?? [];
  if ((base as readonly string[]).includes(WILDCARD_PERMISSION)) {
    return new Set([WILDCARD_PERMISSION]);
  }

  const set = new Set<string>(base as readonly string[]);
  for (const p of user.extraPermissions ?? []) set.add(p);
  for (const p of user.revokedPermissions ?? []) set.delete(p);
  return set;
}

export function hasPermission(
  user: Pick<RbacUser, 'role' | 'extraPermissions' | 'revokedPermissions'> | null | undefined,
  permission: Permission,
): boolean {
  if (!user) return false;
  const perms = getEffectivePermissions(user);
  return perms.has(WILDCARD_PERMISSION) || perms.has(permission);
}

export function hasAnyPermission(
  user: Pick<RbacUser, 'role' | 'extraPermissions' | 'revokedPermissions'> | null | undefined,
  permissions: readonly Permission[],
): boolean {
  if (!user) return false;
  const perms = getEffectivePermissions(user);
  if (perms.has(WILDCARD_PERMISSION)) return true;
  return permissions.some((p) => perms.has(p));
}

export function hasAllPermissions(
  user: Pick<RbacUser, 'role' | 'extraPermissions' | 'revokedPermissions'> | null | undefined,
  permissions: readonly Permission[],
): boolean {
  if (!user) return false;
  const perms = getEffectivePermissions(user);
  if (perms.has(WILDCARD_PERMISSION)) return true;
  return permissions.every((p) => perms.has(p));
}

// ─── Record-scoped access ───────────────────────────────────
/**
 * Can this user see a specific client?
 *  - Firm-wide roles (super_admin/owner/admin) + read-only/compliance: yes.
 *  - Advisors: only if an assignment ties them to the client/household.
 *  - Clients/household members: only their own client/household record.
 */
export function canAccessClient(
  user: RbacUser | null | undefined,
  target: { clientId?: string | null; householdId?: string | null },
  assignments: readonly ClientAssignment[] = [],
): boolean {
  if (!user) return false;
  if (isFirmWide(user) || hasAnyRole(user, [ROLES.READ_ONLY, ROLES.COMPLIANCE_REVIEWER])) {
    return true;
  }

  if (isAdvisor(user)) {
    return assignments.some(
      (a) =>
        a.staffId === user.id &&
        ((target.clientId && a.clientId === target.clientId) ||
          (target.householdId && a.householdId === target.householdId)),
    );
  }

  // External client-type users: own records only.
  if (hasAnyRole(user, [ROLES.CLIENT, ROLES.HOUSEHOLD_MEMBER, ROLES.PROSPECT])) {
    if (target.clientId && user.clientId && target.clientId === user.clientId) return true;
    if (target.householdId && user.householdId && target.householdId === user.householdId) {
      return true;
    }
  }

  return false;
}

export function canAccessHousehold(
  user: RbacUser | null | undefined,
  householdId: string,
  assignments: readonly ClientAssignment[] = [],
): boolean {
  return canAccessClient(user, { householdId }, assignments);
}

/**
 * Can `actor` manage `target` (edit role/status, suspend, archive)?
 * Requires user-management permission AND a strictly higher management
 * rank than the target, so an admin can't edit a super_admin, etc.
 * A user can never manage themselves through this path.
 */
export function canManageUser(
  actor: Pick<RbacUser, 'id' | 'role' | 'extraPermissions' | 'revokedPermissions'> | null | undefined,
  target: Pick<RbacUser, 'id' | 'role'> | null | undefined,
): boolean {
  if (!actor || !target) return false;
  if (actor.id === target.id) return false;
  if (!hasPermission(actor, 'users.edit' as Permission)) return false;
  return ROLE_RANK[actor.role] > ROLE_RANK[target.role];
}

export function canUseAIAgent(user: RbacUser | null | undefined): boolean {
  return hasPermission(user, 'ai.use' as Permission);
}
