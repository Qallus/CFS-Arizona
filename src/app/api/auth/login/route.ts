import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createSupabaseServerClient, isSupabaseAuthConfigured } from '@/lib/supabase-server';
import { getProfileByEmail } from '@/lib/rbac/profiles';
import { USER_STATUSES } from '@/lib/rbac';

const SESSION_COOKIE = 'sig360_session';
const SESSION_SECRET = process.env.SIG360_SESSION_SECRET || '';
const ADMIN_EMAIL = (process.env.SIG360_ADMIN_EMAIL || '').toLowerCase();
const ADMIN_PASSWORD = process.env.SIG360_ADMIN_PASSWORD || '';

// Statuses that may NOT sign in even with valid credentials.
const BLOCKED_STATUSES: string[] = [
  USER_STATUSES.SUSPENDED,
  USER_STATUSES.INACTIVE,
  USER_STATUSES.ARCHIVED,
  USER_STATUSES.DELETED,
  USER_STATUSES.INVITED,
  USER_STATUSES.PENDING_SETUP,
  USER_STATUSES.PENDING_REVIEW,
];

async function setLegacyAdminCookie() {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, SESSION_SECRET, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
  });
}

export async function POST(req: NextRequest) {
  let email = '';
  let password = '';
  try {
    const body = await req.json();
    email = String(body.email || '').trim();
    password = String(body.password || '');
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid request.' }, { status: 400 });
  }

  // The owner's break-glass account must always be able to reach step 2, so
  // none of the specific step-1 refusals below may short-circuit it.
  const isLegacyAdmin =
    Boolean(SESSION_SECRET && ADMIN_EMAIL) && email.toLowerCase() === ADMIN_EMAIL;

  // ── 1. Supabase Auth (real per-user accounts) ──────────────
  if (isSupabaseAuthConfigured()) {
    try {
      const supabase = await createSupabaseServerClient();
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      // An unconfirmed address is the single most common reason a freshly
      // created account cannot sign in, and it is indistinguishable from a
      // typo'd password unless we say so. Reported before the legacy
      // fallback, which would otherwise bury it under "invalid credentials".
      if (!isLegacyAdmin && error && /email not confirmed/i.test(error.message ?? '')) {
        return NextResponse.json(
          {
            success: false,
            error:
              'This account\'s email address has not been confirmed yet, so it cannot sign in. An administrator can confirm it from the Supabase dashboard.',
          },
          { status: 403 },
        );
      }

      if (!error && data?.user) {
        const profile = await getProfileByEmail(data.user.email || email).catch(() => null);

        // Credentials are only half an account. Without a profile there is no
        // role and no permissions, so every screen would refuse this user —
        // previously they were let through into an app that appeared broken.
        if (!profile && !isLegacyAdmin) {
          await supabase.auth.signOut();
          return NextResponse.json(
            {
              success: false,
              error:
                'This sign-in works, but the account has not been set up in the app yet. An administrator needs to assign a role before it can be used.',
            },
            { status: 403 },
          );
        }

        if (profile && BLOCKED_STATUSES.includes(profile.status)) {
          await supabase.auth.signOut();
          return NextResponse.json(
            { success: false, error: `Account is ${profile.status}. Contact an administrator.` },
            { status: 403 },
          );
        }
        return NextResponse.json({ success: true, via: 'supabase' });
      }
    } catch {
      // fall through to legacy admin
    }
  }

  // ── 2. Legacy single-admin fallback (lockout safety) ───────
  if (SESSION_SECRET && ADMIN_EMAIL && ADMIN_PASSWORD) {
    if (email.toLowerCase() === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      await setLegacyAdminCookie();
      return NextResponse.json({ success: true, via: 'legacy' });
    }
  }

  return NextResponse.json({ success: false, error: 'Invalid email or password' }, { status: 401 });
}
