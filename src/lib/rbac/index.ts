/**
 * SIG360 RBAC — public surface (safe for both server and client).
 *
 *   import { ROLES, PERMISSIONS, hasPermission, ROLE_LABELS } from '@/lib/rbac';
 *
 * This barrel intentionally exports ONLY pure constants + helpers, so it is
 * safe to import from Client Components.
 *
 * Server-only helpers (they touch cookies / the service-role Supabase client)
 * must be imported from their explicit paths so they never leak into a client
 * bundle:
 *
 *   import { getCurrentRbacUser } from '@/lib/rbac/current-user';
 *   import { guardPermission, assertPermission } from '@/lib/rbac/route-guards';
 *   import { writeAuditLog, AUDIT_ACTIONS } from '@/lib/rbac/audit';
 */
export * from './roles';
export * from './role-labels';
export * from './user-statuses';
export * from './permissions';
export * from './role-permissions';
export * from './access-control';
export * from './types';
