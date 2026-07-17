/**
 * Employee mileage expense log (sig_mileage_logs). server-only.
 */
import { supabaseAdmin } from '@/lib/supabase';
import type { RbacUser } from '@/lib/rbac';
import { raisePg, CrmValidationError, type PgError } from '@/lib/crm/access';
import { assertCanVerify, ownProfileId, resolveScope } from './access';

const TABLE = 'sig_mileage_logs';
const COLS =
  'id, profile_id, trip_date, purpose, from_location, to_location, miles, rate_per_mile, amount, ' +
  'contact_id, notes, status, created_at';
const EMBED = 'profile:sig_profiles ( id, display_name, email ), contact:sig_contacts ( id, full_name )';

type Row = Record<string, unknown>;

export type MileageStatus = 'draft' | 'submitted' | 'approved' | 'reimbursed';
export const MILEAGE_STATUSES: MileageStatus[] = ['draft', 'submitted', 'approved', 'reimbursed'];

export interface MileageRow {
  id: string;
  profileId: string;
  employeeName: string | null;
  tripDate: string;
  purpose: string | null;
  fromLocation: string | null;
  toLocation: string | null;
  miles: number;
  ratePerMile: number;
  amount: number;
  contactId: string | null;
  contactName: string | null;
  notes: string | null;
  status: MileageStatus;
  createdAt: string;
}

function mapRow(r: Row): MileageRow {
  const profile = r.profile as Row | undefined;
  const contact = r.contact as Row | undefined;
  return {
    id: String(r.id),
    profileId: String(r.profile_id),
    employeeName: (profile?.display_name as string) ?? (profile?.email as string) ?? null,
    tripDate: String(r.trip_date ?? ''),
    purpose: (r.purpose as string) ?? null,
    fromLocation: (r.from_location as string) ?? null,
    toLocation: (r.to_location as string) ?? null,
    miles: Number(r.miles ?? 0),
    ratePerMile: Number(r.rate_per_mile ?? 0),
    amount: Number(r.amount ?? 0),
    contactId: (r.contact_id as string) ?? null,
    contactName: (contact?.full_name as string) ?? null,
    notes: (r.notes as string) ?? null,
    status: (r.status as MileageStatus) ?? 'submitted',
    createdAt: String(r.created_at ?? ''),
  };
}

export async function listMileage(user: RbacUser, profileId?: string | null): Promise<MileageRow[]> {
  const scope = resolveScope(user, profileId);
  let query = supabaseAdmin.from(TABLE).select(`${COLS}, ${EMBED}`);
  if (scope.profileId) query = query.eq('profile_id', scope.profileId);
  const { data, error } = await query.order('trip_date', { ascending: false }).limit(500);
  if (error) raisePg(error as PgError);
  return ((data ?? []) as unknown as Row[]).map(mapRow);
}

export interface MileageInput {
  tripDate?: string;
  purpose?: string;
  fromLocation?: string;
  toLocation?: string;
  miles?: number;
  ratePerMile?: number;
  contactId?: string | null;
  notes?: string;
  profileId?: string;
}

export async function createMileage(user: RbacUser, input: MileageInput): Promise<MileageRow> {
  // Admins may log on another employee's behalf; everyone else logs their own.
  const scope = resolveScope(user, input.profileId ?? null);
  const profileId = scope.profileId ?? ownProfileId(user);
  if (!profileId) throw new CrmValidationError('No staff profile to attribute this trip to.');
  const miles = Number(input.miles ?? 0);
  if (!(miles > 0)) throw new CrmValidationError('Enter the miles driven.');

  const insert: Row = {
    profile_id: profileId,
    trip_date: input.tripDate || new Date().toISOString().slice(0, 10),
    purpose: input.purpose?.trim() || null,
    from_location: input.fromLocation?.trim() || null,
    to_location: input.toLocation?.trim() || null,
    miles,
    contact_id: input.contactId || null,
    notes: input.notes?.trim() || null,
    status: 'submitted',
  };
  if (input.ratePerMile != null) insert.rate_per_mile = input.ratePerMile;

  const { data, error } = await supabaseAdmin.from(TABLE).insert(insert).select(`${COLS}, ${EMBED}`).single();
  if (error) raisePg(error as PgError);
  return mapRow(data as unknown as Row);
}

export async function setMileageStatus(user: RbacUser, id: string, status: MileageStatus): Promise<MileageRow> {
  if (!MILEAGE_STATUSES.includes(status)) throw new CrmValidationError('Invalid status.');
  // Approving / reimbursing is a manager action.
  if (status === 'approved' || status === 'reimbursed') assertCanVerify(user);
  const { data, error } = await supabaseAdmin
    .from(TABLE)
    .update({ status })
    .eq('id', id)
    .select(`${COLS}, ${EMBED}`)
    .single();
  if (error) raisePg(error as PgError);
  return mapRow(data as unknown as Row);
}

export async function deleteMileage(user: RbacUser, id: string): Promise<void> {
  const scope = resolveScope(user, null);
  let q = supabaseAdmin.from(TABLE).delete().eq('id', id);
  if (!scope.all) q = q.eq('profile_id', scope.profileId!);
  const { error } = await q;
  if (error) raisePg(error as PgError);
}
