/**
 * Shared HTTP helpers for CRM route handlers: resolve the current user and
 * map CRM errors to responses.
 */
import { NextResponse } from 'next/server';
import { getCurrentRbacUser } from '@/lib/rbac/current-user';
import type { RbacUser } from '@/lib/rbac';
import { CrmForbiddenError, CrmValidationError, CrmTableMissingError } from './access';

export async function requireUser(): Promise<
  { user: RbacUser; response?: undefined } | { user?: undefined; response: NextResponse }
> {
  const user = await getCurrentRbacUser();
  if (!user) {
    return { response: NextResponse.json({ error: 'Authentication required' }, { status: 401 }) };
  }
  return { user };
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
