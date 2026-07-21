/**
 * GET /api/health/config — runtime configuration health.
 *
 * Exists because the failure it detects is otherwise invisible: when
 * SUPABASE_SERVICE_ROLE_KEY is missing, `supabaseAdmin` silently degrades to
 * the anon client, RLS-protected reads return an EMPTY list with HTTP 200, and
 * a fully provisioned user looks unauthenticated. Every symptom points at
 * broken auth; the cause is a missing environment variable.
 *
 * Reports booleans and a project ref only — never key material. Sits behind
 * the middleware auth gate, so only a signed-in user can reach it.
 */
import { NextResponse } from 'next/server';
import { supabaseAdmin, hasServiceRoleKey } from '@/lib/supabase';
import { getSessionIdentity, getCurrentRbacUser } from '@/lib/rbac/current-user';

export const dynamic = 'force-dynamic';

/** Project ref only (`abc123` of `https://abc123.supabase.co`) — not a secret. */
function projectRef(): string | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
  return url.match(/https:\/\/([a-z0-9]+)\.supabase\.co/)?.[1] ?? null;
}

export async function GET() {
  // Can the admin client actually bypass RLS? With the anon key this returns
  // zero rows and NO error, which is precisely the trap.
  let serviceRoleWorks = false;
  let profileReadError: string | null = null;
  try {
    const { error, count } = await supabaseAdmin
      .from('sig_profiles')
      .select('id', { count: 'exact', head: true });
    if (error) profileReadError = error.message;
    else serviceRoleWorks = (count ?? 0) > 0;
  } catch (err) {
    profileReadError = (err as Error).message;
  }

  const identity = await getSessionIdentity();
  const rbacUser = await getCurrentRbacUser();

  const adminEmails = [process.env.SIG360_ADMIN_EMAIL, ...(process.env.CFS_ADMIN_EMAILS || '').split(',')]
    .map((e) => (e || '').trim())
    .filter(Boolean);

  const ok = serviceRoleWorks && Boolean(rbacUser);

  return NextResponse.json({
    ok,
    supabase: {
      projectRef: projectRef(),
      hasServiceRoleKey,
      serviceRoleWorks,
      profileReadError,
    },
    session: {
      email: identity?.email ?? null,
      source: identity?.source ?? null,
    },
    rbac: {
      resolved: Boolean(rbacUser),
      role: rbacUser?.role ?? null,
      status: rbacUser?.status ?? null,
    },
    ownerFallbackEmails: adminEmails.length,
    diagnosis: ok
      ? 'Configuration looks healthy.'
      : !hasServiceRoleKey
        ? 'SUPABASE_SERVICE_ROLE_KEY is not set on the server. Set it and redeploy — ' +
          'without it every RLS-protected read returns empty and writes are rejected.'
        : !serviceRoleWorks
          ? 'SUPABASE_SERVICE_ROLE_KEY is set but is not bypassing RLS — it is probably ' +
            'truncated, or belongs to a different Supabase project than ' + (projectRef() ?? 'this one') + '.'
          : 'Signed-in account has no active sig_profiles row.',
  });
}
