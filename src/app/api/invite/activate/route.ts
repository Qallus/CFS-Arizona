import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getProfileByEmail, updateProfile, TableMissingError } from '@/lib/rbac/profiles';
import { USER_STATUSES } from '@/lib/rbac';
import { writeAuditLog, AUDIT_ACTIONS } from '@/lib/rbac/audit';

/**
 * POST /api/invite/activate — called by the accept-invite page after a user
 * sets their password. Verifies the Supabase access token, links the auth
 * user to the profile, and flips status invited/pending → active.
 *
 * Public route (no dashboard session) — trust is the Supabase JWT, not a cookie.
 */
export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization') || '';
  const token = auth.toLowerCase().startsWith('bearer ') ? auth.slice(7).trim() : '';
  if (!token) {
    return NextResponse.json({ error: 'Missing bearer token.' }, { status: 401 });
  }

  try {
    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !data?.user?.email) {
      return NextResponse.json({ error: 'Invalid or expired token.' }, { status: 401 });
    }
    const authUser = data.user;

    const profile = await getProfileByEmail(authUser.email!);
    if (!profile) {
      return NextResponse.json({ error: 'No matching invitation found.' }, { status: 404 });
    }

    // Link auth user id if not already linked.
    if (profile.authUserId !== authUser.id) {
      await supabaseAdmin.from('sig_profiles').update({ auth_user_id: authUser.id }).eq('id', profile.id);
    }

    const activated = await updateProfile(
      profile.id,
      { status: USER_STATUSES.ACTIVE },
      { id: profile.id, email: profile.email },
    );

    await writeAuditLog({
      actorUserId: profile.id,
      targetUserId: profile.id,
      action: AUDIT_ACTIONS.USER_INVITE_ACCEPTED,
      entityType: 'sig_profiles',
      entityId: profile.id,
      metadata: { email: profile.email },
    });

    return NextResponse.json({ ok: true, status: activated.status });
  } catch (err) {
    if (err instanceof TableMissingError) {
      return NextResponse.json({ error: err.message }, { status: 503 });
    }
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
