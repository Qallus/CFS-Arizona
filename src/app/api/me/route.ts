import { NextRequest, NextResponse } from 'next/server';
import { getSessionIdentity } from '@/lib/rbac/current-user';
import { ROLES, getEffectivePermissions } from '@/lib/rbac';
import {
  ensureSelfProfile,
  getProfileByEmail,
  updateProfile,
  TableMissingError,
  ProfileValidationError,
  type ProfileRow,
  type UpdateProfileInput,
} from '@/lib/rbac/profiles';

/** Effective permission list for the client (role defaults ± overrides). */
function permissionsFor(profile: ProfileRow): string[] {
  return [
    ...getEffectivePermissions({
      role: profile.role,
      extraPermissions: profile.extraPermissions,
      revokedPermissions: profile.revokedPermissions,
    }),
  ];
}

// Fields a user is allowed to change on their OWN profile (never role/status).
const SELF_EDITABLE: (keyof UpdateProfileInput)[] = [
  'firstName',
  'lastName',
  'displayName',
  'title',
  'department',
  'phone',
  'mobilePhone',
  'bio',
  'calendarLink',
  'timezone',
];

/** GET /api/me — current user's profile (auto-provisions the row if missing). */
export async function GET() {
  const identity = await getSessionIdentity();
  if (!identity) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }
  try {
    if (identity.source === 'legacy') {
      // Legacy admin: auto-provision (seeds the first super_admin).
      const profile = await ensureSelfProfile(identity.email, {
        displayName: identity.name,
        role: ROLES.SUPER_ADMIN,
      });
      return NextResponse.json({ provisioned: true, profile, permissions: permissionsFor(profile) });
    }
    // Supabase-authenticated user: must already have a linked profile.
    const profile = await getProfileByEmail(identity.email);
    if (!profile) {
      return NextResponse.json(
        { provisioned: true, profile: null, permissions: [], error: 'No SIG360 profile is linked to this account.' },
        { status: 200 },
      );
    }
    return NextResponse.json({ provisioned: true, profile, permissions: permissionsFor(profile) });
  } catch (err) {
    if (err instanceof TableMissingError) {
      return NextResponse.json({ provisioned: false, profile: null, error: err.message }, { status: 200 });
    }
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

/** PATCH /api/me — update your own profile (safe fields only). */
export async function PATCH(req: NextRequest) {
  const identity = await getSessionIdentity();
  if (!identity) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const patch: UpdateProfileInput = {};
  for (const key of SELF_EDITABLE) {
    if (typeof body[key] === 'string') (patch[key] as string) = body[key] as string;
  }

  try {
    const me = await getProfileByEmail(identity.email);
    if (!me) return NextResponse.json({ error: 'Profile not found.' }, { status: 404 });
    const profile = await updateProfile(me.id, patch, { id: me.id, email: me.email });
    return NextResponse.json({ profile });
  } catch (err) {
    if (err instanceof TableMissingError) {
      return NextResponse.json({ error: err.message }, { status: 503 });
    }
    if (err instanceof ProfileValidationError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
