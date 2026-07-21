/**
 * Follow-ups: the "what next, when, and who owes it" record.
 *
 * The activity timeline (sig_activities) records what already happened.
 * This records what has NOT happened yet, which is the half that stops
 * prospects going quiet without anyone noticing.
 *
 * Recurring follow-ups are re-created on completion rather than pre-scheduled.
 * A monthly check-in that nobody actions for a quarter should surface as one
 * overdue item, not three identical ones.
 *
 * server-only.
 */
import { supabaseAdmin } from '@/lib/supabase';
import type { RbacUser } from '@/lib/rbac';
import { raisePg, CrmValidationError, type PgError } from '@/lib/crm/access';

const TABLE = 'sig_follow_ups';
const COLS =
  'id, contact_id, referral_id, due_at, contact_method, subject, notes, assigned_to, ' +
  'remind_channel, remind_before_minutes, frequency, status, completed_at, reminded_at, ' +
  'created_by, created_at, updated_at';
const CONTACT_EMBED = 'contact:sig_contacts ( id, full_name, email, mobile_phone )';

export const CONTACT_METHODS = [
  'phone',
  'email',
  'sms',
  'meeting_in_person',
  'meeting_video',
  'mail',
  'task',
] as const;
export type ContactMethod = (typeof CONTACT_METHODS)[number];

export const REMIND_CHANNELS = ['none', 'email', 'sms', 'both'] as const;
export const FREQUENCIES = ['once', 'daily', 'weekly', 'biweekly', 'monthly', 'quarterly'] as const;
export const FOLLOW_UP_STATUSES = ['open', 'done', 'snoozed', 'cancelled'] as const;

interface Row {
  id: string;
  contact_id: string | null;
  referral_id: string | null;
  due_at: string;
  contact_method: string;
  subject: string | null;
  notes: string | null;
  assigned_to: string | null;
  remind_channel: string;
  remind_before_minutes: number;
  frequency: string;
  status: string;
  completed_at: string | null;
  reminded_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  contact?: { id: string; full_name: string; email: string | null; mobile_phone: string | null } | null;
}

export interface FollowUpRecord {
  id: string;
  contactId: string | null;
  referralId: string | null;
  contactName: string | null;
  dueAt: string;
  contactMethod: string;
  subject: string | null;
  notes: string | null;
  assignedTo: string | null;
  remindChannel: string;
  remindBeforeMinutes: number;
  frequency: string;
  status: string;
  completedAt: string | null;
  remindedAt: string | null;
  createdAt: string;
}

function mapRow(r: Row): FollowUpRecord {
  return {
    id: r.id,
    contactId: r.contact_id,
    referralId: r.referral_id,
    contactName: r.contact?.full_name ?? null,
    dueAt: r.due_at,
    contactMethod: r.contact_method,
    subject: r.subject,
    notes: r.notes,
    assignedTo: r.assigned_to,
    remindChannel: r.remind_channel,
    remindBeforeMinutes: r.remind_before_minutes,
    frequency: r.frequency,
    status: r.status,
    completedAt: r.completed_at,
    remindedAt: r.reminded_at,
    createdAt: r.created_at,
  };
}

export interface ListFollowUpsOptions {
  contactId?: string;
  referralId?: string;
  /** Only items assigned to the caller. */
  mine?: boolean;
  status?: string;
  /** Open items due on or before now — the "what's overdue" query. */
  dueOnly?: boolean;
  limit?: number;
}

export async function listFollowUps(
  user: RbacUser,
  opts: ListFollowUpsOptions = {},
): Promise<FollowUpRecord[]> {
  let q = supabaseAdmin.from(TABLE).select(`${COLS}, ${CONTACT_EMBED}`);
  if (opts.contactId) q = q.eq('contact_id', opts.contactId);
  if (opts.referralId) q = q.eq('referral_id', opts.referralId);
  if (opts.mine) q = q.eq('assigned_to', user.id);
  if (opts.status) q = q.eq('status', opts.status);
  if (opts.dueOnly) q = q.eq('status', 'open').lte('due_at', new Date().toISOString());
  q = q.order('due_at', { ascending: true }).limit(opts.limit ?? 200);

  const { data, error } = await q;
  if (error) raisePg(error as PgError);
  return (data as unknown as Row[]).map(mapRow);
}

export interface FollowUpInput {
  contactId?: string | null;
  referralId?: string | null;
  dueAt?: string;
  contactMethod?: string;
  subject?: string;
  notes?: string;
  assignedTo?: string | null;
  remindChannel?: string;
  remindBeforeMinutes?: number;
  frequency?: string;
  status?: string;
}

function oneOfOrThrow(list: readonly string[], value: string | undefined, label: string) {
  if (value !== undefined && !list.includes(value)) {
    throw new CrmValidationError(`Unknown ${label}: ${value}`);
  }
}

function validate(input: FollowUpInput, { partial }: { partial: boolean }) {
  if (!partial) {
    if (!input.dueAt) throw new CrmValidationError('A due date is required.');
    if (!input.contactId && !input.referralId) {
      throw new CrmValidationError('A follow-up must belong to a contact or a referral.');
    }
  }
  oneOfOrThrow(CONTACT_METHODS, input.contactMethod, 'contact method');
  oneOfOrThrow(REMIND_CHANNELS, input.remindChannel, 'reminder channel');
  oneOfOrThrow(FREQUENCIES, input.frequency, 'frequency');
  oneOfOrThrow(FOLLOW_UP_STATUSES, input.status, 'status');
  if (
    input.remindBeforeMinutes !== undefined &&
    (!Number.isInteger(input.remindBeforeMinutes) || input.remindBeforeMinutes < 0)
  ) {
    throw new CrmValidationError('Reminder lead time must be a whole number of minutes.');
  }
}

function toColumns(input: FollowUpInput): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const set = (k: string, v: unknown) => {
    if (v !== undefined) out[k] = v === '' ? null : v;
  };
  set('contact_id', input.contactId);
  set('referral_id', input.referralId);
  set('due_at', input.dueAt);
  set('contact_method', input.contactMethod);
  set('subject', input.subject);
  set('notes', input.notes);
  set('assigned_to', input.assignedTo);
  set('remind_channel', input.remindChannel);
  set('remind_before_minutes', input.remindBeforeMinutes);
  set('frequency', input.frequency);
  set('status', input.status);
  return out;
}

export async function createFollowUp(
  user: RbacUser,
  input: FollowUpInput,
): Promise<FollowUpRecord> {
  validate(input, { partial: false });
  const { data, error } = await supabaseAdmin
    .from(TABLE)
    .insert({
      ...toColumns(input),
      // Unassigned work is work nobody does; default it to whoever created it.
      assigned_to: input.assignedTo ?? user.id,
      created_by: user.id,
    })
    .select(`${COLS}, ${CONTACT_EMBED}`)
    .single();
  if (error) raisePg(error as PgError);
  return mapRow(data as unknown as Row);
}

export async function updateFollowUp(
  user: RbacUser,
  id: string,
  input: FollowUpInput,
): Promise<FollowUpRecord> {
  validate(input, { partial: true });
  const patch = toColumns(input);
  if (Object.keys(patch).length === 0) throw new CrmValidationError('Nothing to update.');

  const { data, error } = await supabaseAdmin
    .from(TABLE)
    .update(patch)
    .eq('id', id)
    .select(`${COLS}, ${CONTACT_EMBED}`)
    .maybeSingle();
  if (error) raisePg(error as PgError);
  if (!data) throw new CrmValidationError('Follow-up not found.');
  return mapRow(data as unknown as Row);
}

const FREQUENCY_DAYS: Record<string, number> = {
  daily: 1,
  weekly: 7,
  biweekly: 14,
  monthly: 30,
  quarterly: 91,
};

/**
 * Complete a follow-up, and for a recurring one queue the next occurrence.
 *
 * The next due date is counted from NOW rather than from the original due
 * date. A weekly call actioned three weeks late should next come up in a
 * week, not immediately.
 */
export async function completeFollowUp(
  user: RbacUser,
  id: string,
): Promise<{ completed: FollowUpRecord; next: FollowUpRecord | null }> {
  const { data: current, error: readErr } = await supabaseAdmin
    .from(TABLE)
    .select(`${COLS}, ${CONTACT_EMBED}`)
    .eq('id', id)
    .maybeSingle();
  if (readErr) raisePg(readErr as PgError);
  if (!current) throw new CrmValidationError('Follow-up not found.');

  const row = current as unknown as Row;
  const completed = await updateFollowUp(user, id, { status: 'done' });
  await supabaseAdmin
    .from(TABLE)
    .update({ completed_at: new Date().toISOString() })
    .eq('id', id);

  const days = FREQUENCY_DAYS[row.frequency];
  if (!days) return { completed, next: null };

  const nextDue = new Date();
  nextDue.setDate(nextDue.getDate() + days);

  const next = await createFollowUp(user, {
    contactId: row.contact_id,
    referralId: row.referral_id,
    dueAt: nextDue.toISOString(),
    contactMethod: row.contact_method,
    subject: row.subject ?? undefined,
    notes: row.notes ?? undefined,
    assignedTo: row.assigned_to,
    remindChannel: row.remind_channel,
    remindBeforeMinutes: row.remind_before_minutes,
    frequency: row.frequency,
  });
  return { completed, next };
}

export async function deleteFollowUp(id: string): Promise<void> {
  const { error } = await supabaseAdmin.from(TABLE).delete().eq('id', id);
  if (error) raisePg(error as PgError);
}

/**
 * Open follow-ups whose reminder is due and has not been sent.
 *
 * Used by the dispatcher. Filters on reminded_at so a reminder goes out once
 * even if the job runs every minute.
 */
export async function dueReminders(limit = 50): Promise<FollowUpRecord[]> {
  const { data, error } = await supabaseAdmin
    .from(TABLE)
    .select(`${COLS}, ${CONTACT_EMBED}`)
    .eq('status', 'open')
    .is('reminded_at', null)
    .neq('remind_channel', 'none')
    .order('due_at', { ascending: true })
    .limit(limit);
  if (error) raisePg(error as PgError);

  const now = Date.now();
  return (data as unknown as Row[])
    .filter((r) => new Date(r.due_at).getTime() - r.remind_before_minutes * 60_000 <= now)
    .map(mapRow);
}

export async function markReminded(id: string): Promise<void> {
  await supabaseAdmin.from(TABLE).update({ reminded_at: new Date().toISOString() }).eq('id', id);
}
