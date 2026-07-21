/**
 * Referrals data access on sig_referrals — the intake log.
 *
 * A referral exists before a contact does: someone calls from a hospital
 * discharge desk with a family name and a phone number, and that is worth
 * recording before anyone has confirmed spellings. Converting a referral
 * creates the contact and links the two.
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
import { purgeEntity } from '@/lib/collections';

const TABLE = 'sig_referrals';
const COLS =
  'id, client_name, primary_first_name, primary_last_name, secondary_first_name, ' +
  'secondary_last_name, primary_email, secondary_email, primary_phone, secondary_phone, ' +
  'address_line1, address_line2, city, state, postal_code, matter_type, referral_date, ' +
  'referred_by, referral_type, attorney, appointment_notes, status, status_detail, notes, contact_id, ' +
  'assigned_staff_id, archived_at, created_at, updated_at';

/** Taken from the real 2025 intake sheet, not invented. */
export const REFERRAL_STATUSES = [
  'awaiting',
  'nominated',
  'pending_decision',
  'accepted',
  'declined',
  'referred_out',
  'converted',
] as const;
export type ReferralStatus = (typeof REFERRAL_STATUSES)[number];

interface Row {
  id: string;
  client_name: string;
  primary_first_name: string | null;
  primary_last_name: string | null;
  secondary_first_name: string | null;
  secondary_last_name: string | null;
  primary_email: string | null;
  secondary_email: string | null;
  primary_phone: string | null;
  secondary_phone: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  matter_type: string | null;
  referral_date: string | null;
  referred_by: string | null;
  referral_type: string | null;
  attorney: string | null;
  appointment_notes: string | null;
  status: string;
  status_detail: string | null;
  notes: string | null;
  contact_id: string | null;
  assigned_staff_id: string | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReferralRecord {
  id: string;
  clientName: string;
  primaryFirstName: string | null;
  primaryLastName: string | null;
  secondaryFirstName: string | null;
  secondaryLastName: string | null;
  primaryEmail: string | null;
  secondaryEmail: string | null;
  primaryPhone: string | null;
  secondaryPhone: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  matterType: string | null;
  referralDate: string | null;
  referredBy: string | null;
  referralType: string | null;
  attorney: string | null;
  appointmentNotes: string | null;
  status: ReferralStatus;
  /** CFS's own wording, preserved verbatim. */
  statusDetail: string | null;
  notes: string | null;
  contactId: string | null;
  assignedStaffId: string | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  isFavorite?: boolean;
}

function mapRow(r: Row): ReferralRecord {
  return {
    id: r.id,
    clientName: r.client_name,
    primaryFirstName: r.primary_first_name,
    primaryLastName: r.primary_last_name,
    secondaryFirstName: r.secondary_first_name,
    secondaryLastName: r.secondary_last_name,
    primaryEmail: r.primary_email,
    secondaryEmail: r.secondary_email,
    primaryPhone: r.primary_phone,
    secondaryPhone: r.secondary_phone,
    addressLine1: r.address_line1,
    addressLine2: r.address_line2,
    city: r.city,
    state: r.state,
    postalCode: r.postal_code,
    matterType: r.matter_type,
    referralDate: r.referral_date,
    referredBy: r.referred_by,
    referralType: r.referral_type,
    attorney: r.attorney,
    appointmentNotes: r.appointment_notes,
    status: (REFERRAL_STATUSES as readonly string[]).includes(r.status)
      ? (r.status as ReferralStatus)
      : 'awaiting',
    statusDetail: r.status_detail,
    notes: r.notes,
    contactId: r.contact_id,
    assignedStaffId: r.assigned_staff_id,
    archivedAt: r.archived_at,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function assertCreate(user: RbacUser): void {
  if (!hasPermission(user, PERMISSIONS.CLIENTS_CREATE)) {
    throw new CrmForbiddenError('You cannot create referrals.');
  }
}
function assertEdit(user: RbacUser): void {
  if (!hasPermission(user, PERMISSIONS.CLIENTS_EDIT)) {
    throw new CrmForbiddenError('You cannot edit referrals.');
  }
}
function assertArchive(user: RbacUser): void {
  if (!hasPermission(user, PERMISSIONS.CLIENTS_ARCHIVE)) {
    throw new CrmForbiddenError('You cannot archive referrals.');
  }
}

export interface ListReferralsOptions {
  search?: string;
  status?: string;
  referralType?: string;
  includeArchived?: boolean;
  limit?: number;
  offset?: number;
}

export async function listReferrals(
  user: RbacUser,
  opts: ListReferralsOptions = {},
): Promise<{ referrals: ReferralRecord[]; total: number }> {
  contactReadScope(user);

  let q = supabaseAdmin.from(TABLE).select(COLS, { count: 'exact' });
  if (!opts.includeArchived) q = q.is('archived_at', null);
  if (opts.status) q = q.eq('status', opts.status);
  if (opts.referralType) q = q.eq('referral_type', opts.referralType);
  if (opts.search) {
    const s = `%${opts.search}%`;
    q = q.or(
      `client_name.ilike.${s},referred_by.ilike.${s},attorney.ilike.${s},primary_email.ilike.${s}`,
    );
  }
  q = q
    .order('referral_date', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
    .range(opts.offset ?? 0, (opts.offset ?? 0) + (opts.limit ?? 200) - 1);

  const { data, error, count } = await q;
  if (error) raisePg(error as PgError);
  return { referrals: (data as unknown as Row[]).map(mapRow), total: count ?? 0 };
}

export interface ReferralInput {
  clientName?: string;
  primaryFirstName?: string;
  primaryLastName?: string;
  secondaryFirstName?: string;
  secondaryLastName?: string;
  primaryEmail?: string;
  secondaryEmail?: string;
  primaryPhone?: string;
  secondaryPhone?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  matterType?: string;
  referralDate?: string | null;
  referredBy?: string;
  referralType?: string;
  attorney?: string;
  appointmentNotes?: string;
  status?: string;
  statusDetail?: string;
  notes?: string;
  assignedStaffId?: string | null;
}

function validate(input: ReferralInput, { partial }: { partial: boolean }): void {
  if (!partial && !input.clientName?.trim()) {
    throw new CrmValidationError('A client name is required.');
  }
  if (input.status && !(REFERRAL_STATUSES as readonly string[]).includes(input.status)) {
    throw new CrmValidationError(`Unknown status: ${input.status}`);
  }
}

function toColumns(input: ReferralInput): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const set = (key: string, value: unknown) => {
    if (value !== undefined) out[key] = value === '' ? null : value;
  };
  set('client_name', input.clientName?.trim());
  set('primary_first_name', input.primaryFirstName);
  set('primary_last_name', input.primaryLastName);
  set('secondary_first_name', input.secondaryFirstName);
  set('secondary_last_name', input.secondaryLastName);
  set('primary_email', input.primaryEmail);
  set('secondary_email', input.secondaryEmail);
  set('primary_phone', input.primaryPhone);
  set('secondary_phone', input.secondaryPhone);
  set('address_line1', input.addressLine1);
  set('address_line2', input.addressLine2);
  set('city', input.city);
  set('state', input.state);
  set('postal_code', input.postalCode);
  set('matter_type', input.matterType);
  set('referral_date', input.referralDate);
  set('referred_by', input.referredBy);
  set('referral_type', input.referralType);
  set('attorney', input.attorney);
  set('appointment_notes', input.appointmentNotes);
  set('status', input.status);
  set('status_detail', input.statusDetail);
  set('notes', input.notes);
  set('assigned_staff_id', input.assignedStaffId);
  return out;
}

export async function createReferral(
  user: RbacUser,
  input: ReferralInput,
): Promise<ReferralRecord> {
  assertCreate(user);
  validate(input, { partial: false });

  const { data, error } = await supabaseAdmin
    .from(TABLE)
    .insert({ ...toColumns(input), status: input.status ?? 'awaiting' })
    .select(COLS)
    .single();
  if (error) raisePg(error as PgError);
  return mapRow(data as unknown as Row);
}

export async function updateReferral(
  user: RbacUser,
  id: string,
  input: ReferralInput,
): Promise<ReferralRecord> {
  assertEdit(user);
  validate(input, { partial: true });

  const patch = toColumns(input);
  if (Object.keys(patch).length === 0) throw new CrmValidationError('Nothing to update.');

  const { data, error } = await supabaseAdmin
    .from(TABLE)
    .update(patch)
    .eq('id', id)
    .select(COLS)
    .maybeSingle();
  if (error) raisePg(error as PgError);
  if (!data) throw new CrmValidationError('Referral not found.');
  return mapRow(data as unknown as Row);
}

export async function archiveReferral(
  user: RbacUser,
  id: string,
  archived = true,
): Promise<ReferralRecord> {
  assertArchive(user);
  const { data, error } = await supabaseAdmin
    .from(TABLE)
    .update({ archived_at: archived ? new Date().toISOString() : null })
    .eq('id', id)
    .select(COLS)
    .maybeSingle();
  if (error) raisePg(error as PgError);
  if (!data) throw new CrmValidationError('Referral not found.');
  return mapRow(data as unknown as Row);
}

export async function deleteReferral(user: RbacUser, id: string): Promise<void> {
  assertArchive(user);
  assertEdit(user);
  const { error } = await supabaseAdmin.from(TABLE).delete().eq('id', id);
  if (error) raisePg(error as PgError);
  await purgeEntity('referral', id);
}

/**
 * Turn a referral into a contact, carrying every field across.
 *
 * Idempotent by design: a referral already linked to a contact returns that
 * contact rather than creating a second one. Two staff working the same
 * morning's referrals should not produce duplicate client records.
 */
export async function convertReferral(
  user: RbacUser,
  id: string,
): Promise<{ referral: ReferralRecord; contactId: string; alreadyConverted: boolean }> {
  assertCreate(user);

  const { data: existing, error: readErr } = await supabaseAdmin
    .from(TABLE)
    .select(COLS)
    .eq('id', id)
    .maybeSingle();
  if (readErr) raisePg(readErr as PgError);
  if (!existing) throw new CrmValidationError('Referral not found.');

  const referral = mapRow(existing as unknown as Row);
  if (referral.contactId) {
    return { referral, contactId: referral.contactId, alreadyConverted: true };
  }

  const first = referral.primaryFirstName?.trim() || '';
  const last = referral.primaryLastName?.trim() || '';
  const fullName = `${first} ${last}`.trim() || referral.clientName;

  const { data: contact, error: insErr } = await supabaseAdmin
    .from('sig_contacts')
    .insert({
      source: 'referral',
      first_name: first || null,
      last_name: last || null,
      full_name: fullName,
      email: referral.primaryEmail,
      mobile_phone: referral.primaryPhone,
      secondary_first_name: referral.secondaryFirstName,
      secondary_last_name: referral.secondaryLastName,
      secondary_email: referral.secondaryEmail,
      secondary_phone: referral.secondaryPhone,
      address_line1: referral.addressLine1,
      address_line2: referral.addressLine2,
      city: referral.city,
      state: referral.state,
      zip_code: referral.postalCode,
      matter_type: referral.matterType,
      referral_source: referral.referredBy,
      referral_date: referral.referralDate,
      referral_type: referral.referralType,
      attorney: referral.attorney,
      appointment_notes: referral.appointmentNotes,
      notes: referral.notes,
    })
    .select('id')
    .single();
  if (insErr) raisePg(insErr as PgError);

  const contactId = (contact as { id: string }).id;
  const updated = await updateReferral(user, id, { status: 'converted' });
  await supabaseAdmin.from(TABLE).update({ contact_id: contactId }).eq('id', id);

  return { referral: { ...updated, contactId }, contactId, alreadyConverted: false };
}
