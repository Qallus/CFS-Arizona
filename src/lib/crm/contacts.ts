/**
 * Contacts (clients / leads / prospects) data access on sig_contacts.
 * Records may originate from a Redtail sync (source='redtail') or be created
 * manually (source='manual'). All reads are advisor-scoped.
 *
 * server-only.
 */
import { randomUUID } from 'crypto';
import { supabaseAdmin } from '@/lib/supabase';
import type { RbacUser } from '@/lib/rbac';
import {
  contactReadScope,
  assertContactCreate,
  assertContactEdit,
  assertContactAssign,
  createsAssignedOnly,
  raisePg,
  CrmForbiddenError,
  CrmValidationError,
  type PgError,
} from './access';

const TABLE = 'sig_contacts';
const COLS =
  'id, source, external_id, first_name, last_name, full_name, email, phone, mobile_phone, ' +
  'home_phone, work_phone, company_name, status, contact_type, city, state, zip_code, country, ' +
  'household_id, household_external_id, servicing_advisor, writing_advisor, assigned_planner, ' +
  'assigned_staff_id, tags, redtail_created_at, last_activity_at, created_at, updated_at, ' +
  // CFS CIF fields (20260715000001_crm_funnel.sql)
  'preferred_name, salutation, date_of_birth, address_line1, address_line2, referral_source, ' +
  'referral_source_detail, matter_type, preferred_contact_method, cif';

type Row = Record<string, unknown>;

export interface ContactRow {
  id: string;
  source: string;
  externalId: string | null;
  firstName: string | null;
  lastName: string | null;
  fullName: string | null;
  email: string | null;
  phone: string | null;
  mobilePhone: string | null;
  homePhone: string | null;
  workPhone: string | null;
  companyName: string | null;
  status: string | null;
  contactType: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  country: string | null;
  householdId: string | null;
  servicingAdvisor: string | null;
  writingAdvisor: string | null;
  assignedPlanner: string | null;
  assignedStaffId: string | null;
  tags: unknown[];
  lastActivityAt: string | null;
  createdAt: string;
  updatedAt: string;
  // CFS CIF fields
  preferredName: string | null;
  salutation: string | null;
  dateOfBirth: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  referralSource: string | null;
  referralSourceDetail: string | null;
  matterType: string | null;
  preferredContactMethod: string | null;
  cif: Record<string, unknown>;
}

function mapRow(r: Row): ContactRow {
  return {
    id: String(r.id),
    source: String(r.source ?? 'manual'),
    externalId: (r.external_id as string) ?? null,
    firstName: (r.first_name as string) ?? null,
    lastName: (r.last_name as string) ?? null,
    fullName: (r.full_name as string) ?? null,
    email: (r.email as string) ?? null,
    phone: (r.phone as string) ?? null,
    mobilePhone: (r.mobile_phone as string) ?? null,
    homePhone: (r.home_phone as string) ?? null,
    workPhone: (r.work_phone as string) ?? null,
    companyName: (r.company_name as string) ?? null,
    status: (r.status as string) ?? null,
    contactType: (r.contact_type as string) ?? null,
    city: (r.city as string) ?? null,
    state: (r.state as string) ?? null,
    zipCode: (r.zip_code as string) ?? null,
    country: (r.country as string) ?? null,
    householdId: (r.household_id as string) ?? null,
    servicingAdvisor: (r.servicing_advisor as string) ?? null,
    writingAdvisor: (r.writing_advisor as string) ?? null,
    assignedPlanner: (r.assigned_planner as string) ?? null,
    assignedStaffId: (r.assigned_staff_id as string) ?? null,
    tags: (r.tags as unknown[]) ?? [],
    lastActivityAt: (r.last_activity_at as string) ?? null,
    createdAt: String(r.created_at ?? ''),
    updatedAt: String(r.updated_at ?? ''),
    preferredName: (r.preferred_name as string) ?? null,
    salutation: (r.salutation as string) ?? null,
    dateOfBirth: (r.date_of_birth as string) ?? null,
    addressLine1: (r.address_line1 as string) ?? null,
    addressLine2: (r.address_line2 as string) ?? null,
    referralSource: (r.referral_source as string) ?? null,
    referralSourceDetail: (r.referral_source_detail as string) ?? null,
    matterType: (r.matter_type as string) ?? null,
    preferredContactMethod: (r.preferred_contact_method as string) ?? null,
    cif: (r.cif as Record<string, unknown>) ?? {},
  };
}

export interface ListContactsInput {
  search?: string;
  type?: string; // client | lead | prospect | company
  householdId?: string;
  limit?: number;
  offset?: number;
}

export interface ListContactsResult {
  contacts: ContactRow[];
  total: number;
}

export async function listContacts(user: RbacUser, input: ListContactsInput = {}): Promise<ListContactsResult> {
  const scope = contactReadScope(user);
  const limit = Math.min(Math.max(input.limit ?? 50, 1), 200);
  const offset = Math.max(input.offset ?? 0, 0);

  let query = supabaseAdmin.from(TABLE).select(COLS, { count: 'exact' });

  if (scope.mode === 'assigned') query = query.eq('assigned_staff_id', scope.staffId);
  if (input.type) query = query.eq('contact_type', input.type);
  if (input.householdId) query = query.eq('household_id', input.householdId);
  if (input.search) {
    const q = input.search.replace(/[%,]/g, ' ').trim();
    if (q) {
      query = query.or(
        `full_name.ilike.%${q}%,email.ilike.%${q}%,company_name.ilike.%${q}%,last_name.ilike.%${q}%`,
      );
    }
  }

  const { data, error, count } = await query
    .order('full_name', { ascending: true, nullsFirst: false })
    .range(offset, offset + limit - 1);
  if (error) raisePg(error as PgError);

  return { contacts: ((data ?? []) as unknown as Row[]).map(mapRow), total: count ?? 0 };
}

/** Fetch a contact, enforcing scope (assigned advisors only see their own). */
export async function getContact(user: RbacUser, id: string): Promise<ContactRow | null> {
  const scope = contactReadScope(user);
  const { data, error } = await supabaseAdmin.from(TABLE).select(COLS).eq('id', id).maybeSingle();
  if (error) raisePg(error as PgError);
  if (!data) return null;
  const row = mapRow(data as unknown as Row);
  if (scope.mode === 'assigned' && row.assignedStaffId !== scope.staffId) {
    throw new CrmForbiddenError('This client is assigned to another advisor.');
  }
  return row;
}

export interface ContactInput {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  mobilePhone?: string;
  companyName?: string;
  contactType?: string;
  status?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  householdId?: string | null;
  assignedStaffId?: string | null;
  // CFS CIF fields
  preferredName?: string;
  salutation?: string;
  dateOfBirth?: string | null;
  addressLine1?: string;
  addressLine2?: string;
  referralSource?: string;
  referralSourceDetail?: string;
  matterType?: string;
  preferredContactMethod?: string;
}

function fullNameOf(first?: string, last?: string, company?: string): string {
  const name = `${(first ?? '').trim()} ${(last ?? '').trim()}`.trim();
  return name || (company ?? '').trim() || 'Unnamed';
}

export async function createContact(user: RbacUser, input: ContactInput): Promise<ContactRow> {
  assertContactCreate(user);
  if (!input.firstName?.trim() && !input.lastName?.trim() && !input.companyName?.trim()) {
    throw new CrmValidationError('Provide a name or company.');
  }

  // Advisors (assigned-scope) must own what they create, or they can't see it.
  const assignedStaffId =
    input.assignedStaffId ?? (createsAssignedOnly(user) ? user.id : null);

  const insert = {
    source: 'manual',
    external_id: randomUUID(),
    first_name: input.firstName?.trim() || null,
    last_name: input.lastName?.trim() || null,
    full_name: fullNameOf(input.firstName, input.lastName, input.companyName),
    email: input.email?.trim().toLowerCase() || null,
    phone: input.phone?.trim() || null,
    mobile_phone: input.mobilePhone?.trim() || null,
    company_name: input.companyName?.trim() || null,
    contact_type: input.contactType || 'client',
    status: input.status?.trim() || 'Active',
    city: input.city?.trim() || null,
    state: input.state?.trim() || null,
    zip_code: input.zipCode?.trim() || null,
    household_id: input.householdId ?? null,
    assigned_staff_id: assignedStaffId,
    preferred_name: input.preferredName?.trim() || null,
    salutation: input.salutation?.trim() || null,
    date_of_birth: input.dateOfBirth || null,
    address_line1: input.addressLine1?.trim() || null,
    address_line2: input.addressLine2?.trim() || null,
    referral_source: input.referralSource?.trim() || null,
    referral_source_detail: input.referralSourceDetail?.trim() || null,
    matter_type: input.matterType?.trim() || null,
    preferred_contact_method: input.preferredContactMethod?.trim() || null,
  };

  const { data, error } = await supabaseAdmin.from(TABLE).insert(insert).select(COLS).single();
  if (error) raisePg(error as PgError);
  return mapRow(data as unknown as Row);
}

export async function updateContact(user: RbacUser, id: string, patch: ContactInput): Promise<ContactRow> {
  assertContactEdit(user);
  // Scope check via getContact (throws if not accessible).
  const existing = await getContact(user, id);
  if (!existing) throw new CrmValidationError('Client not found.');

  // Changing the assigned advisor requires the assign permission.
  if (patch.assignedStaffId !== undefined && patch.assignedStaffId !== existing.assignedStaffId) {
    assertContactAssign(user);
  }

  const update: Row = {};
  if (patch.firstName !== undefined) update.first_name = patch.firstName.trim() || null;
  if (patch.lastName !== undefined) update.last_name = patch.lastName.trim() || null;
  if (patch.firstName !== undefined || patch.lastName !== undefined || patch.companyName !== undefined) {
    update.full_name = fullNameOf(
      patch.firstName ?? existing.firstName ?? '',
      patch.lastName ?? existing.lastName ?? '',
      patch.companyName ?? existing.companyName ?? '',
    );
  }
  if (patch.email !== undefined) update.email = patch.email.trim().toLowerCase() || null;
  if (patch.phone !== undefined) update.phone = patch.phone.trim() || null;
  if (patch.mobilePhone !== undefined) update.mobile_phone = patch.mobilePhone.trim() || null;
  if (patch.companyName !== undefined) update.company_name = patch.companyName.trim() || null;
  if (patch.contactType !== undefined) update.contact_type = patch.contactType || null;
  if (patch.status !== undefined) update.status = patch.status.trim() || null;
  if (patch.city !== undefined) update.city = patch.city.trim() || null;
  if (patch.state !== undefined) update.state = patch.state.trim() || null;
  if (patch.zipCode !== undefined) update.zip_code = patch.zipCode.trim() || null;
  if (patch.householdId !== undefined) update.household_id = patch.householdId;
  if (patch.assignedStaffId !== undefined) update.assigned_staff_id = patch.assignedStaffId;
  if (patch.preferredName !== undefined) update.preferred_name = patch.preferredName.trim() || null;
  if (patch.salutation !== undefined) update.salutation = patch.salutation.trim() || null;
  if (patch.dateOfBirth !== undefined) update.date_of_birth = patch.dateOfBirth || null;
  if (patch.addressLine1 !== undefined) update.address_line1 = patch.addressLine1.trim() || null;
  if (patch.addressLine2 !== undefined) update.address_line2 = patch.addressLine2.trim() || null;
  if (patch.referralSource !== undefined) update.referral_source = patch.referralSource.trim() || null;
  if (patch.referralSourceDetail !== undefined) update.referral_source_detail = patch.referralSourceDetail.trim() || null;
  if (patch.matterType !== undefined) update.matter_type = patch.matterType.trim() || null;
  if (patch.preferredContactMethod !== undefined) update.preferred_contact_method = patch.preferredContactMethod.trim() || null;

  if (Object.keys(update).length === 0) return existing;

  const { data, error } = await supabaseAdmin.from(TABLE).update(update).eq('id', id).select(COLS).single();
  if (error) raisePg(error as PgError);
  return mapRow(data as unknown as Row);
}
