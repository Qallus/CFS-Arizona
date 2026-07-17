/**
 * User account statuses. Mirrors the `sig_user_status` enum in
 * supabase/migrations/20260707000001_rbac_foundation.sql.
 *
 * For financial services, prefer `archived` over hard delete so
 * records, audit history, and communication history are preserved.
 */

export const USER_STATUSES = {
  INVITED: 'invited',
  ACTIVE: 'active',
  PENDING_SETUP: 'pending_setup',
  PENDING_REVIEW: 'pending_review',
  SUSPENDED: 'suspended',
  INACTIVE: 'inactive',
  ARCHIVED: 'archived',
  DELETED: 'deleted',
} as const;

export type UserStatus = (typeof USER_STATUSES)[keyof typeof USER_STATUSES];

export const USER_STATUS_LABELS: Record<UserStatus, string> = {
  [USER_STATUSES.INVITED]: 'Invited',
  [USER_STATUSES.ACTIVE]: 'Active',
  [USER_STATUSES.PENDING_SETUP]: 'Pending Setup',
  [USER_STATUSES.PENDING_REVIEW]: 'Pending Review',
  [USER_STATUSES.SUSPENDED]: 'Suspended',
  [USER_STATUSES.INACTIVE]: 'Inactive',
  [USER_STATUSES.ARCHIVED]: 'Archived',
  [USER_STATUSES.DELETED]: 'Deleted',
};

/** Statuses that permit an active session / dashboard access. */
export const LOGIN_ALLOWED_STATUSES: readonly UserStatus[] = [USER_STATUSES.ACTIVE];

export function canLoginWithStatus(status: UserStatus): boolean {
  return LOGIN_ALLOWED_STATUSES.includes(status);
}

export function statusLabel(status: UserStatus): string {
  return USER_STATUS_LABELS[status] ?? status;
}
