import { NextRequest, NextResponse } from 'next/server';
import { guardPermission } from '@/lib/rbac/route-guards';
import { PERMISSIONS } from '@/lib/rbac';
import {
  listProfiles,
  createProfile,
  sendInvite,
  TableMissingError,
  ProfileValidationError,
  type CreateProfileInput,
} from '@/lib/rbac/profiles';

/** GET /api/users — list all user profiles (requires users.view). */
export async function GET() {
  const gate = await guardPermission(PERMISSIONS.USERS_VIEW);
  if (gate.response) return gate.response;

  try {
    const users = await listProfiles();
    return NextResponse.json({ provisioned: true, users });
  } catch (err) {
    if (err instanceof TableMissingError) {
      return NextResponse.json({ provisioned: false, users: [], error: err.message }, { status: 200 });
    }
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

/**
 * POST /api/users — invite (default) or manually add a user.
 * Body: { email, role, firstName?, lastName?, title?, phone?, mode?: 'invite'|'manual' }
 */
export async function POST(req: NextRequest) {
  const mode = ((await req.clone().json().catch(() => ({}))) as { mode?: string }).mode;
  const perm = mode === 'manual' ? PERMISSIONS.USERS_ADD : PERMISSIONS.USERS_INVITE;
  const gate = await guardPermission(perm);
  if (gate.response) return gate.response;

  let body: (CreateProfileInput & { mode?: 'invite' | 'manual' }) | null = null;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }
  if (!body) return NextResponse.json({ error: 'Missing body.' }, { status: 400 });

  try {
    const isInvite = body.mode !== 'manual';
    const user = await createProfile(
      body,
      { id: gate.user.id, email: gate.user.email },
      isInvite ? 'invite' : 'manual',
    );
    let invite: Awaited<ReturnType<typeof sendInvite>> | undefined;
    if (isInvite) {
      invite = await sendInvite(user, gate.user.email);
    }
    return NextResponse.json({ user, invite }, { status: 201 });
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
