/**
 * Audit logging helper.
 *
 * Writes to sig_audit_logs. Fire-and-forget friendly (never throws) so a
 * logging failure can't break the action it's recording — but callers may
 * await it when they need the write confirmed.
 *
 * Log at minimum: invites, invite acceptance, role changes, status changes,
 * suspensions, archives, deletes, photo changes, permission changes, and
 * client/household/planner/servicing-advisor assignment changes
 * (see the RBAC spec, "Audit Logging Requirements").
 */
import { supabaseAdmin } from '@/lib/supabase';

export interface AuditEntry {
  actorUserId?: string | null;
  targetUserId?: string | null;
  action: string;
  entityType?: string | null;
  entityId?: string | null;
  oldValue?: unknown;
  newValue?: unknown;
  metadata?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

/** Common audit action names — use these for consistency. */
export const AUDIT_ACTIONS = {
  USER_INVITED: 'user.invited',
  USER_INVITE_ACCEPTED: 'user.invite_accepted',
  USER_ROLE_CHANGED: 'user.role_changed',
  USER_STATUS_CHANGED: 'user.status_changed',
  USER_SUSPENDED: 'user.suspended',
  USER_ARCHIVED: 'user.archived',
  USER_DELETED: 'user.deleted',
  USER_PHOTO_CHANGED: 'user.photo_changed',
  USER_PERMISSIONS_CHANGED: 'user.permissions_changed',
  CLIENT_ASSIGNMENT_CHANGED: 'assignment.client_changed',
  HOUSEHOLD_ASSIGNMENT_CHANGED: 'assignment.household_changed',
  PLANNER_ASSIGNMENT_CHANGED: 'assignment.planner_changed',
  SERVICING_ADVISOR_ASSIGNMENT_CHANGED: 'assignment.servicing_advisor_changed',
  AI_AGENT_ACTION: 'ai.action',
  COMMUNICATION_APPROVED: 'communication.approved',
  DOCUMENT_UPLOADED: 'document.uploaded',
} as const;

export async function writeAuditLog(entry: AuditEntry): Promise<void> {
  try {
    await supabaseAdmin.from('sig_audit_logs').insert({
      actor_user_id: entry.actorUserId ?? null,
      target_user_id: entry.targetUserId ?? null,
      action: entry.action,
      entity_type: entry.entityType ?? null,
      entity_id: entry.entityId ?? null,
      old_value: entry.oldValue ?? null,
      new_value: entry.newValue ?? null,
      metadata_json: entry.metadata ?? null,
      ip_address: entry.ipAddress ?? null,
      user_agent: entry.userAgent ?? null,
    });
  } catch {
    // Swallow: audit logging must never break the underlying action.
    // (Surfaces via Supabase logs; wire structured error reporting later.)
  }
}
