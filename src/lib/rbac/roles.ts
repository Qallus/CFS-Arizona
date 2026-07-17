/**
 * SIG360 role constants.
 *
 * Stable, lowercase role values shared by the app and the database.
 * These MUST stay in sync with the `sig_user_role` enum in
 * supabase/migrations/20260707000001_rbac_foundation.sql.
 *
 * Source of truth: Docs/features/SIG360-user-management-roles-permissions.md
 */

export const ROLES = {
  // ── Internal ─────────────────────────────────────────────
  SUPER_ADMIN: 'super_admin',
  OWNER_LEADERSHIP: 'owner_leadership',
  ADMIN: 'admin',
  FINANCIAL_PLANNER: 'financial_planner',
  WRITING_ADVISOR: 'writing_advisor',
  SERVICING_ADVISOR: 'servicing_advisor',
  PLANNER_ADMINISTRATOR: 'planner_administrator',
  CLIENT_SERVICE_ASSOCIATE: 'client_service_associate',
  MARKETING_MANAGER: 'marketing_manager',
  EVENT_COORDINATOR: 'event_coordinator',
  COMPLIANCE_REVIEWER: 'compliance_reviewer',
  SUPPORT_OPERATIONS: 'support_operations',
  READ_ONLY: 'read_only',
  // ── External ─────────────────────────────────────────────
  CLIENT: 'client',
  HOUSEHOLD_MEMBER: 'household_member',
  PROSPECT: 'prospect',
  REFERRAL_PARTNER: 'referral_partner',
  PROFESSIONAL_PARTNER: 'professional_partner',
  INVESTMENT_COMMITTEE: 'investment_committee',
  VENDOR_PARTNER: 'vendor_partner',
  EVENT_GUEST: 'event_guest',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const INTERNAL_ROLES: readonly Role[] = [
  ROLES.SUPER_ADMIN,
  ROLES.OWNER_LEADERSHIP,
  ROLES.ADMIN,
  ROLES.FINANCIAL_PLANNER,
  ROLES.WRITING_ADVISOR,
  ROLES.SERVICING_ADVISOR,
  ROLES.PLANNER_ADMINISTRATOR,
  ROLES.CLIENT_SERVICE_ASSOCIATE,
  ROLES.MARKETING_MANAGER,
  ROLES.EVENT_COORDINATOR,
  ROLES.COMPLIANCE_REVIEWER,
  ROLES.SUPPORT_OPERATIONS,
  ROLES.READ_ONLY,
] as const;

export const EXTERNAL_ROLES: readonly Role[] = [
  ROLES.CLIENT,
  ROLES.HOUSEHOLD_MEMBER,
  ROLES.PROSPECT,
  ROLES.REFERRAL_PARTNER,
  ROLES.PROFESSIONAL_PARTNER,
  ROLES.INVESTMENT_COMMITTEE,
  ROLES.VENDOR_PARTNER,
  ROLES.EVENT_GUEST,
] as const;

export const ALL_ROLES: readonly Role[] = [...INTERNAL_ROLES, ...EXTERNAL_ROLES];

/** Advisor-class internal roles whose client access is assignment-scoped. */
export const ADVISOR_ROLES: readonly Role[] = [
  ROLES.FINANCIAL_PLANNER,
  ROLES.WRITING_ADVISOR,
  ROLES.SERVICING_ADVISOR,
  ROLES.PLANNER_ADMINISTRATOR,
  ROLES.CLIENT_SERVICE_ASSOCIATE,
] as const;

/** Admin-class roles that can see/manage firm-wide records by default. */
export const FIRM_WIDE_ROLES: readonly Role[] = [
  ROLES.SUPER_ADMIN,
  ROLES.OWNER_LEADERSHIP,
  ROLES.ADMIN,
] as const;

/**
 * Management rank. Higher rank can manage lower-ranked users.
 * Used by canManageUser(). External roles get rank 0 (cannot manage anyone).
 */
export const ROLE_RANK: Record<Role, number> = {
  [ROLES.SUPER_ADMIN]: 100,
  [ROLES.OWNER_LEADERSHIP]: 90,
  [ROLES.ADMIN]: 80,
  [ROLES.COMPLIANCE_REVIEWER]: 60,
  [ROLES.MARKETING_MANAGER]: 50,
  [ROLES.EVENT_COORDINATOR]: 50,
  [ROLES.FINANCIAL_PLANNER]: 50,
  [ROLES.WRITING_ADVISOR]: 45,
  [ROLES.SERVICING_ADVISOR]: 40,
  [ROLES.PLANNER_ADMINISTRATOR]: 35,
  [ROLES.CLIENT_SERVICE_ASSOCIATE]: 30,
  [ROLES.SUPPORT_OPERATIONS]: 20,
  [ROLES.READ_ONLY]: 10,
  [ROLES.CLIENT]: 0,
  [ROLES.HOUSEHOLD_MEMBER]: 0,
  [ROLES.PROSPECT]: 0,
  [ROLES.REFERRAL_PARTNER]: 0,
  [ROLES.PROFESSIONAL_PARTNER]: 0,
  [ROLES.INVESTMENT_COMMITTEE]: 0,
  [ROLES.VENDOR_PARTNER]: 0,
  [ROLES.EVENT_GUEST]: 0,
};

export function isRole(value: unknown): value is Role {
  return typeof value === 'string' && (ALL_ROLES as readonly string[]).includes(value);
}
