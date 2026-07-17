/**
 * Redtail → SIG360 read-only sync engine.
 *
 * Pulls contacts, households, notes, and appointments from Redtail and
 * upserts them into the sig_* mirror tables (source='redtail'). Redtail
 * stays the source of truth; re-running is safe (upsert on source+external_id).
 *
 * Advisor/planner assignment: the Redtail advisor labels are stored on the
 * contact, and we best-effort resolve them to a SIG staff profile
 * (assigned_staff_id) by email or display name.
 *
 * server-only: uses the service-role Supabase client.
 */
import { supabaseAdmin } from '@/lib/supabase';
import {
  isRedtailConfigured,
  fetchAllRedtailContacts,
  fetchRedtailHouseholds,
  fetchRedtailActivities,
  type Sig360Contact,
} from '@/lib/redtail';

const SOURCE = 'redtail';
const UPSERT_CHUNK = 500;
const UUID_RE = /^[0-9a-fA-F-]{36}$/;

export interface SyncCounts {
  households: number;
  contacts: number;
  notes: number;
  appointments: number;
}

export interface SyncResult {
  runId: string | null;
  status: 'success' | 'partial' | 'error';
  counts: SyncCounts;
  error?: string;
}

const zeroCounts = (): SyncCounts => ({ households: 0, contacts: 0, notes: 0, appointments: 0 });

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

type Row = Record<string, unknown>;

/** Upsert in batches; returns the selected columns of every upserted row. */
async function upsertAll(table: string, rows: Row[], onConflict: string, select: string): Promise<Row[]> {
  if (rows.length === 0) return [];
  const out: Row[] = [];
  for (const batch of chunk(rows, UPSERT_CHUNK)) {
    const { data, error } = await supabaseAdmin
      .from(table)
      .upsert(batch, { onConflict, ignoreDuplicates: false })
      .select(select);
    if (error) throw new Error(`${table} upsert failed: ${error.message}`);
    if (data) out.push(...(data as unknown as Row[]));
  }
  return out;
}

interface StaffIndex {
  byEmail: Map<string, string>;
  byName: Map<string, string>;
}

async function loadStaffIndex(): Promise<StaffIndex> {
  const byEmail = new Map<string, string>();
  const byName = new Map<string, string>();
  try {
    const { data } = await supabaseAdmin
      .from('sig_profiles')
      .select('id, email, display_name, first_name, last_name, is_internal_user')
      .eq('is_internal_user', true);
    for (const p of (data ?? []) as Row[]) {
      const id = String(p.id);
      if (p.email) byEmail.set(String(p.email).toLowerCase(), id);
      const dn = (p.display_name as string) || `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim();
      if (dn) byName.set(dn.toLowerCase(), id);
    }
  } catch {
    // sig_profiles missing — no resolution, not fatal.
  }
  return { byEmail, byName };
}

function resolveStaff(label: string | null, staff: StaffIndex): string | null {
  if (!label) return null;
  const v = label.trim().toLowerCase();
  if (!v) return null;
  if (v.includes('@') && staff.byEmail.has(v)) return staff.byEmail.get(v)!;
  return staff.byName.get(v) ?? null;
}

function toContactRow(
  c: Sig360Contact,
  householdMap: Map<string, string>,
  staff: StaffIndex,
  now: string,
): Row {
  const householdExt = c.household_id !== null && c.household_id !== undefined ? String(c.household_id) : null;
  const assignedStaffId =
    resolveStaff(c.servicing_advisor, staff) ??
    resolveStaff(c.assigned_planner, staff) ??
    resolveStaff(c.writing_advisor, staff);

  return {
    source: SOURCE,
    external_id: c.external_id,
    first_name: c.first_name || null,
    last_name: c.last_name || null,
    full_name: c.full_name || null,
    email: c.email || null,
    phone: c.phone,
    mobile_phone: c.mobile_phone,
    home_phone: c.home_phone,
    work_phone: c.work_phone,
    company_name: c.company_name || null,
    status: c.status || null,
    contact_type: c.contact_type || null,
    city: c.city,
    state: c.state,
    zip_code: c.zip_code || null,
    country: c.country || null,
    household_external_id: householdExt,
    household_id: householdExt ? (householdMap.get(householdExt) ?? null) : null,
    servicing_advisor: c.servicing_advisor,
    writing_advisor: c.writing_advisor,
    assigned_planner: c.assigned_planner,
    assigned_staff_id: assignedStaffId,
    tags: c.tags ?? [],
    raw: c.raw_redtail,
    redtail_created_at: c.created_at,
    redtail_updated_at: c.updated_at,
    last_activity_at: c.last_activity,
    synced_at: now,
  };
}

async function recordRunStart(triggeredBy: string | null): Promise<string | null> {
  try {
    const { data } = await supabaseAdmin
      .from('sig_sync_runs')
      .insert({
        source: SOURCE,
        status: 'running',
        triggered_by: triggeredBy && UUID_RE.test(triggeredBy) ? triggeredBy : null,
      })
      .select('id')
      .single();
    return data ? String((data as Row).id) : null;
  } catch {
    return null;
  }
}

async function recordRunEnd(
  runId: string | null,
  status: SyncResult['status'],
  counts: SyncCounts,
  error?: string,
): Promise<void> {
  if (!runId) return;
  try {
    await supabaseAdmin
      .from('sig_sync_runs')
      .update({ status, counts, error: error ?? null, finished_at: new Date().toISOString() })
      .eq('id', runId);
  } catch {
    // non-fatal
  }
}

/** Run a full Redtail → SIG360 mirror sync. */
export async function runRedtailSync(triggeredBy: string | null = null): Promise<SyncResult> {
  const counts = zeroCounts();
  if (!isRedtailConfigured()) {
    return { runId: null, status: 'error', counts, error: 'Redtail is not configured.' };
  }

  const runId = await recordRunStart(triggeredBy);
  const now = new Date().toISOString();

  try {
    // 1. Households
    const households = await fetchRedtailHouseholds();
    const hhRows: Row[] = households.map((h) => ({
      source: SOURCE,
      external_id: h.external_id,
      name: h.name,
      raw: h.raw,
      synced_at: now,
    }));
    const hhUp = await upsertAll('sig_households', hhRows, 'source,external_id', 'id, external_id');
    counts.households = hhUp.length;
    const householdMap = new Map<string, string>(
      hhUp.map((r) => [String(r.external_id), String(r.id)]),
    );

    // 2. Contacts (resolve household + advisor)
    const staff = await loadStaffIndex();
    const contacts = await fetchAllRedtailContacts();
    const contactRows = contacts.map((c) => toContactRow(c, householdMap, staff, now));
    const cUp = await upsertAll('sig_contacts', contactRows, 'source,external_id', 'id, external_id');
    counts.contacts = cUp.length;
    const contactMap = new Map<string, string>(cUp.map((r) => [String(r.external_id), String(r.id)]));

    // 3. Notes + appointments (resolve contact)
    const { notes, appointments } = await fetchRedtailActivities();

    const noteRows: Row[] = notes.map((n) => ({
      source: SOURCE,
      external_id: n.external_id,
      contact_external_id: n.contact_external_id,
      contact_id: n.contact_external_id ? (contactMap.get(n.contact_external_id) ?? null) : null,
      body: n.body || null,
      category: n.category,
      note_type: n.note_type,
      author: n.author,
      redtail_created_at: n.redtail_created_at,
      raw: n.raw,
      synced_at: now,
    }));
    const nUp = await upsertAll('sig_notes', noteRows, 'source,external_id', 'id');
    counts.notes = nUp.length;

    const apptRows: Row[] = appointments.map((a) => ({
      source: SOURCE,
      external_id: a.external_id,
      contact_external_id: a.contact_external_id,
      contact_id: a.contact_external_id ? (contactMap.get(a.contact_external_id) ?? null) : null,
      title: a.title,
      description: a.description,
      location: a.location,
      start_at: a.start_at,
      end_at: a.end_at,
      all_day: a.all_day,
      status: a.status,
      activity_type: a.activity_type,
      assigned_to: a.assigned_to,
      raw: a.raw,
      synced_at: now,
    }));
    const aUp = await upsertAll('sig_appointments', apptRows, 'source,external_id', 'id');
    counts.appointments = aUp.length;

    await recordRunEnd(runId, 'success', counts);
    return { runId, status: 'success', counts };
  } catch (err) {
    const message = (err as Error).message;
    await recordRunEnd(runId, 'error', counts, message);
    return { runId, status: 'error', counts, error: message };
  }
}

export interface RedtailStatus {
  configured: boolean;
  lastRun: {
    id: string;
    status: string;
    started_at: string;
    finished_at: string | null;
    counts: SyncCounts | null;
    error: string | null;
  } | null;
  totals: { contacts: number; households: number; notes: number; appointments: number } | null;
}

/** Config + last-run + row-count summary for the sync UI. */
export async function getRedtailStatus(): Promise<RedtailStatus> {
  const configured = isRedtailConfigured();
  let lastRun: RedtailStatus['lastRun'] = null;
  let totals: RedtailStatus['totals'] = null;

  try {
    const { data } = await supabaseAdmin
      .from('sig_sync_runs')
      .select('id, status, started_at, finished_at, counts, error')
      .eq('source', SOURCE)
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (data) lastRun = data as unknown as RedtailStatus['lastRun'];
  } catch {
    // table missing — leave null
  }

  try {
    const tables = ['sig_contacts', 'sig_households', 'sig_notes', 'sig_appointments'] as const;
    const [contacts, households, notes, appointments] = await Promise.all(
      tables.map((t) =>
        supabaseAdmin.from(t).select('*', { count: 'exact', head: true }).then((r) => r.count ?? 0),
      ),
    );
    totals = { contacts, households, notes, appointments };
  } catch {
    totals = null;
  }

  return { configured, lastRun, totals };
}
