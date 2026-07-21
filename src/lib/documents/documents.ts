/**
 * Documents data access on sig_documents.
 *
 * Unlike the other pages the file IS the record, so upload and create are one
 * operation and the storage pointer lives on the row. Files go into the same
 * private 'attachments' bucket under a document/ prefix.
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
import { purgeEntity, MAX_UPLOAD_BYTES } from '@/lib/collections';

const TABLE = 'sig_documents';
const COLS =
  'id, title, doc_type, status, client_id, matter_id, file_name, storage_path, mime_type, ' +
  'size_bytes, effective_at, expires_at, uploaded_by, notes, archived_at, created_at, updated_at';
const CLIENT_EMBED = 'client:sig_clients ( id, display_name, city, state )';
const MATTER_EMBED = 'matter:sig_matters ( id, matter_ref )';

const BUCKET = 'attachments';
const SIGNED_URL_TTL_SECONDS = 60 * 10;

export const DOC_TYPES = [
  'court_filing',
  'legal',
  'medical',
  'financial',
  'insurance',
  'identification',
  'correspondence',
  'other',
] as const;
export type DocType = (typeof DOC_TYPES)[number];

export const DOC_STATUSES = ['draft', 'final', 'filed', 'expired'] as const;
export type DocStatus = (typeof DOC_STATUSES)[number];

interface Row {
  id: string;
  title: string;
  doc_type: string;
  status: string;
  client_id: string | null;
  matter_id: string | null;
  file_name: string | null;
  storage_path: string | null;
  mime_type: string | null;
  size_bytes: number | null;
  effective_at: string | null;
  expires_at: string | null;
  uploaded_by: string | null;
  notes: string | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
  client?: { id: string; display_name: string; city: string | null; state: string | null } | null;
  matter?: { id: string; matter_ref: string } | null;
}

export interface DocumentRecord {
  id: string;
  title: string;
  docType: DocType;
  status: DocStatus;
  clientId: string | null;
  clientName: string | null;
  clientCity: string | null;
  clientState: string | null;
  matterId: string | null;
  matterRef: string | null;
  fileName: string | null;
  mimeType: string | null;
  sizeBytes: number | null;
  effectiveAt: string | null;
  expiresAt: string | null;
  notes: string | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  /** Short-lived signed URL, minted per request. Never stored. */
  url?: string | null;
  isFavorite?: boolean;
}

function oneOf<T extends string>(list: readonly T[], value: string, fallback: T): T {
  return (list as readonly string[]).includes(value) ? (value as T) : fallback;
}

function mapRow(r: Row): DocumentRecord {
  return {
    id: r.id,
    title: r.title,
    docType: oneOf(DOC_TYPES, r.doc_type, 'other'),
    status: oneOf(DOC_STATUSES, r.status, 'draft'),
    clientId: r.client_id,
    clientName: r.client?.display_name ?? null,
    clientCity: r.client?.city ?? null,
    clientState: r.client?.state ?? null,
    matterId: r.matter_id,
    matterRef: r.matter?.matter_ref ?? null,
    fileName: r.file_name,
    mimeType: r.mime_type,
    sizeBytes: r.size_bytes,
    effectiveAt: r.effective_at,
    expiresAt: r.expires_at,
    notes: r.notes,
    archivedAt: r.archived_at,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function assertView(user: RbacUser): void {
  if (!hasPermission(user, PERMISSIONS.DOCUMENTS_VIEW)) {
    throw new CrmForbiddenError('You cannot view documents.');
  }
}
function assertUpload(user: RbacUser): void {
  if (!hasPermission(user, PERMISSIONS.DOCUMENTS_UPLOAD)) {
    throw new CrmForbiddenError('You cannot upload documents.');
  }
}
function assertDelete(user: RbacUser): void {
  if (!hasPermission(user, PERMISSIONS.DOCUMENTS_DELETE)) {
    throw new CrmForbiddenError('You cannot delete documents.');
  }
}

export interface ListDocumentsOptions {
  search?: string;
  docType?: string;
  status?: string;
  clientId?: string;
  includeArchived?: boolean;
  limit?: number;
  offset?: number;
}

export async function listDocuments(
  user: RbacUser,
  opts: ListDocumentsOptions = {},
): Promise<{ documents: DocumentRecord[]; total: number }> {
  assertView(user);
  // Reuses the client read scope: a document is only ever as visible as the
  // client it belongs to.
  contactReadScope(user);

  let q = supabaseAdmin
    .from(TABLE)
    .select(`${COLS}, ${CLIENT_EMBED}, ${MATTER_EMBED}`, { count: 'exact' });
  if (!opts.includeArchived) q = q.is('archived_at', null);
  if (opts.docType) q = q.eq('doc_type', opts.docType);
  if (opts.status) q = q.eq('status', opts.status);
  if (opts.clientId) q = q.eq('client_id', opts.clientId);
  if (opts.search) {
    const s = `%${opts.search}%`;
    q = q.or(`title.ilike.${s},file_name.ilike.${s},notes.ilike.${s}`);
  }
  q = q
    .order('created_at', { ascending: false })
    .range(opts.offset ?? 0, (opts.offset ?? 0) + (opts.limit ?? 200) - 1);

  const { data, error, count } = await q;
  if (error) raisePg(error as PgError);

  const documents = (data as unknown as Row[]).map(mapRow);

  // Private bucket: hand back short-lived signed URLs, not object paths.
  await Promise.all(
    documents.map(async (doc, i) => {
      const path = (data as unknown as Row[])[i].storage_path;
      if (!path) return;
      const { data: signed } = await supabaseAdmin.storage
        .from(BUCKET)
        .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);
      doc.url = signed?.signedUrl ?? null;
    }),
  );

  return { documents, total: count ?? 0 };
}

export interface DocumentInput {
  title?: string;
  docType?: string;
  status?: string;
  clientId?: string | null;
  matterId?: string | null;
  effectiveAt?: string | null;
  expiresAt?: string | null;
  notes?: string;
}

function validate(input: DocumentInput, { partial }: { partial: boolean }): void {
  if (!partial && !input.title?.trim()) {
    throw new CrmValidationError('A document title is required.');
  }
  if (input.docType && !(DOC_TYPES as readonly string[]).includes(input.docType)) {
    throw new CrmValidationError(`Unknown document type: ${input.docType}`);
  }
  if (input.status && !(DOC_STATUSES as readonly string[]).includes(input.status)) {
    throw new CrmValidationError(`Unknown status: ${input.status}`);
  }
}

function toColumns(input: DocumentInput): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const set = (key: string, value: unknown) => {
    if (value !== undefined) out[key] = value === '' ? null : value;
  };
  set('title', input.title?.trim());
  set('doc_type', input.docType);
  set('status', input.status);
  set('client_id', input.clientId);
  set('matter_id', input.matterId);
  set('effective_at', input.effectiveAt);
  set('expires_at', input.expiresAt);
  set('notes', input.notes);
  return out;
}

function safeFileName(name: string): string {
  return (
    name
      .replace(/[/\\]+/g, '_')
      .replace(/\.{2,}/g, '.')
      .replace(/[^A-Za-z0-9._ -]/g, '')
      .trim()
      .slice(0, 180) || 'file'
  );
}

/**
 * Create a document, optionally with its file in the same call — which is the
 * normal path, since a document without a file is just a note.
 */
export async function createDocument(
  user: RbacUser,
  input: DocumentInput,
  file?: File | null,
): Promise<DocumentRecord> {
  assertUpload(user);
  validate(input, { partial: false });

  let storagePath: string | null = null;
  let fileMeta: Record<string, unknown> = {};

  if (file) {
    if (file.size > MAX_UPLOAD_BYTES) {
      throw new CrmValidationError(
        `That file is ${(file.size / 1024 / 1024).toFixed(1)} MB. The limit is ${MAX_UPLOAD_BYTES / 1024 / 1024} MB.`,
      );
    }
    const clean = safeFileName(file.name);
    storagePath = `document/${crypto.randomUUID()}-${clean}`;
    const { error: upErr } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(storagePath, file, {
        contentType: file.type || 'application/octet-stream',
        upsert: false,
      });
    if (upErr) {
      throw new Error(
        /bucket/i.test(upErr.message)
          ? `Storage bucket "${BUCKET}" is missing. Apply the matters migration.`
          : upErr.message,
      );
    }
    fileMeta = {
      file_name: clean,
      storage_path: storagePath,
      mime_type: file.type || null,
      size_bytes: file.size,
    };
  }

  const { data, error } = await supabaseAdmin
    .from(TABLE)
    .insert({
      ...toColumns(input),
      ...fileMeta,
      doc_type: input.docType ?? 'other',
      status: input.status ?? 'draft',
      uploaded_by: user.id,
    })
    .select(`${COLS}, ${CLIENT_EMBED}, ${MATTER_EMBED}`)
    .single();

  if (error) {
    // Never leave the object behind if the row failed.
    if (storagePath) await supabaseAdmin.storage.from(BUCKET).remove([storagePath]);
    raisePg(error as PgError);
  }
  return mapRow(data as unknown as Row);
}

export async function updateDocument(
  user: RbacUser,
  id: string,
  input: DocumentInput,
): Promise<DocumentRecord> {
  assertUpload(user);
  validate(input, { partial: true });

  const patch = toColumns(input);
  if (Object.keys(patch).length === 0) {
    const { documents } = await listDocuments(user, { limit: 1 });
    const existing = documents.find((d) => d.id === id);
    if (!existing) throw new CrmValidationError('Document not found.');
    return existing;
  }

  const { data, error } = await supabaseAdmin
    .from(TABLE)
    .update(patch)
    .eq('id', id)
    .select(`${COLS}, ${CLIENT_EMBED}, ${MATTER_EMBED}`)
    .maybeSingle();
  if (error) raisePg(error as PgError);
  if (!data) throw new CrmValidationError('Document not found.');
  return mapRow(data as unknown as Row);
}

export async function archiveDocument(
  user: RbacUser,
  id: string,
  archived = true,
): Promise<DocumentRecord> {
  assertUpload(user);
  const { data, error } = await supabaseAdmin
    .from(TABLE)
    .update({ archived_at: archived ? new Date().toISOString() : null })
    .eq('id', id)
    .select(`${COLS}, ${CLIENT_EMBED}, ${MATTER_EMBED}`)
    .maybeSingle();
  if (error) raisePg(error as PgError);
  if (!data) throw new CrmValidationError('Document not found.');
  return mapRow(data as unknown as Row);
}

/** Permanent — removes the stored file as well as the row. */
export async function deleteDocument(user: RbacUser, id: string): Promise<void> {
  assertDelete(user);

  const { data } = await supabaseAdmin
    .from(TABLE)
    .select('storage_path')
    .eq('id', id)
    .maybeSingle();
  const path = (data as { storage_path: string | null } | null)?.storage_path;
  if (path) await supabaseAdmin.storage.from(BUCKET).remove([path]);

  const { error } = await supabaseAdmin.from(TABLE).delete().eq('id', id);
  if (error) raisePg(error as PgError);
  await purgeEntity('document', id);
}
