/**
 * Server-side data access for sig_profiles (user management).
 *
 * Centralizes all reads/writes so routes stay thin and audit logging is
 * consistent. Degrades gracefully when the RBAC migration hasn't been
 * applied yet (throws TableMissingError so callers can return a helpful
 * "provision the database" response instead of a 500).
 *
 * server-only: touches the service-role Supabase client.
 */
import { supabaseAdmin } from '@/lib/supabase';
import { ROLES, INTERNAL_ROLES, isRole, type Role } from './roles';
import { USER_STATUSES, type UserStatus } from './user-statuses';
import { writeAuditLog, AUDIT_ACTIONS } from './audit';

const TABLE = 'sig_profiles';

const COLS =
  'id, auth_user_id, first_name, last_name, display_name, email, phone, mobile_phone, ' +
  'profile_photo_url, role, title, department, bio, calendar_link, timezone, status, ' +
  'extra_permissions, revoked_permissions, assigned_planner_id, assigned_servicing_advisor_id, ' +
  'household_id, client_id, contact_id, lead_id, prospect_id, is_internal_user, is_external_user, ' +
  'can_login, created_by, created_at, updated_at, last_login_at';

const UUID_RE = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

export function isUuid(v: string | null | undefined): v is string {
  return !!v && UUID_RE.test(v);
}

/** Thrown when sig_profiles doesn't exist yet (migration not applied). */
export class TableMissingError extends Error {
  constructor() {
    super('sig_profiles table is not provisioned. Apply the RBAC migration.');
    this.name = 'TableMissingError';
  }
}

/** Thrown on validation problems (surface as 400). */
export class ProfileValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ProfileValidationError';
  }
}

interface PgError {
  code?: string;
  message?: string;
}

function isUndefinedTable(err: PgError | null): boolean {
  if (!err) return false;
  return err.code === '42P01' || /relation .* does not exist/i.test(err.message ?? '');
}

function raise(err: PgError | null): never {
  if (isUndefinedTable(err)) throw new TableMissingError();
  throw new Error(err?.message ?? 'Supabase query failed');
}

export interface ProfileRow {
  id: string;
  authUserId: string | null;
  firstName: string | null;
  lastName: string | null;
  displayName: string | null;
  email: string;
  phone: string | null;
  mobilePhone: string | null;
  profilePhotoUrl: string | null;
  role: Role;
  title: string | null;
  department: string | null;
  bio: string | null;
  calendarLink: string | null;
  timezone: string | null;
  status: UserStatus;
  extraPermissions: string[];
  revokedPermissions: string[];
  assignedPlannerId: string | null;
  assignedServicingAdvisorId: string | null;
  householdId: string | null;
  clientId: string | null;
  contactId: string | null;
  leadId: string | null;
  prospectId: string | null;
  isInternalUser: boolean;
  isExternalUser: boolean;
  canLogin: boolean;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
}

type Row = Record<string, unknown>;

function mapRow(r: Row): ProfileRow {
  const role = isRole(r.role) ? (r.role as Role) : ROLES.SUPPORT_OPERATIONS;
  return {
    id: String(r.id),
    authUserId: (r.auth_user_id as string) ?? null,
    firstName: (r.first_name as string) ?? null,
    lastName: (r.last_name as string) ?? null,
    displayName: (r.display_name as string) ?? null,
    email: String(r.email ?? ''),
    phone: (r.phone as string) ?? null,
    mobilePhone: (r.mobile_phone as string) ?? null,
    profilePhotoUrl: (r.profile_photo_url as string) ?? null,
    role,
    title: (r.title as string) ?? null,
    department: (r.department as string) ?? null,
    bio: (r.bio as string) ?? null,
    calendarLink: (r.calendar_link as string) ?? null,
    timezone: (r.timezone as string) ?? null,
    status: (r.status as UserStatus) ?? USER_STATUSES.INVITED,
    extraPermissions: (r.extra_permissions as string[]) ?? [],
    revokedPermissions: (r.revoked_permissions as string[]) ?? [],
    assignedPlannerId: (r.assigned_planner_id as string) ?? null,
    assignedServicingAdvisorId: (r.assigned_servicing_advisor_id as string) ?? null,
    householdId: (r.household_id as string) ?? null,
    clientId: (r.client_id as string) ?? null,
    contactId: (r.contact_id as string) ?? null,
    leadId: (r.lead_id as string) ?? null,
    prospectId: (r.prospect_id as string) ?? null,
    isInternalUser: Boolean(r.is_internal_user),
    isExternalUser: Boolean(r.is_external_user),
    canLogin: Boolean(r.can_login),
    createdBy: (r.created_by as string) ?? null,
    createdAt: String(r.created_at ?? ''),
    updatedAt: String(r.updated_at ?? ''),
    lastLoginAt: (r.last_login_at as string) ?? null,
  };
}

export interface Actor {
  id: string;
  email: string;
}

/** Audit-safe actor id: only a real profile uuid, never the legacy sentinel. */
function actorId(actor: Actor): string | null {
  return isUuid(actor.id) ? actor.id : null;
}

// ─── Reads ──────────────────────────────────────────────────
export async function listProfiles(): Promise<ProfileRow[]> {
  const { data, error } = await supabaseAdmin
    .from(TABLE)
    .select(COLS)
    .order('created_at', { ascending: true });
  if (error) raise(error);
  return ((data ?? []) as unknown as Row[]).map(mapRow);
}

export async function getProfile(id: string): Promise<ProfileRow | null> {
  const { data, error } = await supabaseAdmin.from(TABLE).select(COLS).eq('id', id).maybeSingle();
  if (error) raise(error);
  return data ? mapRow(data as unknown as Row) : null;
}

// ─── Writes ─────────────────────────────────────────────────
export interface CreateProfileInput {
  email: string;
  role: Role;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  title?: string;
  phone?: string;
  status?: UserStatus;
}

function splitNameFromEmail(email: string): { first: string; last: string } {
  const local = email.split('@')[0] ?? '';
  const parts = local.split(/[._-]+/).filter(Boolean);
  return { first: parts[0] ?? local, last: parts.slice(1).join(' ') };
}

/**
 * Create a user profile. `mode: 'invite'` sets status=invited (default);
 * `mode: 'manual'` sets status=active unless a status is supplied.
 */
export async function createProfile(
  input: CreateProfileInput,
  actor: Actor,
  mode: 'invite' | 'manual' = 'invite',
): Promise<ProfileRow> {
  const email = input.email?.trim().toLowerCase();
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    throw new ProfileValidationError('A valid email address is required.');
  }
  if (!isRole(input.role)) {
    throw new ProfileValidationError('A valid role is required.');
  }

  const fallback = splitNameFromEmail(email);
  const isInternal = (INTERNAL_ROLES as readonly Role[]).includes(input.role);
  const status =
    input.status ?? (mode === 'invite' ? USER_STATUSES.INVITED : USER_STATUSES.ACTIVE);

  const insert = {
    email,
    role: input.role,
    first_name: input.firstName?.trim() || fallback.first,
    last_name: input.lastName?.trim() || fallback.last,
    display_name:
      input.displayName?.trim() ||
      `${input.firstName?.trim() || fallback.first} ${input.lastName?.trim() || fallback.last}`.trim(),
    title: input.title?.trim() || null,
    phone: input.phone?.trim() || null,
    status,
    is_internal_user: isInternal,
    is_external_user: !isInternal,
    can_login: true,
    created_by: actorId(actor),
  };

  const { data, error } = await supabaseAdmin.from(TABLE).insert(insert).select(COLS).single();
  if (error) {
    if (error.code === '23505') {
      throw new ProfileValidationError('A user with that email already exists.');
    }
    raise(error);
  }
  const row = mapRow(data as unknown as Row);

  await writeAuditLog({
    actorUserId: actorId(actor),
    targetUserId: row.id,
    action: mode === 'invite' ? AUDIT_ACTIONS.USER_INVITED : 'user.created',
    entityType: 'sig_profiles',
    entityId: row.id,
    newValue: { email: row.email, role: row.role, status: row.status },
    metadata: { actorEmail: actor.email, mode },
  });

  return row;
}

export interface UpdateProfileInput {
  role?: Role;
  status?: UserStatus;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  title?: string;
  phone?: string;
  mobilePhone?: string;
  department?: string;
  bio?: string;
  calendarLink?: string;
  timezone?: string;
  profilePhotoUrl?: string;
  extraPermissions?: string[];
  revokedPermissions?: string[];
}

/**
 * Update a profile, writing dedicated audit entries for role and status
 * changes (the events the spec specifically requires logging).
 */
export async function updateProfile(
  id: string,
  patch: UpdateProfileInput,
  actor: Actor,
): Promise<ProfileRow> {
  const before = await getProfile(id);
  if (!before) throw new ProfileValidationError('User not found.');

  if (patch.role !== undefined && !isRole(patch.role)) {
    throw new ProfileValidationError('Invalid role.');
  }

  const update: Row = {};
  if (patch.role !== undefined) {
    update.role = patch.role;
    const isInternal = (INTERNAL_ROLES as readonly Role[]).includes(patch.role);
    update.is_internal_user = isInternal;
    update.is_external_user = !isInternal;
  }
  if (patch.status !== undefined) update.status = patch.status;
  if (patch.firstName !== undefined) update.first_name = patch.firstName.trim();
  if (patch.lastName !== undefined) update.last_name = patch.lastName.trim();
  if (patch.displayName !== undefined) update.display_name = patch.displayName.trim();
  if (patch.title !== undefined) update.title = patch.title.trim() || null;
  if (patch.phone !== undefined) update.phone = patch.phone.trim() || null;
  if (patch.mobilePhone !== undefined) update.mobile_phone = patch.mobilePhone.trim() || null;
  if (patch.department !== undefined) update.department = patch.department.trim() || null;
  if (patch.bio !== undefined) update.bio = patch.bio.trim() || null;
  if (patch.calendarLink !== undefined) update.calendar_link = patch.calendarLink.trim() || null;
  if (patch.timezone !== undefined) update.timezone = patch.timezone.trim() || null;
  if (patch.profilePhotoUrl !== undefined) update.profile_photo_url = patch.profilePhotoUrl || null;
  if (patch.extraPermissions !== undefined) update.extra_permissions = patch.extraPermissions;
  if (patch.revokedPermissions !== undefined) update.revoked_permissions = patch.revokedPermissions;

  if (Object.keys(update).length === 0) return before;

  const { data, error } = await supabaseAdmin
    .from(TABLE)
    .update(update)
    .eq('id', id)
    .select(COLS)
    .single();
  if (error) raise(error);
  const after = mapRow(data as unknown as Row);

  const aId = actorId(actor);
  if (patch.role !== undefined && patch.role !== before.role) {
    await writeAuditLog({
      actorUserId: aId,
      targetUserId: id,
      action: AUDIT_ACTIONS.USER_ROLE_CHANGED,
      entityType: 'sig_profiles',
      entityId: id,
      oldValue: { role: before.role },
      newValue: { role: after.role },
      metadata: { actorEmail: actor.email },
    });
  }
  if (patch.status !== undefined && patch.status !== before.status) {
    const action =
      after.status === USER_STATUSES.SUSPENDED
        ? AUDIT_ACTIONS.USER_SUSPENDED
        : after.status === USER_STATUSES.ARCHIVED
          ? AUDIT_ACTIONS.USER_ARCHIVED
          : AUDIT_ACTIONS.USER_STATUS_CHANGED;
    await writeAuditLog({
      actorUserId: aId,
      targetUserId: id,
      action,
      entityType: 'sig_profiles',
      entityId: id,
      oldValue: { status: before.status },
      newValue: { status: after.status },
      metadata: { actorEmail: actor.email },
    });
  }
  if (patch.profilePhotoUrl !== undefined && patch.profilePhotoUrl !== before.profilePhotoUrl) {
    await writeAuditLog({
      actorUserId: aId,
      targetUserId: id,
      action: AUDIT_ACTIONS.USER_PHOTO_CHANGED,
      entityType: 'sig_profiles',
      entityId: id,
      metadata: { actorEmail: actor.email },
    });
  }
  if (
    (patch.extraPermissions !== undefined || patch.revokedPermissions !== undefined)
  ) {
    await writeAuditLog({
      actorUserId: aId,
      targetUserId: id,
      action: AUDIT_ACTIONS.USER_PERMISSIONS_CHANGED,
      entityType: 'sig_profiles',
      entityId: id,
      oldValue: {
        extra: before.extraPermissions,
        revoked: before.revokedPermissions,
      },
      newValue: { extra: after.extraPermissions, revoked: after.revokedPermissions },
      metadata: { actorEmail: actor.email },
    });
  }

  return after;
}

/** Archive (soft delete) — preferred over hard delete for compliance. */
export async function archiveProfile(id: string, actor: Actor): Promise<ProfileRow> {
  return updateProfile(id, { status: USER_STATUSES.ARCHIVED }, actor);
}

/** Reset/resend an invite: bump status back to invited. */
export async function resetInvite(id: string, actor: Actor): Promise<ProfileRow> {
  const row = await updateProfile(id, { status: USER_STATUSES.INVITED }, actor);
  await writeAuditLog({
    actorUserId: actorId(actor),
    targetUserId: id,
    action: 'user.invite_reset',
    entityType: 'sig_profiles',
    entityId: id,
    metadata: { actorEmail: actor.email },
  });
  return row;
}

// ─── Self-profile (current user) ────────────────────────────
export async function getProfileByEmail(email: string): Promise<ProfileRow | null> {
  const { data, error } = await supabaseAdmin
    .from(TABLE)
    .select(COLS)
    .ilike('email', email)
    .maybeSingle();
  if (error) raise(error);
  return data ? mapRow(data as unknown as Row) : null;
}

/**
 * Ensure a profile row exists for the current session's email. Used by
 * /api/me so the legacy admin (and, later, any authenticated user) always
 * has a real row to view/edit. The legacy admin is seeded as an active
 * super_admin — this doubles as the "seed the first super_admin" step.
 */
export async function ensureSelfProfile(
  email: string,
  opts: { role?: Role; displayName?: string } = {},
): Promise<ProfileRow> {
  const existing = await getProfileByEmail(email);
  if (existing) return existing;

  const clean = email.trim().toLowerCase();
  const fallback = splitNameFromEmail(clean);
  // Safety: only the configured env admin may be auto-seeded as super_admin.
  // Any other self-provision defaults to the least-privileged internal role.
  const adminEmail = (process.env.SIG360_ADMIN_EMAIL || '').trim().toLowerCase();
  const requested = opts.role ?? ROLES.SUPER_ADMIN;
  const role =
    requested === ROLES.SUPER_ADMIN && clean !== adminEmail ? ROLES.SUPPORT_OPERATIONS : requested;
  const isInternal = (INTERNAL_ROLES as readonly Role[]).includes(role);
  const insert = {
    email: clean,
    role,
    status: USER_STATUSES.ACTIVE,
    first_name: fallback.first,
    last_name: fallback.last,
    display_name: opts.displayName?.trim() || `${fallback.first} ${fallback.last}`.trim() || clean,
    is_internal_user: isInternal,
    is_external_user: !isInternal,
    can_login: true,
  };
  const { data, error } = await supabaseAdmin.from(TABLE).insert(insert).select(COLS).single();
  if (error) {
    // Race: another request created it first — re-read.
    if (error.code === '23505') {
      const again = await getProfileByEmail(clean);
      if (again) return again;
    }
    raise(error);
  }
  return mapRow(data as unknown as Row);
}

// ─── Invitations (Supabase Auth link + Resend email) ────────
interface GenerateLinkResult {
  actionUrl: string | null;
  authUserId: string | null;
}

/**
 * Generate a Supabase Auth action link for a user. Tries an invite link
 * first (creates the auth user if new); if the user already exists, falls
 * back to a recovery link so resends still work.
 */
async function generateAuthLink(email: string): Promise<GenerateLinkResult> {
  const { appUrl } = await import('@/lib/email');
  const redirectTo = `${appUrl()}/accept-invite`;
  const admin = supabaseAdmin.auth.admin as unknown as {
    generateLink: (args: unknown) => Promise<{ data: unknown; error: unknown }>;
  };

  async function tryType(type: 'invite' | 'recovery') {
    const { data, error } = await admin.generateLink({ type, email, options: { redirectTo } });
    if (error) return null;
    const d = data as { properties?: { action_link?: string }; user?: { id?: string } };
    return {
      actionUrl: d.properties?.action_link ?? null,
      authUserId: d.user?.id ?? null,
    } as GenerateLinkResult;
  }

  return (await tryType('invite')) ?? (await tryType('recovery')) ?? { actionUrl: null, authUserId: null };
}

export interface InviteResult {
  emailSent: boolean;
  error?: string;
  hasLink: boolean;
}

/**
 * Send (or resend) an invitation for an existing profile: generate the
 * Supabase auth link, persist auth_user_id, and email a branded link via
 * Resend. Non-fatal — returns status so the caller can surface warnings.
 */
export async function sendInvite(profile: ProfileRow, inviterName?: string): Promise<InviteResult> {
  const { sendEmail, inviteEmailHtml, isEmailConfigured } = await import('@/lib/email');
  const { ROLE_LABELS } = await import('./role-labels');

  const link = await generateAuthLink(profile.email);

  if (link.authUserId && link.authUserId !== profile.authUserId) {
    await supabaseAdmin.from(TABLE).update({ auth_user_id: link.authUserId }).eq('id', profile.id);
  }

  if (!link.actionUrl) {
    return { emailSent: false, hasLink: false, error: 'Could not generate an invite link (check Supabase Auth config).' };
  }
  if (!isEmailConfigured()) {
    return { emailSent: false, hasLink: true, error: 'RESEND_API_KEY not configured.' };
  }

  const name =
    profile.displayName ||
    `${profile.firstName ?? ''} ${profile.lastName ?? ''}`.trim() ||
    undefined;

  const res = await sendEmail({
    to: profile.email,
    subject: 'You have been invited to SIG360',
    html: inviteEmailHtml({
      inviteeName: name,
      roleLabel: ROLE_LABELS[profile.role] ?? profile.role,
      actionUrl: link.actionUrl,
      inviterName,
    }),
    text: `You've been invited to SIG360 as ${ROLE_LABELS[profile.role] ?? profile.role}. Accept: ${link.actionUrl}`,
  });

  return { emailSent: res.sent, hasLink: true, error: res.error };
}

// ─── Profile photo upload ───────────────────────────────────
const PHOTO_BUCKET = 'profile-photos';

export interface UploadPhotoInput {
  bytes: Uint8Array | ArrayBuffer;
  contentType: string;
  ext: string;
}

/** Upload an avatar to Storage and set profile_photo_url (audited). */
export async function uploadProfilePhoto(
  id: string,
  file: UploadPhotoInput,
  actor: Actor,
): Promise<ProfileRow> {
  const existing = await getProfile(id);
  if (!existing) throw new ProfileValidationError('User not found.');

  const safeExt = (file.ext || 'png').replace(/[^a-z0-9]/gi, '').toLowerCase() || 'png';
  const path = `${id}/avatar.${safeExt}`;
  const body = file.bytes instanceof Uint8Array ? file.bytes : new Uint8Array(file.bytes);

  const { error: upErr } = await supabaseAdmin.storage
    .from(PHOTO_BUCKET)
    .upload(path, body, { contentType: file.contentType, upsert: true });
  if (upErr) {
    if (/bucket not found/i.test(upErr.message)) {
      throw new TableMissingError();
    }
    throw new Error(upErr.message);
  }

  const { data: pub } = supabaseAdmin.storage.from(PHOTO_BUCKET).getPublicUrl(path);
  // Cache-bust so the replaced image (same path, upsert) shows immediately.
  const url = `${pub.publicUrl}?v=${Date.now()}`;

  return updateProfile(id, { profilePhotoUrl: url }, actor);
}
