/**
 * Bill Pay & Ledger data access on sig_ledger_entries.
 *
 * This is client trust money — funds CFS holds on behalf of a protected
 * person, reported to a court. Two rules follow from that:
 *
 *  1. Amounts are integer CENTS everywhere: database, API and this module.
 *     Floating-point dollars drift, and a ledger that disagrees with the bank
 *     by a cent on the third reconciliation is a compliance problem. Only the
 *     formatting layer turns cents into "$1,234.56".
 *  2. Signed amounts: positive is money in, negative is money out. A balance
 *     is then a plain sum with no per-type branching to get wrong.
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

const TABLE = 'sig_ledger_entries';
const COLS =
  'id, client_id, matter_id, entry_type, status, amount_cents, description, category, ' +
  'payee_name, payee_address, payee_city, payee_state, method, reference, account_label, ' +
  'entry_date, due_date, cleared_at, notes, archived_at, created_at, updated_at';
const CLIENT_EMBED = 'client:sig_clients ( id, display_name )';

export const ENTRY_TYPES = ['deposit', 'disbursement', 'fee', 'transfer', 'adjustment'] as const;
export type EntryType = (typeof ENTRY_TYPES)[number];

export const ENTRY_STATUSES = ['scheduled', 'pending', 'cleared', 'void'] as const;
export type EntryStatus = (typeof ENTRY_STATUSES)[number];

export const PAYMENT_METHODS = ['check', 'ach', 'card', 'cash', 'wire', 'transfer'] as const;

/** Types that represent money leaving the trust account. */
const OUTFLOW_TYPES: readonly string[] = ['disbursement', 'fee'];

interface Row {
  id: string;
  client_id: string | null;
  matter_id: string | null;
  entry_type: string;
  status: string;
  amount_cents: number | string;
  description: string;
  category: string | null;
  payee_name: string | null;
  payee_address: string | null;
  payee_city: string | null;
  payee_state: string | null;
  method: string | null;
  reference: string | null;
  account_label: string | null;
  entry_date: string | null;
  due_date: string | null;
  cleared_at: string | null;
  notes: string | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
  client?: { id: string; display_name: string } | null;
}

export interface LedgerEntryRecord {
  id: string;
  clientId: string | null;
  clientName: string | null;
  matterId: string | null;
  entryType: EntryType;
  status: EntryStatus;
  /** Signed integer cents. Positive in, negative out. */
  amountCents: number;
  description: string;
  category: string | null;
  payeeName: string | null;
  payeeAddress: string | null;
  payeeCity: string | null;
  payeeState: string | null;
  method: string | null;
  reference: string | null;
  accountLabel: string | null;
  entryDate: string | null;
  dueDate: string | null;
  clearedAt: string | null;
  notes: string | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  isFavorite?: boolean;
}

function oneOf<T extends string>(list: readonly T[], value: string, fallback: T): T {
  return (list as readonly string[]).includes(value) ? (value as T) : fallback;
}

function mapRow(r: Row): LedgerEntryRecord {
  return {
    id: r.id,
    clientId: r.client_id,
    clientName: r.client?.display_name ?? null,
    matterId: r.matter_id,
    entryType: oneOf(ENTRY_TYPES, r.entry_type, 'disbursement'),
    status: oneOf(ENTRY_STATUSES, r.status, 'scheduled'),
    // BIGINT can arrive as a string from PostgREST; Number() on a value this
    // size is exact well past any plausible trust balance.
    amountCents: Math.round(Number(r.amount_cents ?? 0)),
    description: r.description,
    category: r.category,
    payeeName: r.payee_name,
    payeeAddress: r.payee_address,
    payeeCity: r.payee_city,
    payeeState: r.payee_state,
    method: r.method,
    reference: r.reference,
    accountLabel: r.account_label,
    entryDate: r.entry_date,
    dueDate: r.due_date,
    clearedAt: r.cleared_at,
    notes: r.notes,
    archivedAt: r.archived_at,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function assertView(user: RbacUser): void {
  if (!hasPermission(user, PERMISSIONS.CLIENTS_VIEW_ALL) &&
      !hasPermission(user, PERMISSIONS.CLIENTS_VIEW_ASSIGNED)) {
    throw new CrmForbiddenError('You do not have access to the ledger.');
  }
}
function assertWrite(user: RbacUser): void {
  if (!hasPermission(user, PERMISSIONS.CLIENTS_EDIT)) {
    throw new CrmForbiddenError('You cannot record ledger entries.');
  }
}
function assertDelete(user: RbacUser): void {
  if (!hasPermission(user, PERMISSIONS.CLIENTS_ARCHIVE)) {
    throw new CrmForbiddenError('You cannot delete ledger entries.');
  }
}

export interface ListLedgerOptions {
  search?: string;
  clientId?: string;
  entryType?: string;
  status?: string;
  includeArchived?: boolean;
  limit?: number;
  offset?: number;
}

export interface LedgerTotals {
  /** Cleared money in, out (as a positive number), and the net balance. */
  inCents: number;
  outCents: number;
  balanceCents: number;
  /** Not yet cleared — scheduled or pending. */
  pendingOutCents: number;
}

export async function listLedger(
  user: RbacUser,
  opts: ListLedgerOptions = {},
): Promise<{ entries: LedgerEntryRecord[]; total: number; totals: LedgerTotals }> {
  assertView(user);
  contactReadScope(user);

  let q = supabaseAdmin.from(TABLE).select(`${COLS}, ${CLIENT_EMBED}`, { count: 'exact' });
  if (!opts.includeArchived) q = q.is('archived_at', null);
  if (opts.clientId) q = q.eq('client_id', opts.clientId);
  if (opts.entryType) q = q.eq('entry_type', opts.entryType);
  if (opts.status) q = q.eq('status', opts.status);
  if (opts.search) {
    const s = `%${opts.search}%`;
    q = q.or(`description.ilike.${s},payee_name.ilike.${s},reference.ilike.${s}`);
  }
  q = q
    .order('entry_date', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
    .range(opts.offset ?? 0, (opts.offset ?? 0) + (opts.limit ?? 300) - 1);

  const { data, error, count } = await q;
  if (error) raisePg(error as PgError);

  const entries = (data as unknown as Row[]).map(mapRow);

  // Totals over the returned page. Voided entries never count toward a
  // balance — a void is a correction, not a transaction.
  const live = entries.filter((e) => e.status !== 'void' && !e.archivedAt);
  const cleared = live.filter((e) => e.status === 'cleared');
  const totals: LedgerTotals = {
    inCents: cleared.filter((e) => e.amountCents > 0).reduce((s, e) => s + e.amountCents, 0),
    outCents: Math.abs(
      cleared.filter((e) => e.amountCents < 0).reduce((s, e) => s + e.amountCents, 0),
    ),
    balanceCents: cleared.reduce((s, e) => s + e.amountCents, 0),
    pendingOutCents: Math.abs(
      live
        .filter((e) => e.status !== 'cleared' && e.amountCents < 0)
        .reduce((s, e) => s + e.amountCents, 0),
    ),
  };

  return { entries, total: count ?? 0, totals };
}

export interface LedgerInput {
  clientId?: string | null;
  matterId?: string | null;
  entryType?: string;
  status?: string;
  /** Magnitude in cents; the sign is derived from entryType. */
  amountCents?: number;
  description?: string;
  category?: string;
  payeeName?: string;
  payeeAddress?: string;
  payeeCity?: string;
  payeeState?: string;
  method?: string;
  reference?: string;
  accountLabel?: string;
  entryDate?: string | null;
  dueDate?: string | null;
  clearedAt?: string | null;
  notes?: string;
}

function validate(input: LedgerInput, { partial }: { partial: boolean }): void {
  if (!partial && !input.description?.trim()) {
    throw new CrmValidationError('A description is required.');
  }
  if (input.entryType && !(ENTRY_TYPES as readonly string[]).includes(input.entryType)) {
    throw new CrmValidationError(`Unknown entry type: ${input.entryType}`);
  }
  if (input.status && !(ENTRY_STATUSES as readonly string[]).includes(input.status)) {
    throw new CrmValidationError(`Unknown status: ${input.status}`);
  }
  if (input.method && !(PAYMENT_METHODS as readonly string[]).includes(input.method)) {
    throw new CrmValidationError(`Unknown payment method: ${input.method}`);
  }
  if (input.amountCents !== undefined) {
    if (!Number.isFinite(input.amountCents) || !Number.isInteger(input.amountCents)) {
      throw new CrmValidationError('Amount must be a whole number of cents.');
    }
    if (Math.abs(input.amountCents) > 1_000_000_000_00) {
      throw new CrmValidationError('That amount looks wrong — over $1 billion.');
    }
  }
}

/**
 * Money out is stored negative regardless of how the caller signs it, so the
 * direction always follows the entry type rather than the data entry.
 */
function signedAmount(entryType: string | undefined, magnitude: number): number {
  const abs = Math.abs(magnitude);
  return OUTFLOW_TYPES.includes(entryType ?? '') ? -abs : abs;
}

function toColumns(input: LedgerInput, existingType?: string): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const set = (key: string, value: unknown) => {
    if (value !== undefined) out[key] = value === '' ? null : value;
  };
  set('client_id', input.clientId);
  set('matter_id', input.matterId);
  set('entry_type', input.entryType);
  set('status', input.status);
  set('description', input.description?.trim());
  set('category', input.category);
  set('payee_name', input.payeeName);
  set('payee_address', input.payeeAddress);
  set('payee_city', input.payeeCity);
  set('payee_state', input.payeeState);
  set('method', input.method);
  set('reference', input.reference);
  set('account_label', input.accountLabel);
  set('entry_date', input.entryDate);
  set('due_date', input.dueDate);
  set('cleared_at', input.clearedAt);
  set('notes', input.notes);

  if (input.amountCents !== undefined) {
    out.amount_cents = signedAmount(input.entryType ?? existingType, input.amountCents);
  }
  return out;
}

export async function createLedgerEntry(
  user: RbacUser,
  input: LedgerInput,
): Promise<LedgerEntryRecord> {
  assertWrite(user);
  validate(input, { partial: false });

  const { data, error } = await supabaseAdmin
    .from(TABLE)
    .insert({
      ...toColumns(input),
      entry_type: input.entryType ?? 'disbursement',
      status: input.status ?? 'scheduled',
      amount_cents: signedAmount(input.entryType ?? 'disbursement', input.amountCents ?? 0),
      created_by: user.id,
    })
    .select(`${COLS}, ${CLIENT_EMBED}`)
    .single();
  if (error) raisePg(error as PgError);
  return mapRow(data as unknown as Row);
}

export async function updateLedgerEntry(
  user: RbacUser,
  id: string,
  input: LedgerInput,
): Promise<LedgerEntryRecord> {
  assertWrite(user);
  validate(input, { partial: true });

  // The stored sign depends on entry_type, so an amount-only edit needs to
  // know the type it is being applied to.
  const { data: current } = await supabaseAdmin
    .from(TABLE)
    .select('entry_type')
    .eq('id', id)
    .maybeSingle();
  const existingType = (current as { entry_type?: string } | null)?.entry_type;

  const patch = toColumns(input, existingType);
  if (Object.keys(patch).length === 0) {
    throw new CrmValidationError('Nothing to update.');
  }

  const { data, error } = await supabaseAdmin
    .from(TABLE)
    .update(patch)
    .eq('id', id)
    .select(`${COLS}, ${CLIENT_EMBED}`)
    .maybeSingle();
  if (error) raisePg(error as PgError);
  if (!data) throw new CrmValidationError('Ledger entry not found.');
  return mapRow(data as unknown as Row);
}

export async function archiveLedgerEntry(
  user: RbacUser,
  id: string,
  archived = true,
): Promise<LedgerEntryRecord> {
  assertWrite(user);
  const { data, error } = await supabaseAdmin
    .from(TABLE)
    .update({ archived_at: archived ? new Date().toISOString() : null })
    .eq('id', id)
    .select(`${COLS}, ${CLIENT_EMBED}`)
    .maybeSingle();
  if (error) raisePg(error as PgError);
  if (!data) throw new CrmValidationError('Ledger entry not found.');
  return mapRow(data as unknown as Row);
}

/**
 * Permanent delete. Voiding is almost always the right action on a ledger —
 * it preserves the audit trail — so the UI leads with that.
 */
export async function deleteLedgerEntry(user: RbacUser, id: string): Promise<void> {
  assertDelete(user);
  assertWrite(user);
  const { error } = await supabaseAdmin.from(TABLE).delete().eq('id', id);
  if (error) raisePg(error as PgError);
  await purgeEntity('ledger_entry', id);
}

/** Cents → "$1,234.56". The only place money becomes a string. */
export function formatCents(cents: number): string {
  return (cents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}
