/**
 * Opportunities (the funnel record) data access on sig_opportunities.
 *
 * The Opportunity carries the stage + disposition. One per engagement.
 * Reads are staff-scoped (mirrors contacts.ts). Writes go through the
 * service-role client with RBAC checks.
 *
 * server-only.
 */
import { supabaseAdmin } from '@/lib/supabase';
import type { RbacUser } from '@/lib/rbac';
import {
  contactReadScope,
  assertContactCreate,
  assertContactEdit,
  createsAssignedOnly,
  raisePg,
  CrmForbiddenError,
  CrmValidationError,
  type PgError,
} from './access';

const TABLE = 'sig_opportunities';
const COLS =
  'id, source, contact_id, stage, disposition, interest_meeting_at, intake_meeting_at, ' +
  'cif_complete, ep_docs_complete, fee_complete, closed_won_at, closed_at, close_reason, ' +
  'deferred_until, next_follow_up_at, assigned_staff_id, notes, created_at, updated_at, ' +
  // Lead servicing workflow (20260715000003_lead_workflow.sql)
  'workflow_stage, closed_status, lead_source, campaign';

// Embed a light contact summary for list/board rendering.
const CONTACT_EMBED =
  'contact:sig_contacts ( id, full_name, first_name, last_name, email, phone, mobile_phone, ' +
  'matter_type, referral_source, address_line1, city, state, zip_code )';

export type Stage = 'awareness' | 'interest' | 'intake' | 'nurture';
export type Disposition =
  | 'active'
  | 're_engagement'
  | 'dormant_no_response'
  | 'dormant_deferred'
  | 'exit';

export const STAGES: Stage[] = ['awareness', 'interest', 'intake', 'nurture'];

type Row = Record<string, unknown>;

export interface ContactSummary {
  id: string;
  fullName: string | null;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  mobilePhone: string | null;
  matterType: string | null;
  referralSource: string | null;
  // Carried for the Map view; sig_contacts already stores these.
  addressLine1: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
}

export interface OpportunityRow {
  id: string;
  source: string;
  contactId: string;
  stage: Stage;
  disposition: Disposition;
  interestMeetingAt: string | null;
  intakeMeetingAt: string | null;
  cifComplete: boolean;
  epDocsComplete: boolean;
  feeComplete: boolean;
  closedWonAt: string | null;
  closedAt: string | null;
  closeReason: string | null;
  deferredUntil: string | null;
  nextFollowUpAt: string | null;
  assignedStaffId: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  workflowStage: string;
  closedStatus: string | null;
  leadSource: string | null;
  campaign: string | null;
  contact?: ContactSummary | null;
}

export function contactDisplayNameFromRow(c: ContactSummary | null | undefined): string {
  if (!c) return 'Unnamed';
  if (c.fullName) return c.fullName;
  const n = `${c.firstName ?? ''} ${c.lastName ?? ''}`.trim();
  return n || 'Unnamed';
}

function mapContact(r: Row | null | undefined): ContactSummary | null {
  if (!r) return null;
  return {
    id: String(r.id),
    fullName: (r.full_name as string) ?? null,
    firstName: (r.first_name as string) ?? null,
    lastName: (r.last_name as string) ?? null,
    email: (r.email as string) ?? null,
    phone: (r.phone as string) ?? null,
    mobilePhone: (r.mobile_phone as string) ?? null,
    matterType: (r.matter_type as string) ?? null,
    referralSource: (r.referral_source as string) ?? null,
    addressLine1: (r.address_line1 as string) ?? null,
    city: (r.city as string) ?? null,
    state: (r.state as string) ?? null,
    zipCode: (r.zip_code as string) ?? null,
  };
}

function mapRow(r: Row): OpportunityRow {
  return {
    id: String(r.id),
    source: String(r.source ?? 'manual'),
    contactId: String(r.contact_id),
    stage: (r.stage as Stage) ?? 'awareness',
    disposition: (r.disposition as Disposition) ?? 'active',
    interestMeetingAt: (r.interest_meeting_at as string) ?? null,
    intakeMeetingAt: (r.intake_meeting_at as string) ?? null,
    cifComplete: Boolean(r.cif_complete),
    epDocsComplete: Boolean(r.ep_docs_complete),
    feeComplete: Boolean(r.fee_complete),
    closedWonAt: (r.closed_won_at as string) ?? null,
    closedAt: (r.closed_at as string) ?? null,
    closeReason: (r.close_reason as string) ?? null,
    deferredUntil: (r.deferred_until as string) ?? null,
    nextFollowUpAt: (r.next_follow_up_at as string) ?? null,
    assignedStaffId: (r.assigned_staff_id as string) ?? null,
    notes: (r.notes as string) ?? null,
    createdAt: String(r.created_at ?? ''),
    updatedAt: String(r.updated_at ?? ''),
    workflowStage: (r.workflow_stage as string) ?? 'lead_source',
    closedStatus: (r.closed_status as string) ?? null,
    leadSource: (r.lead_source as string) ?? null,
    campaign: (r.campaign as string) ?? null,
    contact: mapContact(r.contact as Row | undefined),
  };
}

export interface ListOpportunitiesInput {
  stage?: Stage;
  disposition?: Disposition;
  limit?: number;
}

/** Scoped list of every opportunity (with an embedded contact summary). */
export async function listOpportunities(
  user: RbacUser,
  input: ListOpportunitiesInput = {},
): Promise<OpportunityRow[]> {
  const scope = contactReadScope(user);
  let query = supabaseAdmin.from(TABLE).select(`${COLS}, ${CONTACT_EMBED}`);

  if (scope.mode === 'assigned') query = query.eq('assigned_staff_id', scope.staffId);
  if (input.stage) query = query.eq('stage', input.stage);
  if (input.disposition) query = query.eq('disposition', input.disposition);

  const { data, error } = await query
    .order('updated_at', { ascending: false })
    .limit(Math.min(Math.max(input.limit ?? 500, 1), 1000));
  if (error) raisePg(error as PgError);
  return ((data ?? []) as unknown as Row[]).map(mapRow);
}

export async function getOpportunity(user: RbacUser, id: string): Promise<OpportunityRow | null> {
  const scope = contactReadScope(user);
  const { data, error } = await supabaseAdmin
    .from(TABLE)
    .select(`${COLS}, ${CONTACT_EMBED}`)
    .eq('id', id)
    .maybeSingle();
  if (error) raisePg(error as PgError);
  if (!data) return null;
  const row = mapRow(data as unknown as Row);
  if (scope.mode === 'assigned' && row.assignedStaffId !== scope.staffId) {
    throw new CrmForbiddenError('This record is assigned to another staff member.');
  }
  return row;
}

/** The current (most recent) opportunity for a contact, if any. */
export async function getOpportunityForContact(
  user: RbacUser,
  contactId: string,
): Promise<OpportunityRow | null> {
  const scope = contactReadScope(user);
  let query = supabaseAdmin.from(TABLE).select(`${COLS}, ${CONTACT_EMBED}`).eq('contact_id', contactId);
  if (scope.mode === 'assigned') query = query.eq('assigned_staff_id', scope.staffId);
  const { data, error } = await query.order('created_at', { ascending: false }).limit(1);
  if (error) raisePg(error as PgError);
  const rows = (data ?? []) as unknown as Row[];
  return rows.length ? mapRow(rows[0]) : null;
}

export interface CreateOpportunityInput {
  contactId: string;
  stage?: Stage;
  assignedStaffId?: string | null;
}

export async function createOpportunity(
  user: RbacUser,
  input: CreateOpportunityInput,
): Promise<OpportunityRow> {
  assertContactCreate(user);
  if (!input.contactId) throw new CrmValidationError('A contact is required.');

  const assignedStaffId =
    input.assignedStaffId ?? (createsAssignedOnly(user) ? user.id : null);

  const insert = {
    source: 'manual',
    contact_id: input.contactId,
    stage: input.stage ?? 'awareness',
    disposition: 'active',
    assigned_staff_id: assignedStaffId,
  };
  const { data, error } = await supabaseAdmin.from(TABLE).insert(insert).select(COLS).single();
  if (error) raisePg(error as PgError);
  return mapRow(data as unknown as Row);
}

export interface UpdateOpportunityInput {
  stage?: Stage;
  disposition?: Disposition;
  interestMeetingAt?: string | null;
  intakeMeetingAt?: string | null;
  cifComplete?: boolean;
  epDocsComplete?: boolean;
  feeComplete?: boolean;
  closeReason?: string | null;
  deferredUntil?: string | null;
  nextFollowUpAt?: string | null;
  notes?: string | null;
  workflowStage?: string;
  closedStatus?: string | null;
  leadSource?: string | null;
  campaign?: string | null;
}

/**
 * Update an opportunity. Stamps derived timestamps so gate/close bookkeeping
 * stays consistent (e.g. moving to nurture stamps closed_won_at; exit stamps
 * closed_at).
 */
export async function updateOpportunity(
  user: RbacUser,
  id: string,
  patch: UpdateOpportunityInput,
): Promise<OpportunityRow> {
  assertContactEdit(user);
  const existing = await getOpportunity(user, id);
  if (!existing) throw new CrmValidationError('Opportunity not found.');

  const update: Row = {};
  if (patch.stage !== undefined) {
    if (!STAGES.includes(patch.stage)) throw new CrmValidationError('Invalid stage.');
    update.stage = patch.stage;
    // Advancing into a stage returns the record to active flow.
    update.disposition = 'active';
    if (patch.stage === 'interest' && !existing.interestMeetingAt) update.interest_meeting_at = new Date().toISOString();
    if (patch.stage === 'intake' && !existing.intakeMeetingAt) update.intake_meeting_at = new Date().toISOString();
    if (patch.stage === 'nurture') {
      update.closed_won_at = new Date().toISOString();
      update.cif_complete = true;
      update.ep_docs_complete = true;
      update.fee_complete = true;
    }
  }
  if (patch.disposition !== undefined) {
    update.disposition = patch.disposition;
    if (patch.disposition === 'exit') update.closed_at = new Date().toISOString();
  }
  if (patch.interestMeetingAt !== undefined) update.interest_meeting_at = patch.interestMeetingAt;
  if (patch.intakeMeetingAt !== undefined) update.intake_meeting_at = patch.intakeMeetingAt;
  if (patch.cifComplete !== undefined) update.cif_complete = patch.cifComplete;
  if (patch.epDocsComplete !== undefined) update.ep_docs_complete = patch.epDocsComplete;
  if (patch.feeComplete !== undefined) update.fee_complete = patch.feeComplete;
  if (patch.closeReason !== undefined) update.close_reason = patch.closeReason;
  if (patch.deferredUntil !== undefined) update.deferred_until = patch.deferredUntil;
  if (patch.nextFollowUpAt !== undefined) update.next_follow_up_at = patch.nextFollowUpAt;
  if (patch.notes !== undefined) update.notes = patch.notes;
  if (patch.leadSource !== undefined) update.lead_source = patch.leadSource;
  if (patch.campaign !== undefined) update.campaign = patch.campaign;
  if (patch.closedStatus !== undefined) update.closed_status = patch.closedStatus;
  if (patch.workflowStage !== undefined) {
    update.workflow_stage = patch.workflowStage;
    if (patch.workflowStage === 'won') {
      update.closed_status = 'won';
      if (!existing.closedWonAt) update.closed_won_at = new Date().toISOString();
    } else if (patch.workflowStage === 'lost') {
      update.closed_status = 'lost';
      if (!existing.closedAt) update.closed_at = new Date().toISOString();
    }
  }

  if (Object.keys(update).length === 0) return existing;

  const { data, error } = await supabaseAdmin.from(TABLE).update(update).eq('id', id).select(COLS).single();
  if (error) raisePg(error as PgError);
  // Re-read with the embedded contact for a consistent return shape.
  return (await getOpportunity(user, id)) ?? mapRow(data as unknown as Row);
}
