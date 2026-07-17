/**
 * Shared RBAC types. A RbacUser is the minimal shape the access-control
 * helpers need — a trimmed projection of a sig_profiles row.
 */
import type { Role } from './roles';
import type { UserStatus } from './user-statuses';

export interface RbacUser {
  id: string;
  email: string;
  role: Role;
  status: UserStatus;
  /** Permissions granted on top of the role default. */
  extraPermissions?: string[];
  /** Permissions removed from the role default. */
  revokedPermissions?: string[];
  /** Optional linkage used by portal-scoped checks. */
  clientId?: string | null;
  householdId?: string | null;
}

/** A client/household assignment row (sig_client_assignments projection). */
export interface ClientAssignment {
  staffId: string;
  clientId?: string | null;
  householdId?: string | null;
  relationship?: string;
}
