/**
 * SIG360 permission constants.
 *
 * Fine-grained capabilities grouped by category. Permissions are the
 * unit that routes, API handlers, and UI check against — never the raw
 * role. This keeps access rules stable as roles are added/tuned.
 *
 * Naming: `<category>.<action>`. `view_all` vs `view_assigned` are
 * distinct permissions so assignment-scoped roles can be expressed.
 *
 * Source of truth: Docs/features/SIG360-user-management-roles-permissions.md
 *                  (# Permission Categories)
 */

export const PERMISSIONS = {
  // ── User Management ──────────────────────────────────────
  USERS_VIEW: 'users.view',
  USERS_INVITE: 'users.invite',
  USERS_ADD: 'users.add',
  USERS_EDIT: 'users.edit',
  USERS_SUSPEND: 'users.suspend',
  USERS_ARCHIVE: 'users.archive',
  USERS_DELETE: 'users.delete',
  USERS_ASSIGN_ROLES: 'users.assign_roles',
  USERS_RESET_INVITE: 'users.reset_invite',
  USERS_VIEW_ACTIVITY: 'users.view_activity',

  // ── Client Management ────────────────────────────────────
  CLIENTS_VIEW_ALL: 'clients.view_all',
  CLIENTS_VIEW_ASSIGNED: 'clients.view_assigned',
  CLIENTS_CREATE: 'clients.create',
  CLIENTS_EDIT: 'clients.edit',
  CLIENTS_ARCHIVE: 'clients.archive',
  CLIENTS_ASSIGN_ADVISORS: 'clients.assign_advisors',
  CLIENTS_VIEW_DOCUMENTS: 'clients.view_documents',
  CLIENTS_VIEW_NOTES: 'clients.view_notes',
  CLIENTS_VIEW_SERVICE_HISTORY: 'clients.view_service_history',

  // ── Household Management ─────────────────────────────────
  HOUSEHOLDS_VIEW_ALL: 'households.view_all',
  HOUSEHOLDS_VIEW_ASSIGNED: 'households.view_assigned',
  HOUSEHOLDS_CREATE: 'households.create',
  HOUSEHOLDS_EDIT: 'households.edit',
  HOUSEHOLDS_ASSIGN_MEMBERS: 'households.assign_members',
  HOUSEHOLDS_ARCHIVE: 'households.archive',

  // ── Contacts / Leads / Prospects ─────────────────────────
  CONTACTS_VIEW: 'contacts.view',
  CONTACTS_CREATE: 'contacts.create',
  LEADS_VIEW: 'leads.view',
  LEADS_CREATE: 'leads.create',
  LEADS_ASSIGN: 'leads.assign',
  LEADS_CONVERT: 'leads.convert',
  PROSPECTS_VIEW: 'prospects.view',
  PROSPECTS_CREATE: 'prospects.create',
  PROSPECTS_ASSIGN: 'prospects.assign',
  PROSPECTS_CONVERT: 'prospects.convert',

  // ── Planner / Advisor Workflow ───────────────────────────
  PLANNER_VIEW_DASHBOARD: 'planner.view_dashboard',
  TASKS_VIEW: 'tasks.view',
  TASKS_CREATE: 'tasks.create',
  TASKS_ASSIGN: 'tasks.assign',
  TASKS_COMPLETE: 'tasks.complete',
  NOTES_VIEW_ADVISOR: 'notes.view_advisor',
  NOTES_VIEW_SERVICE: 'notes.view_service',
  WORKFLOWS_VIEW: 'workflows.view',
  WORKFLOWS_UPDATE: 'workflows.update',

  // ── Appointments & Meetings ──────────────────────────────
  APPOINTMENTS_VIEW: 'appointments.view',
  APPOINTMENTS_CREATE: 'appointments.create',
  APPOINTMENTS_EDIT: 'appointments.edit',
  APPOINTMENTS_CANCEL: 'appointments.cancel',
  CALENDARS_VIEW_ALL: 'calendars.view_all',
  CALENDARS_VIEW_ASSIGNED: 'calendars.view_assigned',
  MEETINGS_VIEW_NOTES: 'meetings.view_notes',
  MEETINGS_CREATE_NOTES: 'meetings.create_notes',
  MEETINGS_EDIT_NOTES: 'meetings.edit_notes',

  // ── Events ───────────────────────────────────────────────
  EVENTS_VIEW: 'events.view',
  EVENTS_CREATE: 'events.create',
  EVENTS_EDIT: 'events.edit',
  EVENTS_MANAGE_REGISTRATIONS: 'events.manage_registrations',
  EVENTS_VIEW_ATTENDEES: 'events.view_attendees',
  EVENTS_CHECKIN: 'events.checkin',
  EVENTS_SEND_REMINDERS: 'events.send_reminders',
  EVENTS_EXPORT_ATTENDEES: 'events.export_attendees',
  EVENTS_REGISTER: 'events.register',

  // ── Marketing ────────────────────────────────────────────
  MARKETING_VIEW_CAMPAIGNS: 'marketing.view_campaigns',
  MARKETING_CREATE_CAMPAIGNS: 'marketing.create_campaigns',
  MARKETING_EDIT_CAMPAIGNS: 'marketing.edit_campaigns',
  MARKETING_APPROVE_CAMPAIGNS: 'marketing.approve_campaigns',
  MARKETING_SEND_CAMPAIGNS: 'marketing.send_campaigns',
  MARKETING_VIEW_LISTS: 'marketing.view_lists',
  MARKETING_MANAGE_SEGMENTS: 'marketing.manage_segments',
  MARKETING_MANAGE_TEMPLATES: 'marketing.manage_templates',
  MARKETING_VIEW_REPORTS: 'marketing.view_reports',

  // ── Documents ────────────────────────────────────────────
  DOCUMENTS_VIEW: 'documents.view',
  DOCUMENTS_UPLOAD: 'documents.upload',
  DOCUMENTS_DELETE: 'documents.delete',
  DOCUMENTS_SHARE: 'documents.share',
  DOCUMENTS_REQUEST: 'documents.request',
  DOCUMENTS_VIEW_CLIENT_UPLOADS: 'documents.view_client_uploads',

  // ── Communications ───────────────────────────────────────
  COMMS_VIEW: 'comms.view',
  COMMS_SEND_APPROVED: 'comms.send_approved',
  COMMS_DRAFT: 'comms.draft',
  COMMS_APPROVE: 'comms.approve',
  COMMS_VIEW_HISTORY: 'comms.view_history',
  COMMS_MANAGE_TEMPLATES: 'comms.manage_templates',

  // ── AI Agent ─────────────────────────────────────────────
  AI_USE: 'ai.use',
  AI_VIEW_SUMMARIES: 'ai.view_summaries',
  AI_CREATE_DRAFTS: 'ai.create_drafts',
  AI_APPROVE_DRAFTS: 'ai.approve_drafts',
  AI_SEND_MESSAGES: 'ai.send_messages',
  AI_MANAGE_SETTINGS: 'ai.manage_settings',
  AI_VIEW_AUDIT_LOGS: 'ai.view_audit_logs',
  AI_RUN_LEAD_GEN: 'ai.run_lead_gen',

  // ── Reports ──────────────────────────────────────────────
  REPORTS_VIEW: 'reports.view',
  REPORTS_EXPORT: 'reports.export',
  REPORTS_VIEW_FIRM_ANALYTICS: 'reports.view_firm_analytics',
  REPORTS_VIEW_ASSIGNED_ANALYTICS: 'reports.view_assigned_analytics',
  REPORTS_VIEW_CAMPAIGN: 'reports.view_campaign',
  REPORTS_VIEW_EVENT: 'reports.view_event',

  // ── Settings ─────────────────────────────────────────────
  SETTINGS_VIEW: 'settings.view',
  SETTINGS_EDIT: 'settings.edit',
  SETTINGS_MANAGE_INTEGRATIONS: 'settings.manage_integrations',
  SETTINGS_MANAGE_AUTOMATIONS: 'settings.manage_automations',
  SETTINGS_MANAGE_BILLING: 'settings.manage_billing',
  SETTINGS_MANAGE_COMPLIANCE: 'settings.manage_compliance',

  // ── Compliance / Audit ───────────────────────────────────
  AUDIT_VIEW: 'audit.view',
  AUDIT_EXPORT: 'audit.export',
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

/** Wildcard granted to super_admin — matches every permission. */
export const WILDCARD_PERMISSION = '*' as const;

export const ALL_PERMISSIONS: readonly Permission[] = Object.values(PERMISSIONS);

export function isPermission(value: unknown): value is Permission {
  return typeof value === 'string' && (ALL_PERMISSIONS as readonly string[]).includes(value);
}
