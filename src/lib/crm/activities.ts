/**
 * Read-only notes + appointments for a contact (sig_notes / sig_appointments).
 * Callers must first verify the contact is accessible to the user.
 *
 * server-only.
 */
import { supabaseAdmin } from '@/lib/supabase';
import { raisePg, type PgError } from './access';

type Row = Record<string, unknown>;

export interface NoteRow {
  id: string;
  body: string | null;
  category: string | null;
  noteType: string | null;
  author: string | null;
  createdAt: string | null;
}

export interface AppointmentRow {
  id: string;
  title: string | null;
  description: string | null;
  location: string | null;
  startAt: string | null;
  endAt: string | null;
  allDay: boolean;
  status: string | null;
  activityType: string | null;
  assignedTo: string | null;
}

export async function getContactNotes(contactId: string, limit = 50): Promise<NoteRow[]> {
  const { data, error } = await supabaseAdmin
    .from('sig_notes')
    .select('id, body, category, note_type, author, redtail_created_at, created_at')
    .eq('contact_id', contactId)
    .order('redtail_created_at', { ascending: false, nullsFirst: false })
    .limit(limit);
  if (error) raisePg(error as PgError);
  return ((data ?? []) as Row[]).map((r) => ({
    id: String(r.id),
    body: (r.body as string) ?? null,
    category: (r.category as string) ?? null,
    noteType: (r.note_type as string) ?? null,
    author: (r.author as string) ?? null,
    createdAt: (r.redtail_created_at as string) ?? (r.created_at as string) ?? null,
  }));
}

export async function getContactAppointments(contactId: string, limit = 50): Promise<AppointmentRow[]> {
  const { data, error } = await supabaseAdmin
    .from('sig_appointments')
    .select('id, title, description, location, start_at, end_at, all_day, status, activity_type, assigned_to')
    .eq('contact_id', contactId)
    .order('start_at', { ascending: false, nullsFirst: false })
    .limit(limit);
  if (error) raisePg(error as PgError);
  return ((data ?? []) as Row[]).map((r) => ({
    id: String(r.id),
    title: (r.title as string) ?? null,
    description: (r.description as string) ?? null,
    location: (r.location as string) ?? null,
    startAt: (r.start_at as string) ?? null,
    endAt: (r.end_at as string) ?? null,
    allDay: Boolean(r.all_day),
    status: (r.status as string) ?? null,
    activityType: (r.activity_type as string) ?? null,
    assignedTo: (r.assigned_to as string) ?? null,
  }));
}

// ─── Unified activity log (sig_activities) ──────────────────
// A single logged action (call/email/sms/meeting/reminder/mail/note),
// attached to a contact and optionally an opportunity.

export type ActivityType = 'call' | 'email' | 'sms' | 'meeting' | 'reminder' | 'mail' | 'note';

export interface ActivityRow {
  id: string;
  contactId: string;
  opportunityId: string | null;
  type: ActivityType;
  direction: string | null;
  subject: string | null;
  body: string | null;
  occurredAt: string | null;
  billableMinutes: number;
  createdBy: string | null;
  createdAt: string | null;
}

function mapActivity(r: Row): ActivityRow {
  return {
    id: String(r.id),
    contactId: String(r.contact_id),
    opportunityId: (r.opportunity_id as string) ?? null,
    type: (r.type as ActivityType) ?? 'note',
    direction: (r.direction as string) ?? null,
    subject: (r.subject as string) ?? null,
    body: (r.body as string) ?? null,
    occurredAt: (r.occurred_at as string) ?? null,
    billableMinutes: Number(r.billable_minutes ?? 0),
    createdBy: (r.created_by as string) ?? null,
    createdAt: (r.created_at as string) ?? null,
  };
}

const ACTIVITY_COLS =
  'id, contact_id, opportunity_id, type, direction, subject, body, occurred_at, billable_minutes, created_by, created_at';

export async function getContactActivities(contactId: string, limit = 100): Promise<ActivityRow[]> {
  const { data, error } = await supabaseAdmin
    .from('sig_activities')
    .select(ACTIVITY_COLS)
    .eq('contact_id', contactId)
    .order('occurred_at', { ascending: false, nullsFirst: false })
    .limit(limit);
  if (error) raisePg(error as PgError);
  return ((data ?? []) as Row[]).map(mapActivity);
}

export interface LogActivityInput {
  contactId: string;
  opportunityId?: string | null;
  type: ActivityType;
  direction?: string | null;
  subject?: string | null;
  body?: string | null;
  occurredAt?: string | null;
  billableMinutes?: number;
  createdBy?: string | null;
}

export async function logActivity(input: LogActivityInput): Promise<ActivityRow> {
  const insert = {
    contact_id: input.contactId,
    opportunity_id: input.opportunityId ?? null,
    type: input.type,
    direction: input.direction ?? null,
    subject: input.subject?.trim() || null,
    body: input.body?.trim() || null,
    occurred_at: input.occurredAt || new Date().toISOString(),
    billable_minutes: Math.max(0, Math.round(input.billableMinutes ?? 0)),
    created_by: input.createdBy ?? null,
  };
  const { data, error } = await supabaseAdmin.from('sig_activities').insert(insert).select(ACTIVITY_COLS).single();
  if (error) raisePg(error as PgError);
  return mapActivity(data as Row);
}
