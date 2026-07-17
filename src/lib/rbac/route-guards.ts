/**
 * Server-side guards for API routes and server actions.
 *
 * Two styles:
 *   - assert* : throw RbacError (catch and map to a response, or let it 500
 *               in a server action). Good for server actions.
 *   - guard*  : return { user } on success or { response } (a NextResponse
 *               with 401/403) on failure. Good for route handlers:
 *
 *       const gate = await guardPermission(PERMISSIONS.USERS_INVITE);
 *       if (gate.response) return gate.response;
 *       const { user } = gate;
 */
import { NextResponse } from 'next/server';
import { getCurrentRbacUser } from './current-user';
import { hasPermission, hasAnyPermission, hasAnyRole } from './access-control';
import type { Permission } from './permissions';
import type { Role } from './roles';
import type { RbacUser } from './types';

export class RbacError extends Error {
  status: 401 | 403;
  constructor(message: string, status: 401 | 403) {
    super(message);
    this.name = 'RbacError';
    this.status = status;
  }
}

type Gate = { user: RbacUser; response?: undefined } | { user?: undefined; response: NextResponse };

function deny(status: 401 | 403, message: string): Gate {
  return { response: NextResponse.json({ error: message }, { status }) };
}

// ─── assert* (throwing) ─────────────────────────────────────
export async function assertUser(): Promise<RbacUser> {
  const user = await getCurrentRbacUser();
  if (!user) throw new RbacError('Authentication required', 401);
  return user;
}

export async function assertPermission(permission: Permission): Promise<RbacUser> {
  const user = await assertUser();
  if (!hasPermission(user, permission)) {
    throw new RbacError(`Missing permission: ${permission}`, 403);
  }
  return user;
}

export async function assertAnyRole(roles: readonly Role[]): Promise<RbacUser> {
  const user = await assertUser();
  if (!hasAnyRole(user, roles)) throw new RbacError('Insufficient role', 403);
  return user;
}

// ─── guard* (response-returning) ────────────────────────────
export async function guardUser(): Promise<Gate> {
  const user = await getCurrentRbacUser();
  if (!user) return deny(401, 'Authentication required');
  return { user };
}

export async function guardPermission(permission: Permission): Promise<Gate> {
  const gate = await guardUser();
  if (gate.response) return gate;
  if (!hasPermission(gate.user, permission)) {
    return deny(403, `Missing permission: ${permission}`);
  }
  return gate;
}

export async function guardAnyPermission(permissions: readonly Permission[]): Promise<Gate> {
  const gate = await guardUser();
  if (gate.response) return gate;
  if (!hasAnyPermission(gate.user, permissions)) {
    return deny(403, 'Missing required permission');
  }
  return gate;
}

export async function guardAnyRole(roles: readonly Role[]): Promise<Gate> {
  const gate = await guardUser();
  if (gate.response) return gate;
  if (!hasAnyRole(gate.user, roles)) return deny(403, 'Insufficient role');
  return gate;
}
