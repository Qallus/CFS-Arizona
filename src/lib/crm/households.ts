/**
 * Households data access on sig_households. Advisor scope = households that
 * contain at least one contact assigned to the current staff member.
 *
 * server-only.
 */
import { randomUUID } from 'crypto';
import { supabaseAdmin } from '@/lib/supabase';
import type { RbacUser } from '@/lib/rbac';
import {
  householdReadScope,
  assertHouseholdCreate,
  assertHouseholdEdit,
  raisePg,
  CrmForbiddenError,
  CrmValidationError,
  type PgError,
  type ReadScope,
} from './access';

const TABLE = 'sig_households';
const COLS = 'id, source, external_id, name, created_at, updated_at';

type Row = Record<string, unknown>;

export interface HouseholdRow {
  id: string;
  source: string;
  externalId: string | null;
  name: string;
  memberCount?: number;
  createdAt: string;
  updatedAt: string;
}

function mapRow(r: Row): HouseholdRow {
  return {
    id: String(r.id),
    source: String(r.source ?? 'manual'),
    externalId: (r.external_id as string) ?? null,
    name: (r.name as string) ?? 'Household',
    createdAt: String(r.created_at ?? ''),
    updatedAt: String(r.updated_at ?? ''),
  };
}

/** Household ids that contain a contact assigned to this staff member. */
async function assignedHouseholdIds(staffId: string): Promise<string[]> {
  const { data, error } = await supabaseAdmin
    .from('sig_contacts')
    .select('household_id')
    .eq('assigned_staff_id', staffId)
    .not('household_id', 'is', null);
  if (error) raisePg(error as PgError);
  const ids = new Set<string>();
  for (const r of (data ?? []) as Row[]) if (r.household_id) ids.add(String(r.household_id));
  return [...ids];
}

async function scopedHouseholdFilter(scope: ReadScope): Promise<string[] | null> {
  if (scope.mode === 'all') return null; // no id restriction
  return assignedHouseholdIds(scope.staffId);
}

export interface ListHouseholdsResult {
  households: HouseholdRow[];
  total: number;
}

export async function listHouseholds(
  user: RbacUser,
  input: { search?: string; limit?: number; offset?: number } = {},
): Promise<ListHouseholdsResult> {
  const scope = householdReadScope(user);
  const limit = Math.min(Math.max(input.limit ?? 50, 1), 200);
  const offset = Math.max(input.offset ?? 0, 0);

  const ids = await scopedHouseholdFilter(scope);
  if (ids && ids.length === 0) return { households: [], total: 0 };

  let query = supabaseAdmin.from(TABLE).select(COLS, { count: 'exact' });
  if (ids) query = query.in('id', ids);
  if (input.search) {
    const q = input.search.replace(/[%,]/g, ' ').trim();
    if (q) query = query.ilike('name', `%${q}%`);
  }

  const { data, error, count } = await query
    .order('name', { ascending: true })
    .range(offset, offset + limit - 1);
  if (error) raisePg(error as PgError);

  const households = ((data ?? []) as unknown as Row[]).map(mapRow);

  // Attach member counts (best-effort, one query).
  if (households.length) {
    const { data: members } = await supabaseAdmin
      .from('sig_contacts')
      .select('household_id')
      .in('household_id', households.map((h) => h.id));
    const counts = new Map<string, number>();
    for (const m of (members ?? []) as Row[]) {
      const hid = String(m.household_id);
      counts.set(hid, (counts.get(hid) ?? 0) + 1);
    }
    for (const h of households) h.memberCount = counts.get(h.id) ?? 0;
  }

  return { households, total: count ?? 0 };
}

export async function getHousehold(user: RbacUser, id: string): Promise<HouseholdRow | null> {
  const scope = householdReadScope(user);
  if (scope.mode === 'assigned') {
    const ids = await assignedHouseholdIds(scope.staffId);
    if (!ids.includes(id)) throw new CrmForbiddenError('This household is not assigned to you.');
  }
  const { data, error } = await supabaseAdmin.from(TABLE).select(COLS).eq('id', id).maybeSingle();
  if (error) raisePg(error as PgError);
  return data ? mapRow(data as unknown as Row) : null;
}

export async function createHousehold(user: RbacUser, name: string): Promise<HouseholdRow> {
  assertHouseholdCreate(user);
  if (!name?.trim()) throw new CrmValidationError('Household name is required.');
  const insert = { source: 'manual', external_id: randomUUID(), name: name.trim() };
  const { data, error } = await supabaseAdmin.from(TABLE).insert(insert).select(COLS).single();
  if (error) raisePg(error as PgError);
  return mapRow(data as unknown as Row);
}

export async function updateHousehold(user: RbacUser, id: string, name: string): Promise<HouseholdRow> {
  assertHouseholdEdit(user);
  const existing = await getHousehold(user, id);
  if (!existing) throw new CrmValidationError('Household not found.');
  if (!name?.trim()) throw new CrmValidationError('Household name is required.');
  const { data, error } = await supabaseAdmin
    .from(TABLE)
    .update({ name: name.trim() })
    .eq('id', id)
    .select(COLS)
    .single();
  if (error) raisePg(error as PgError);
  return mapRow(data as unknown as Row);
}
