/**
 * Shared HTTP helpers for CRM route handlers: resolve the current user and
 * map CRM errors to responses.
 */
import { NextResponse } from 'next/server';
import { getCurrentRbacUser, getSessionIdentity } from '@/lib/rbac/current-user';
import type { RbacUser } from '@/lib/rbac';
import { CrmForbiddenError, CrmValidationError, CrmTableMissingError } from './access';

export async function requireUser(): Promise<
  { user: RbacUser; response?: undefined } | { user?: undefined; response: NextResponse }
> {
  const user = await getCurrentRbacUser();
  if (user) return { user };

  // Signed in but unresolvable is an authorization problem, not an auth one —
  // reporting it as 401 sends people to re-login, which never fixes it.
  const identity = await getSessionIdentity();
  if (identity) {
    return {
      response: NextResponse.json(
        {
          error:
            `Signed in as ${identity.email}, but no active profile is linked to this account. ` +
            'Check that the account has an active sig_profiles row and that the server has ' +
            'SUPABASE_SERVICE_ROLE_KEY set.',
        },
        { status: 403 },
      ),
    };
  }
  return { response: NextResponse.json({ error: 'Authentication required' }, { status: 401 }) };
}

export function crmError(err: unknown): NextResponse {
  if (err instanceof CrmForbiddenError) {
    return NextResponse.json({ error: err.message }, { status: 403 });
  }
  if (err instanceof CrmValidationError) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
  if (err instanceof CrmTableMissingError) {
    return NextResponse.json({ provisioned: false, error: err.message }, { status: 200 });
  }
  return NextResponse.json({ error: (err as Error).message }, { status: 500 });
}
