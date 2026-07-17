/**
 * Human-readable labels + short descriptions for each role.
 * Mirrors the suggested labels in the RBAC spec.
 */
import { ROLES, type Role } from './roles';

export const ROLE_LABELS: Record<Role, string> = {
  [ROLES.SUPER_ADMIN]: 'Super Admin',
  [ROLES.OWNER_LEADERSHIP]: 'Owner / Leadership',
  [ROLES.ADMIN]: 'Admin',
  [ROLES.FINANCIAL_PLANNER]: 'Financial Planner',
  [ROLES.WRITING_ADVISOR]: 'Writing Advisor',
  [ROLES.SERVICING_ADVISOR]: 'Servicing Advisor',
  [ROLES.PLANNER_ADMINISTRATOR]: 'Planner Administrator',
  [ROLES.CLIENT_SERVICE_ASSOCIATE]: 'Client Service Associate',
  [ROLES.MARKETING_MANAGER]: 'Marketing Manager',
  [ROLES.EVENT_COORDINATOR]: 'Event Coordinator',
  [ROLES.COMPLIANCE_REVIEWER]: 'Compliance Reviewer',
  [ROLES.SUPPORT_OPERATIONS]: 'Support / Operations',
  [ROLES.READ_ONLY]: 'Read-Only / Auditor',
  [ROLES.CLIENT]: 'Client',
  [ROLES.HOUSEHOLD_MEMBER]: 'Household Member',
  [ROLES.PROSPECT]: 'Prospect',
  [ROLES.REFERRAL_PARTNER]: 'Referral Partner',
  [ROLES.PROFESSIONAL_PARTNER]: 'Professional Partner',
  [ROLES.INVESTMENT_COMMITTEE]: 'Investment Committee',
  [ROLES.VENDOR_PARTNER]: 'Vendor / Partner',
  [ROLES.EVENT_GUEST]: 'Event Guest',
};

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  [ROLES.SUPER_ADMIN]: 'Full control over SIG360, including users, roles, settings, and audit logs.',
  [ROLES.OWNER_LEADERSHIP]: 'Firm-wide visibility and reporting without system-level administration.',
  [ROLES.ADMIN]: 'Manages day-to-day operations: users (limited), clients, appointments, events, documents.',
  [ROLES.FINANCIAL_PLANNER]: 'Advisor over assigned clients, households, meetings, and planning workflows.',
  [ROLES.WRITING_ADVISOR]: 'Owns assigned planning notes, meeting notes, and client recommendations.',
  [ROLES.SERVICING_ADVISOR]: 'Handles ongoing service, follow-ups, and paperwork for assigned clients.',
  [ROLES.PLANNER_ADMINISTRATOR]: 'Supports planners with scheduling, paperwork, and client coordination.',
  [ROLES.CLIENT_SERVICE_ASSOCIATE]: 'Supports scheduling, service tasks, documents, and reminders.',
  [ROLES.MARKETING_MANAGER]: 'Manages campaigns, segments, templates, landing pages, and reporting.',
  [ROLES.EVENT_COORDINATOR]: 'Manages events, RSVPs, check-ins, and post-event follow-up.',
  [ROLES.COMPLIANCE_REVIEWER]: 'Reviews communications, AI notes, approvals, and audit logs.',
  [ROLES.SUPPORT_OPERATIONS]: 'General operational support: assigned tasks, workflows, and data cleanup.',
  [ROLES.READ_ONLY]: 'Read-only visibility for compliance, leadership, or trusted reviewers.',
  [ROLES.CLIENT]: 'External client with access to their own secure portal.',
  [ROLES.HOUSEHOLD_MEMBER]: 'Household member with access to approved household-level information.',
  [ROLES.PROSPECT]: 'Qualified potential client with limited onboarding portal access.',
  [ROLES.REFERRAL_PARTNER]: 'External partner who can submit referrals and request meetings.',
  [ROLES.PROFESSIONAL_PARTNER]: 'CPA, attorney, or other professional collaborator with limited access.',
  [ROLES.INVESTMENT_COMMITTEE]: 'Outside firm submitting investment materials through a restricted portal.',
  [ROLES.VENDOR_PARTNER]: 'Vendor with access limited to the specific area they support.',
  [ROLES.EVENT_GUEST]: 'Event attendee with registration and RSVP access only.',
};

export function roleLabel(role: Role): string {
  return ROLE_LABELS[role] ?? role;
}
