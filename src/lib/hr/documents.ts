/**
 * Employee document portal: required checklist, uploads, verification,
 * and per-employee completion. server-only.
 */
import { supabaseAdmin } from '@/lib/supabase';
import type { RbacUser } from '@/lib/rbac';
import { raisePg, CrmValidationError, type PgError } from '@/lib/crm/access';
import { assertCanVerify, canViewAllHr, ownProfileId, resolveScope } from './access';

type Row = Record<string, unknown>;

export type DocStatus = 'uploaded' | 'verified' | 'rejected';

export interface DocType {
  id: string;
  key: string;
  name: string;
  description: string | null;
  category: string;
  required: boolean;
  tracksExpiry: boolean;
  sortOrder: number;
}

export interface EmployeeDoc {
  id: string;
  profileId: string;
  docTypeId: string;
  fileName: string | null;
  fileUrl: string | null;
  status: DocStatus;
  expiresAt: string | null;
  notes: string | null;
  uploadedAt: string | null;
  verifiedAt: string | null;
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  role: string | null;
}

export interface EmployeeCompliance extends Employee {
  requiredTotal: number;
  verifiedCount: number;
  pendingCount: number;
  pct: number;
  complete: boolean;
  missing: string[];
}

/* ------------------------------ doc types ------------------------------ */
export async function listDocTypes(): Promise<DocType[]> {
  const { data, error } = await supabaseAdmin
    .from('sig_employee_doc_types')
    .select('id, key, name, description, category, required, tracks_expiry, sort_order')
    .order('sort_order', { ascending: true });
  if (error) raisePg(error as PgError);
  return ((data ?? []) as Row[]).map((r) => ({
    id: String(r.id),
    key: String(r.key),
    name: String(r.name),
    description: (r.description as string) ?? null,
    category: String(r.category ?? 'other'),
    required: Boolean(r.required),
    tracksExpiry: Boolean(r.tracks_expiry),
    sortOrder: Number(r.sort_order ?? 0),
  }));
}

/* ------------------------------ employees ------------------------------ */
export async function listEmployees(): Promise<Employee[]> {
  const { data, error } = await supabaseAdmin
    .from('sig_profiles')
    .select('id, display_name, first_name, last_name, email, role')
    .eq('is_internal_user', true)
    .eq('status', 'active')
    .order('display_name', { ascending: true });
  if (error) raisePg(error as PgError);
  return ((data ?? []) as Row[]).map((p) => ({
    id: String(p.id),
    name:
      (p.display_name as string) ||
      `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim() ||
      String(p.email),
    email: String(p.email),
    role: (p.role as string) ?? null,
  }));
}

/* ------------------------------ documents ------------------------------ */
const DOC_COLS = 'id, profile_id, doc_type_id, file_name, file_url, status, expires_at, notes, uploaded_at, verified_at';

function mapDoc(r: Row): EmployeeDoc {
  return {
    id: String(r.id),
    profileId: String(r.profile_id),
    docTypeId: String(r.doc_type_id),
    fileName: (r.file_name as string) ?? null,
    fileUrl: (r.file_url as string) ?? null,
    status: (r.status as DocStatus) ?? 'uploaded',
    expiresAt: (r.expires_at as string) ?? null,
    notes: (r.notes as string) ?? null,
    uploadedAt: (r.uploaded_at as string) ?? null,
    verifiedAt: (r.verified_at as string) ?? null,
  };
}

export async function listDocuments(user: RbacUser, profileId?: string | null): Promise<EmployeeDoc[]> {
  const scope = resolveScope(user, profileId);
  let query = supabaseAdmin.from('sig_employee_documents').select(DOC_COLS);
  if (scope.profileId) query = query.eq('profile_id', scope.profileId);
  const { data, error } = await query.limit(2000);
  if (error) raisePg(error as PgError);
  return ((data ?? []) as Row[]).map(mapDoc);
}

export interface UpsertDocInput {
  profileId?: string;
  docTypeId: string;
  fileName?: string;
  fileUrl?: string;
  expiresAt?: string | null;
}

/** Record an upload. Re-uploading replaces the file and resets verification. */
export async function upsertDocument(user: RbacUser, input: UpsertDocInput): Promise<EmployeeDoc> {
  const scope = resolveScope(user, input.profileId ?? null);
  const profileId = scope.profileId ?? ownProfileId(user);
  if (!profileId) throw new CrmValidationError('No staff profile to attach this document to.');
  if (!input.docTypeId) throw new CrmValidationError('A document type is required.');

  const payload = {
    profile_id: profileId,
    doc_type_id: input.docTypeId,
    file_name: input.fileName ?? null,
    file_url: input.fileUrl ?? null,
    expires_at: input.expiresAt || null,
    status: 'uploaded',
    uploaded_at: new Date().toISOString(),
    verified_at: null,
    verified_by: null,
  };

  const { data, error } = await supabaseAdmin
    .from('sig_employee_documents')
    .upsert(payload, { onConflict: 'profile_id,doc_type_id' })
    .select(DOC_COLS)
    .single();
  if (error) raisePg(error as PgError);
  return mapDoc(data as Row);
}

/** Verify or reject an uploaded document (manager action). */
export async function setDocumentStatus(user: RbacUser, id: string, status: DocStatus): Promise<EmployeeDoc> {
  assertCanVerify(user);
  if (!['uploaded', 'verified', 'rejected'].includes(status)) throw new CrmValidationError('Invalid status.');
  const update: Row = {
    status,
    verified_at: status === 'verified' ? new Date().toISOString() : null,
    verified_by: status === 'verified' ? ownProfileId(user) : null,
  };
  const { data, error } = await supabaseAdmin
    .from('sig_employee_documents')
    .update(update)
    .eq('id', id)
    .select(DOC_COLS)
    .single();
  if (error) raisePg(error as PgError);
  return mapDoc(data as Row);
}

/* ----------------------------- compliance ------------------------------ */
export interface ComplianceResult {
  employees: EmployeeCompliance[];
  docTypes: DocType[];
  stats: { total: number; upToDate: number; avgPct: number; pendingVerification: number };
  canViewAll: boolean;
}

/** Per-employee completion against the required checklist. */
export async function getCompliance(user: RbacUser): Promise<ComplianceResult> {
  const [docTypes, allEmployees] = await Promise.all([listDocTypes(), listEmployees()]);

  const viewAll = canViewAllHr(user);
  const own = ownProfileId(user);
  const employees = viewAll ? allEmployees : allEmployees.filter((e) => e.id === own);

  // One read of every document, then group in memory.
  const { data, error } = await supabaseAdmin.from('sig_employee_documents').select(DOC_COLS).limit(5000);
  if (error) raisePg(error as PgError);
  const docs = ((data ?? []) as Row[]).map(mapDoc);

  const requiredTypes = docTypes.filter((t) => t.required);
  const requiredTotal = requiredTypes.length;

  const rows: EmployeeCompliance[] = employees.map((e) => {
    const mine = docs.filter((d) => d.profileId === e.id);
    const verifiedKeys = new Set(
      mine.filter((d) => d.status === 'verified').map((d) => d.docTypeId),
    );
    const verifiedCount = requiredTypes.filter((t) => verifiedKeys.has(t.id)).length;
    const pendingCount = mine.filter((d) => d.status === 'uploaded').length;
    const missing = requiredTypes.filter((t) => !verifiedKeys.has(t.id)).map((t) => t.name);
    const pct = requiredTotal === 0 ? 100 : Math.round((verifiedCount / requiredTotal) * 100);
    return {
      ...e,
      requiredTotal,
      verifiedCount,
      pendingCount,
      pct,
      complete: pct === 100,
      missing,
    };
  });

  rows.sort((a, b) => b.pct - a.pct || a.name.localeCompare(b.name));

  const total = rows.length;
  const upToDate = rows.filter((r) => r.complete).length;
  const avgPct = total === 0 ? 0 : Math.round(rows.reduce((n, r) => n + r.pct, 0) / total);
  const pendingVerification = rows.reduce((n, r) => n + r.pendingCount, 0);

  return { employees: rows, docTypes, stats: { total, upToDate, avgPct, pendingVerification }, canViewAll: viewAll };
}
