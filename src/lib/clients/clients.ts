/**
 * Clients & Wards data access on sig_clients.
 *
 * Mirrors lib/matters/matters.ts: staff-scoped reads, service-role writes
 * behind RBAC checks, reusing the clients.* permissions.
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

const TABLE = 'sig_clients';
const COLS =
  'id, display_name, contact_id, matter_id, client_kind, fiduciary_role, court_supervised, ' +
  'status, residence_type, facility_name, room_number, appointed_at, next_review_at, ' +
  'assigned_staff_id, notes, archived_at, created_at, updated_at';

/** Embedded so the list can show the matter without a second round trip. */
const MATTER_EMBED = 'matter:sig_matters ( id, matter_ref, matter_type )';

export const CLIENT_KINDS = ['individual', 'ward', 'estate', 'trust'] as const;
export type ClientKind = (typeof CLIENT_KINDS)[number];

export const FIDUCIARY_ROLES = [
  'conservator',
  'guardian',
  'personal_representative',
  'trustee',
  'successor_trustee',
  'agent_poa',
] as const;
export type FiduciaryRole = (typeof FIDUCIARY_ROLES)[number];

export const CLIENT_STATUSES = ['onboarding', 'active', 'inactive', 'closed'] as const;
export type ClientStatus = (typeof CLIENT_STATUSES)[number];

interface Row {
  id: string;
  display_name: string;
  contact_id: string | null;
  matter_id: string | null;
  client_kind: string;
  fiduciary_role: string;
  court_supervised: boolean;
  status: string;
  residence_type: string | null;
  facility_name: string | null;
  room_number: string | null;
  appointed_at: string | null;
  next_review_at: string | null;
  assigned_staff_id: string | null;
  notes: string | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
  matter?: { id: string; matter_ref: string; matter_type: string } | null;
}

export interface ClientRecord {
  id: string;
  displayName: string;
  contactId: string | null;
  matterId: string | null;
  matterRef: string | null;
  clientKind: ClientKind;
  fiduciaryRole: FiduciaryRole;
  courtSupervised: boolean;
  status: ClientStatus;
  residenceType: string | null;
  facilityName: string | null;
  roomNumber: string | null;
  appointedAt: string | null;
  nextReviewAt: string | null;
  assignedStaffId: string | null;
  notes: string | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  isFavorite?: boolean;
}

function oneOf<T extends string>(list: readonly T[], value: string, fallback: T): T {
  return (list as readonly string[]).includes(value) ? (value as T) : fallback;
}

function mapRow(r: Row): ClientRecord {
  return {
    id: r.id,
    displayName: r.display_name,
    contactId: r.contact_id,
    matterId: r.matter_id,
    matterRef: r.matter?.matter_ref ?? null,
    clientKind: oneOf(CLIENT_KINDS, r.client_kind, 'individual'),
    fiduciaryRole: oneOf(FIDUCIARY_ROLES, r.fiduciary_role, 'trustee'),
    courtSupervised: Boolean(r.court_supervised),
    status: oneOf(CLIENT_STATUSES, r.status, 'onboarding'),
    residenceType: r.residence_type,
    facilityName: r.facility_name,
    roomNumber: r.room_number,
    appointedAt: r.appointed_at,
    nextReviewAt: r.next_review_at,
    assignedStaffId: r.assigned_staff_id,
    notes: r.notes,
    archivedAt: r.archived_at,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function assertCreate(user: RbacUser): void {
  if (!hasPermission(user, PERMISSIONS.CLIENTS_CREATE)) {
    throw new CrmForbiddenError('You cannot create clients.');
  }
}
function assertEdit(user: RbacUser): void {
  if (!hasPermission(user, PERMISSIONS.CLIENTS_EDIT)) {
    throw new CrmForbiddenError('You cannot edit clients.');
  }
}
function assertArchive(user: RbacUser): void {
  if (!hasPermission(user, PERMISSIONS.CLIENTS_ARCHIVE)) {
    throw new CrmForbiddenError('You cannot archive clients.');
  }
}

export interface ListClientsOptions {
  search?: string;
  status?: string;
  fiduciaryRole?: string;
  courtSupervised?: boolean;
  includeArchived?: boolean;
  limit?: number;
  offset?: number;
}

export async function listClients(
  user: RbacUser,
  opts: ListClientsOptions = {},
): Promise<{ clients: ClientRecord[]; total: number }> {
  const scope = contactReadScope(user);

  let q = supabaseAdmin.from(TABLE).select(`${COLS}, ${MATTER_EMBED}`, { count: 'exact' });
  if (scope.mode === 'assigned') q = q.eq('assigned_staff_id', scope.staffId);
  if (!opts.includeArchived) q = q.is('archived_at', null);
  if (opts.status) q = q.eq('status', opts.status);
  if (opts.fiduciaryRole) q = q.eq('fiduciary_role', opts.fiduciaryRole);
  if (opts.courtSupervised !== undefined) q = q.eq('court_supervised', opts.courtSupervised);
  if (opts.search) {
    const s = `%${opts.search}%`;
    q = q.or(`display_name.ilike.${s},facility_name.ilike.${s}`);
  }
  q = q
    .order('next_review_at', { ascending: true, nullsFirst: false })
    .order('display_name', { ascending: true })
    .range(opts.offset ?? 0, (opts.offset ?? 0) + (opts.limit ?? 200) - 1);

  const { data, error, count } = await q;
  if (error) raisePg(error as PgError);
  return { clients: (data as unknown as Row[]).map(mapRow), total: count ?? 0 };
}

export async function getClient(user: RbacUser, id: string): Promise<ClientRecord | null> {
  const scope = contactReadScope(user);
  let q = supabaseAdmin.from(TABLE).select(`${COLS}, ${MATTER_EMBED}`).eq('id', id);
  if (scope.mode === 'assigned') q = q.eq('assigned_staff_id', scope.staffId);
  const { data, error } = await q.maybeSingle();
  if (error) raisePg(error as PgError);
  return data ? mapRow(data as unknown as Row) : null;
}

export interface ClientInput {
  displayName?: string;
  contactId?: string | null;
  matterId?: string | null;
  clientKind?: string;
  fiduciaryRole?: string;
  courtSupervised?: boolean;
  status?: string;
  residenceType?: string;
  facilityName?: string;
  roomNumber?: string;
  appointedAt?: string | null;
  nextReviewAt?: string | null;
  assignedStaffId?: string | null;
  notes?: string;
}

function validate(input: ClientInput, { partial }: { partial: boolean }): void {
  if (!partial && !input.displayName?.trim()) {
    throw new CrmValidationError('A client name is required.');
  }
  if (input.clientKind && !(CLIENT_KINDS as readonly string[]).includes(input.clientKind)) {
    throw new CrmValidationError(`Unknown client kind: ${input.clientKind}`);
  }
  if (input.fiduciaryRole && !(FIDUCIARY_ROLES as readonly string[]).includes(input.fiduciaryRole)) {
    throw new CrmValidationError(`Unknown fiduciary role: ${input.fiduciaryRole}`);
  }
  if (input.status && !(CLIENT_STATUSES as readonly string[]).includes(input.status)) {
    throw new CrmValidationError(`Unknown status: ${input.status}`);
  }
}

function toColumns(input: ClientInput): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const set = (key: string, value: unknown) => {
    if (value !== undefined) out[key] = value === '' ? null : value;
  };
  set('display_name', input.displayName?.trim());
  set('contact_id', input.contactId);
  set('matter_id', input.matterId);
  set('client_kind', input.clientKind);
  set('fiduciary_role', input.fiduciaryRole);
  set('status', input.status);
  set('residence_type', input.residenceType);
  set('facility_name', input.facilityName);
  set('room_number', input.roomNumber);
  set('appointed_at', input.appointedAt);
  set('next_review_at', input.nextReviewAt);
  set('assigned_staff_id', input.assignedStaffId);
  set('notes', input.notes);
  // Boolean, so the '' -> null coercion above must not touch it.
  if (input.courtSupervised !== undefined) out.court_supervised = Boolean(input.courtSupervised);
  return out;
}

export async function createClient(user: RbacUser, input: ClientInput): Promise<ClientRecord> {
  assertCreate(user);
  validate(input, { partial: false });

  const insert = {
    ...toColumns(input),
    client_kind: input.clientKind ?? 'individual',
    fiduciary_role: input.fiduciaryRole ?? 'trustee',
    status: input.status ?? 'onboarding',
  };
  const { data, error } = await supabaseAdmin
    .from(TABLE)
    .insert(insert)
    .select(`${COLS}, ${MATTER_EMBED}`)
    .single();
  if (error) raisePg(error as PgError);
  return mapRow(data as unknown as Row);
}

export async function updateClient(
  user: RbacUser,
  id: string,
  input: ClientInput,
): Promise<ClientRecord> {
  assertEdit(user);
  validate(input, { partial: true });

  const patch = toColumns(input);
  if (Object.keys(patch).length === 0) {
    const existing = await getClient(user, id);
    if (!existing) throw new CrmValidationError('Client not found.');
    return existing;
  }

  const { data, error } = await supabaseAdmin
    .from(TABLE)
    .update(patch)
    .eq('id', id)
    .select(`${COLS}, ${MATTER_EMBED}`)
    .maybeSingle();
  if (error) raisePg(error as PgError);
  if (!data) throw new CrmValidationError('Client not found.');
  return mapRow(data as unknown as Row);
}

export async function archiveClient(
  user: RbacUser,
  id: string,
  archived = true,
): Promise<ClientRecord> {
  assertArchive(user);
  const { data, error } = await supabaseAdmin
    .from(TABLE)
    .update({ archived_at: archived ? new Date().toISOString() : null })
    .eq('id', id)
    .select(`${COLS}, ${MATTER_EMBED}`)
    .maybeSingle();
  if (error) raisePg(error as PgError);
  if (!data) throw new CrmValidationError('Client not found.');
  return mapRow(data as unknown as Row);
}

/** Permanent. Gated on both archive and edit, as with matters. */
export async function deleteClient(user: RbacUser, id: string): Promise<void> {
  assertArchive(user);
  assertEdit(user);
  const { error } = await supabaseAdmin.from(TABLE).delete().eq('id', id);
  if (error) raisePg(error as PgError);
}
