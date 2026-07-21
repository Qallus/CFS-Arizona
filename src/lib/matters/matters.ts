/**
 * Matters data access on sig_matters.
 *
 * A Matter is one engagement CFS has been appointed to — a conservatorship,
 * guardianship, estate, trust or POA. Reads are staff-scoped the same way
 * contacts are; writes go through the service-role client after an RBAC check.
 *
 * Reuses the clients.* permissions rather than inventing a matters.* family:
 * a matter IS the client engagement, and no role grants permissions that do
 * not exist in role-permissions.ts.
 *
 * server-only.
 */
import { supabaseAdmin } from '@/lib/supabase';
import type { RbacUser } from '@/lib/rbac';
import { PERMISSIONS, hasPermission } from '@/lib/rbac';
import {
  contactReadScope,
  raisePg,
  CrmForbiddenError,
  CrmValidationError,
  type PgError,
} from '@/lib/crm/access';

const TABLE = 'sig_matters';
const COLS =
  'id, matter_ref, title, matter_type, status, contact_id, client_name, venue, ' +
  'court_case_number, opened_at, closed_at, next_deadline_at, assigned_staff_id, ' +
  'notes, archived_at, created_at, updated_at';

export const MATTER_TYPES = [
  'conservatorship',
  'guardianship',
  'estate_administration',
  'trust_administration',
  'power_of_attorney',
  'special_needs_trust',
] as const;
export type MatterType = (typeof MATTER_TYPES)[number];

export const MATTER_STATUSES = ['onboarding', 'active', 'court_supervision', 'closed'] as const;
export type MatterStatus = (typeof MATTER_STATUSES)[number];

export const MATTER_TYPE_LABELS: Record<MatterType, string> = {
  conservatorship: 'Conservatorship',
  guardianship: 'Guardianship',
  estate_administration: 'Estate administration',
  trust_administration: 'Trust administration',
  power_of_attorney: 'Power of attorney',
  special_needs_trust: 'Special needs trust',
};

export const MATTER_STATUS_LABELS: Record<MatterStatus, string> = {
  onboarding: 'Onboarding',
  active: 'Active',
  court_supervision: 'Court supervision',
  closed: 'Closed',
};

interface Row {
  id: string;
  matter_ref: string;
  title: string | null;
  matter_type: string;
  status: string;
  contact_id: string | null;
  client_name: string | null;
  venue: string | null;
  court_case_number: string | null;
  opened_at: string | null;
  closed_at: string | null;
  next_deadline_at: string | null;
  assigned_staff_id: string | null;
  notes: string | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface MatterRecord {
  id: string;
  matterRef: string;
  title: string | null;
  matterType: MatterType;
  status: MatterStatus;
  contactId: string | null;
  clientName: string | null;
  venue: string | null;
  courtCaseNumber: string | null;
  openedAt: string | null;
  closedAt: string | null;
  nextDeadlineAt: string | null;
  assignedStaffId: string | null;
  notes: string | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  /** Filled in by the API layer from sig_favorites for the current user. */
  isFavorite?: boolean;
}

function mapRow(r: Row): MatterRecord {
  return {
    id: r.id,
    matterRef: r.matter_ref,
    title: r.title,
    matterType: (MATTER_TYPES as readonly string[]).includes(r.matter_type)
      ? (r.matter_type as MatterType)
      : 'trust_administration',
    status: (MATTER_STATUSES as readonly string[]).includes(r.status)
      ? (r.status as MatterStatus)
      : 'onboarding',
    contactId: r.contact_id,
    clientName: r.client_name,
    venue: r.venue,
    courtCaseNumber: r.court_case_number,
    openedAt: r.opened_at,
    closedAt: r.closed_at,
    nextDeadlineAt: r.next_deadline_at,
    assignedStaffId: r.assigned_staff_id,
    notes: r.notes,
    archivedAt: r.archived_at,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function assertEdit(user: RbacUser): void {
  if (!hasPermission(user, PERMISSIONS.CLIENTS_EDIT)) {
    throw new CrmForbiddenError('You cannot edit matters.');
  }
}
function assertCreate(user: RbacUser): void {
  if (!hasPermission(user, PERMISSIONS.CLIENTS_CREATE)) {
    throw new CrmForbiddenError('You cannot create matters.');
  }
}
function assertArchive(user: RbacUser): void {
  if (!hasPermission(user, PERMISSIONS.CLIENTS_ARCHIVE)) {
    throw new CrmForbiddenError('You cannot archive matters.');
  }
}

export interface ListMattersOptions {
  search?: string;
  status?: string;
  matterType?: string;
  /** Archived rows are hidden unless explicitly requested. */
  includeArchived?: boolean;
  limit?: number;
  offset?: number;
}

export async function listMatters(
  user: RbacUser,
  opts: ListMattersOptions = {},
): Promise<{ matters: MatterRecord[]; total: number }> {
  const scope = contactReadScope(user);

  let q = supabaseAdmin.from(TABLE).select(COLS, { count: 'exact' });
  if (scope.mode === 'assigned') q = q.eq('assigned_staff_id', scope.staffId);
  if (!opts.includeArchived) q = q.is('archived_at', null);
  if (opts.status) q = q.eq('status', opts.status);
  if (opts.matterType) q = q.eq('matter_type', opts.matterType);
  if (opts.search) {
    const s = `%${opts.search}%`;
    q = q.or(
      `matter_ref.ilike.${s},title.ilike.${s},client_name.ilike.${s},court_case_number.ilike.${s}`,
    );
  }
  q = q
    .order('next_deadline_at', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false })
    .range(opts.offset ?? 0, (opts.offset ?? 0) + (opts.limit ?? 200) - 1);

  const { data, error, count } = await q;
  if (error) raisePg(error as PgError);
  return { matters: (data as unknown as Row[]).map(mapRow), total: count ?? 0 };
}

export async function getMatter(user: RbacUser, id: string): Promise<MatterRecord | null> {
  const scope = contactReadScope(user);
  let q = supabaseAdmin.from(TABLE).select(COLS).eq('id', id);
  if (scope.mode === 'assigned') q = q.eq('assigned_staff_id', scope.staffId);
  const { data, error } = await q.maybeSingle();
  if (error) raisePg(error as PgError);
  return data ? mapRow(data as unknown as Row) : null;
}

export interface MatterInput {
  matterRef?: string;
  title?: string;
  matterType?: string;
  status?: string;
  contactId?: string | null;
  clientName?: string;
  venue?: string;
  courtCaseNumber?: string;
  openedAt?: string | null;
  closedAt?: string | null;
  nextDeadlineAt?: string | null;
  assignedStaffId?: string | null;
  notes?: string;
}

function validate(input: MatterInput, { partial }: { partial: boolean }): void {
  if (!partial && !input.matterRef?.trim()) {
    throw new CrmValidationError('A matter reference is required.');
  }
  if (input.matterType && !(MATTER_TYPES as readonly string[]).includes(input.matterType)) {
    throw new CrmValidationError(`Unknown matter type: ${input.matterType}`);
  }
  if (input.status && !(MATTER_STATUSES as readonly string[]).includes(input.status)) {
    throw new CrmValidationError(`Unknown status: ${input.status}`);
  }
}

/** Only the fields present in `input` are written, so PATCH stays partial. */
function toColumns(input: MatterInput): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const set = (key: string, value: unknown) => {
    if (value !== undefined) out[key] = value === '' ? null : value;
  };
  set('matter_ref', input.matterRef?.trim());
  set('title', input.title);
  set('matter_type', input.matterType);
  set('status', input.status);
  set('contact_id', input.contactId);
  set('client_name', input.clientName);
  set('venue', input.venue);
  set('court_case_number', input.courtCaseNumber);
  set('opened_at', input.openedAt);
  set('closed_at', input.closedAt);
  set('next_deadline_at', input.nextDeadlineAt);
  set('assigned_staff_id', input.assignedStaffId);
  set('notes', input.notes);
  return out;
}

export async function createMatter(user: RbacUser, input: MatterInput): Promise<MatterRecord> {
  assertCreate(user);
  validate(input, { partial: false });

  const insert = {
    ...toColumns(input),
    matter_type: input.matterType ?? 'trust_administration',
    status: input.status ?? 'onboarding',
  };
  const { data, error } = await supabaseAdmin.from(TABLE).insert(insert).select(COLS).single();
  if (error) {
    // 23505 = unique violation on idx_sig_matters_ref.
    if ((error as PgError).code === '23505') {
      throw new CrmValidationError(`Matter reference "${input.matterRef}" is already in use.`);
    }
    raisePg(error as PgError);
  }
  return mapRow(data as unknown as Row);
}

export async function updateMatter(
  user: RbacUser,
  id: string,
  input: MatterInput,
): Promise<MatterRecord> {
  assertEdit(user);
  validate(input, { partial: true });

  const patch = toColumns(input);
  if (Object.keys(patch).length === 0) {
    const existing = await getMatter(user, id);
    if (!existing) throw new CrmValidationError('Matter not found.');
    return existing;
  }

  const { data, error } = await supabaseAdmin
    .from(TABLE)
    .update(patch)
    .eq('id', id)
    .select(COLS)
    .maybeSingle();
  if (error) {
    if ((error as PgError).code === '23505') {
      throw new CrmValidationError(`Matter reference "${input.matterRef}" is already in use.`);
    }
    raisePg(error as PgError);
  }
  if (!data) throw new CrmValidationError('Matter not found.');
  return mapRow(data as unknown as Row);
}

/** Archive is reversible; pass archived=false to restore. */
export async function archiveMatter(
  user: RbacUser,
  id: string,
  archived = true,
): Promise<MatterRecord> {
  assertArchive(user);
  const { data, error } = await supabaseAdmin
    .from(TABLE)
    .update({ archived_at: archived ? new Date().toISOString() : null })
    .eq('id', id)
    .select(COLS)
    .maybeSingle();
  if (error) raisePg(error as PgError);
  if (!data) throw new CrmValidationError('Matter not found.');
  return mapRow(data as unknown as Row);
}

/**
 * Permanent delete. Gated on clients.archive AND clients.edit: destroying a
 * court-supervised file is not something a partial permission set should allow.
 */
export async function deleteMatter(user: RbacUser, id: string): Promise<void> {
  assertArchive(user);
  assertEdit(user);
  const { error } = await supabaseAdmin.from(TABLE).delete().eq('id', id);
  if (error) raisePg(error as PgError);
}
