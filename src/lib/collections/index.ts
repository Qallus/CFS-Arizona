/**
 * Generic per-record extras: favorites, shares and attachments.
 *
 * Keyed by (entity_type, entity_id) so every dashboard page reuses these three
 * tables instead of growing its own. `entity_type` is the page's record kind —
 * 'matter', 'client', 'document', and so on.
 *
 * server-only.
 */
import { supabaseAdmin } from '@/lib/supabase';
import type { RbacUser } from '@/lib/rbac';
import { PERMISSIONS, hasPermission } from '@/lib/rbac';
import { raisePg, CrmForbiddenError, CrmValidationError, type PgError } from '@/lib/crm/access';

export const ENTITY_TYPES = [
  'matter',
  'client',
  'care_plan',
  'care_team',
  'invoice',
  'ledger_entry',
  'court_accounting',
  'document',
  'note',
  'referral',
] as const;
export type EntityType = (typeof ENTITY_TYPES)[number];

export function assertEntityType(value: string): EntityType {
  if (!(ENTITY_TYPES as readonly string[]).includes(value)) {
    throw new CrmValidationError(`Unknown record type: ${value}`);
  }
  return value as EntityType;
}

/* ------------------------------- Favorites ------------------------------- */
// Personal, never shared: a favorite is one user's bookmark.

export async function listFavoriteIds(user: RbacUser, entityType: EntityType): Promise<string[]> {
  const { data, error } = await supabaseAdmin
    .from('sig_favorites')
    .select('entity_id')
    .eq('profile_id', user.id)
    .eq('entity_type', entityType);
  if (error) raisePg(error as PgError);
  return (data as { entity_id: string }[]).map((r) => r.entity_id);
}

export async function setFavorite(
  user: RbacUser,
  entityType: EntityType,
  entityId: string,
  favorite: boolean,
): Promise<void> {
  if (favorite) {
    const { error } = await supabaseAdmin
      .from('sig_favorites')
      .upsert(
        { profile_id: user.id, entity_type: entityType, entity_id: entityId },
        { onConflict: 'profile_id,entity_type,entity_id' },
      );
    if (error) raisePg(error as PgError);
    return;
  }
  const { error } = await supabaseAdmin
    .from('sig_favorites')
    .delete()
    .eq('profile_id', user.id)
    .eq('entity_type', entityType)
    .eq('entity_id', entityId);
  if (error) raisePg(error as PgError);
}

/* --------------------------------- Shares -------------------------------- */
// Internal only. Sharing grants a named teammate access to one record; it
// never mints a public link, because these records concern vulnerable adults.

export interface ShareRecord {
  id: string;
  entityType: string;
  entityId: string;
  sharedWithProfileId: string;
  sharedByProfileId: string | null;
  permission: 'view' | 'edit';
  note: string | null;
  createdAt: string;
}

interface ShareRow {
  id: string;
  entity_type: string;
  entity_id: string;
  shared_with_profile_id: string;
  shared_by_profile_id: string | null;
  permission: string;
  note: string | null;
  created_at: string;
}

const SHARE_COLS =
  'id, entity_type, entity_id, shared_with_profile_id, shared_by_profile_id, permission, note, created_at';

function mapShare(r: ShareRow): ShareRecord {
  return {
    id: r.id,
    entityType: r.entity_type,
    entityId: r.entity_id,
    sharedWithProfileId: r.shared_with_profile_id,
    sharedByProfileId: r.shared_by_profile_id,
    permission: r.permission === 'edit' ? 'edit' : 'view',
    note: r.note,
    createdAt: r.created_at,
  };
}

export async function listShares(entityType: EntityType, entityId: string): Promise<ShareRecord[]> {
  const { data, error } = await supabaseAdmin
    .from('sig_shares')
    .select(SHARE_COLS)
    .eq('entity_type', entityType)
    .eq('entity_id', entityId);
  if (error) raisePg(error as PgError);
  return (data as unknown as ShareRow[]).map(mapShare);
}

export async function shareWith(
  user: RbacUser,
  entityType: EntityType,
  entityId: string,
  sharedWithProfileId: string,
  permission: 'view' | 'edit' = 'view',
  note?: string,
): Promise<ShareRecord> {
  if (sharedWithProfileId === user.id) {
    throw new CrmValidationError('That record is already yours.');
  }
  const { data, error } = await supabaseAdmin
    .from('sig_shares')
    .upsert(
      {
        entity_type: entityType,
        entity_id: entityId,
        shared_with_profile_id: sharedWithProfileId,
        shared_by_profile_id: user.id,
        permission,
        note: note ?? null,
      },
      { onConflict: 'entity_type,entity_id,shared_with_profile_id' },
    )
    .select(SHARE_COLS)
    .single();
  if (error) raisePg(error as PgError);
  return mapShare(data as unknown as ShareRow);
}

export async function unshare(shareId: string): Promise<void> {
  const { error } = await supabaseAdmin.from('sig_shares').delete().eq('id', shareId);
  if (error) raisePg(error as PgError);
}

/* ------------------------------ Attachments ------------------------------ */

const BUCKET = 'attachments';
/** Signed-URL lifetime. Short: these links are handed to a browser. */
const SIGNED_URL_TTL_SECONDS = 60 * 10;
export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

export interface AttachmentRecord {
  id: string;
  entityType: string;
  entityId: string;
  fileName: string;
  storagePath: string;
  mimeType: string | null;
  sizeBytes: number | null;
  uploadedBy: string | null;
  createdAt: string;
  /** Short-lived signed URL, minted per request. Never stored. */
  url?: string;
}

interface AttachmentRow {
  id: string;
  entity_type: string;
  entity_id: string;
  file_name: string;
  storage_path: string;
  mime_type: string | null;
  size_bytes: number | null;
  uploaded_by: string | null;
  created_at: string;
}

const ATTACHMENT_COLS =
  'id, entity_type, entity_id, file_name, storage_path, mime_type, size_bytes, uploaded_by, created_at';

function mapAttachment(r: AttachmentRow): AttachmentRecord {
  return {
    id: r.id,
    entityType: r.entity_type,
    entityId: r.entity_id,
    fileName: r.file_name,
    storagePath: r.storage_path,
    mimeType: r.mime_type,
    sizeBytes: r.size_bytes,
    uploadedBy: r.uploaded_by,
    createdAt: r.created_at,
  };
}

/** Strip anything that could escape the entity's folder. */
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

export async function listAttachments(
  user: RbacUser,
  entityType: EntityType,
  entityId: string,
): Promise<AttachmentRecord[]> {
  if (!hasPermission(user, PERMISSIONS.DOCUMENTS_VIEW)) {
    throw new CrmForbiddenError('You cannot view documents.');
  }
  const { data, error } = await supabaseAdmin
    .from('sig_attachments')
    .select(ATTACHMENT_COLS)
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
    .order('created_at', { ascending: false });
  if (error) raisePg(error as PgError);

  const rows = (data as unknown as AttachmentRow[]).map(mapAttachment);

  // The bucket is private, so hand back short-lived signed URLs rather than
  // object paths the browser could not fetch anyway.
  await Promise.all(
    rows.map(async (row) => {
      const { data: signed } = await supabaseAdmin.storage
        .from(BUCKET)
        .createSignedUrl(row.storagePath, SIGNED_URL_TTL_SECONDS);
      row.url = signed?.signedUrl;
    }),
  );
  return rows;
}

export async function uploadAttachment(
  user: RbacUser,
  entityType: EntityType,
  entityId: string,
  file: File,
): Promise<AttachmentRecord> {
  if (!hasPermission(user, PERMISSIONS.DOCUMENTS_UPLOAD)) {
    throw new CrmForbiddenError('You cannot upload documents.');
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new CrmValidationError(
      `That file is ${(file.size / 1024 / 1024).toFixed(1)} MB. The limit is ${MAX_UPLOAD_BYTES / 1024 / 1024} MB.`,
    );
  }

  const clean = safeFileName(file.name);
  // Prefix with a random segment so two uploads of "scan.pdf" coexist.
  const path = `${entityType}/${entityId}/${crypto.randomUUID()}-${clean}`;

  const { error: upErr } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type || 'application/octet-stream', upsert: false });
  if (upErr) {
    throw new Error(
      /bucket/i.test(upErr.message)
        ? `Storage bucket "${BUCKET}" is missing. Apply the matters migration.`
        : upErr.message,
    );
  }

  const { data, error } = await supabaseAdmin
    .from('sig_attachments')
    .insert({
      entity_type: entityType,
      entity_id: entityId,
      file_name: clean,
      storage_path: path,
      mime_type: file.type || null,
      size_bytes: file.size,
      uploaded_by: user.id,
    })
    .select(ATTACHMENT_COLS)
    .single();

  if (error) {
    // Do not leave the object orphaned in the bucket if the row failed.
    await supabaseAdmin.storage.from(BUCKET).remove([path]);
    raisePg(error as PgError);
  }
  return mapAttachment(data as unknown as AttachmentRow);
}

/**
 * Delete every favorite, share and attachment belonging to a record.
 *
 * These tables key on (entity_type, entity_id) rather than a foreign key — the
 * price of making them generic — so Postgres cannot cascade on our behalf.
 * Every hard delete has to call this.
 *
 * The storage objects matter most: without this, deleting a matter leaves its
 * court filings and medical records sitting in the bucket indefinitely, long
 * after the record they belong to is gone.
 *
 * Called after the parent row is already deleted, so it takes no permission
 * argument — the caller has established the right to destroy the record.
 */
export async function purgeEntity(entityType: EntityType, entityId: string): Promise<void> {
  const { data } = await supabaseAdmin
    .from('sig_attachments')
    .select('storage_path')
    .eq('entity_type', entityType)
    .eq('entity_id', entityId);

  const paths = ((data ?? []) as { storage_path: string }[]).map((r) => r.storage_path);
  if (paths.length > 0) {
    await supabaseAdmin.storage.from(BUCKET).remove(paths);
  }

  for (const table of ['sig_attachments', 'sig_favorites', 'sig_shares'] as const) {
    // sig_favorites has no entity row of its own to guard; matching on the
    // pair is enough for all three.
    await supabaseAdmin.from(table).delete().eq('entity_type', entityType).eq('entity_id', entityId);
  }
}

export async function deleteAttachment(user: RbacUser, attachmentId: string): Promise<void> {
  if (!hasPermission(user, PERMISSIONS.DOCUMENTS_DELETE)) {
    throw new CrmForbiddenError('You cannot delete documents.');
  }
  const { data, error } = await supabaseAdmin
    .from('sig_attachments')
    .select('storage_path')
    .eq('id', attachmentId)
    .maybeSingle();
  if (error) raisePg(error as PgError);
  if (!data) return;

  await supabaseAdmin.storage.from(BUCKET).remove([(data as { storage_path: string }).storage_path]);
  const { error: delErr } = await supabaseAdmin.from('sig_attachments').delete().eq('id', attachmentId);
  if (delErr) raisePg(delErr as PgError);
}
