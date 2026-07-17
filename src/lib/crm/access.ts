/**
 * Shared CRM access-control + error types.
 *
 * Read scope collapses the RBAC permissions into a query filter:
 *   - view_all      → every record
 *   - view_assigned → only records assigned to the current staff member
 *   - neither       → CrmForbiddenError
 *
 * Write capability is a simple permission check.
 */
import { PERMISSIONS, hasPermission } from '@/lib/rbac';
import type { RbacUser } from '@/lib/rbac';

export class CrmForbiddenError extends Error {
  constructor(message = 'You do not have access to this resource.') {
    super(message);
    this.name = 'CrmForbiddenError';
  }
}
export class CrmValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CrmValidationError';
  }
}
export class CrmTableMissingError extends Error {
  constructor() {
    super('CRM tables are not provisioned. Apply the Redtail mirror migration.');
    this.name = 'CrmTableMissingError';
  }
}

export interface PgError {
  code?: string;
  message?: string;
}
export function isUndefinedTable(err: PgError | null): boolean {
  if (!err) return false;
  return err.code === '42P01' || /relation .* does not exist/i.test(err.message ?? '');
}
export function raisePg(err: PgError | null): never {
  if (isUndefinedTable(err)) throw new CrmTableMissingError();
  throw new Error(err?.message ?? 'Supabase query failed');
}

export type ReadScope = { mode: 'all' } | { mode: 'assigned'; staffId: string };

export function contactReadScope(user: RbacUser): ReadScope {
  if (hasPermission(user, PERMISSIONS.CLIENTS_VIEW_ALL)) return { mode: 'all' };
  if (hasPermission(user, PERMISSIONS.CLIENTS_VIEW_ASSIGNED)) return { mode: 'assigned', staffId: user.id };
  throw new CrmForbiddenError('You do not have access to clients.');
}

export function householdReadScope(user: RbacUser): ReadScope {
  if (hasPermission(user, PERMISSIONS.HOUSEHOLDS_VIEW_ALL)) return { mode: 'all' };
  if (hasPermission(user, PERMISSIONS.HOUSEHOLDS_VIEW_ASSIGNED)) return { mode: 'assigned', staffId: user.id };
  throw new CrmForbiddenError('You do not have access to households.');
}

export function assertContactCreate(user: RbacUser): void {
  if (!hasPermission(user, PERMISSIONS.CLIENTS_CREATE)) {
    throw new CrmForbiddenError('You cannot create clients.');
  }
}
export function assertContactEdit(user: RbacUser): void {
  if (!hasPermission(user, PERMISSIONS.CLIENTS_EDIT)) {
    throw new CrmForbiddenError('You cannot edit clients.');
  }
}
export function assertHouseholdCreate(user: RbacUser): void {
  if (!hasPermission(user, PERMISSIONS.HOUSEHOLDS_CREATE)) {
    throw new CrmForbiddenError('You cannot create households.');
  }
}
export function assertHouseholdEdit(user: RbacUser): void {
  if (!hasPermission(user, PERMISSIONS.HOUSEHOLDS_EDIT)) {
    throw new CrmForbiddenError('You cannot edit households.');
  }
}
export function assertContactAssign(user: RbacUser): void {
  if (!hasPermission(user, PERMISSIONS.CLIENTS_ASSIGN_ADVISORS)) {
    throw new CrmForbiddenError('You cannot assign advisors.');
  }
}

/** True for roles whose newly-created records must be self-assigned to remain visible. */
export function createsAssignedOnly(user: RbacUser): boolean {
  return !hasPermission(user, PERMISSIONS.CLIENTS_VIEW_ALL);
}
