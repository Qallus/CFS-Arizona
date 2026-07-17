/**
 * HR access helpers.
 *
 *  - Every employee may see + manage their OWN mileage and documents.
 *  - Staff with `users.view` (Super Admin / HR) may see everyone's.
 *  - Staff with `users.edit` may verify/reject documents and approve mileage.
 *
 * server-only.
 */
import { PERMISSIONS, hasPermission } from '@/lib/rbac';
import type { RbacUser } from '@/lib/rbac';
import { CrmForbiddenError } from '@/lib/crm/access';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** True when the user can see every employee's records. */
export function canViewAllHr(user: RbacUser): boolean {
  return hasPermission(user, PERMISSIONS.USERS_VIEW);
}

/** True when the user can verify documents / approve mileage. */
export function canVerifyHr(user: RbacUser): boolean {
  return hasPermission(user, PERMISSIONS.USERS_EDIT);
}

export function assertCanVerify(user: RbacUser): void {
  if (!canVerifyHr(user)) throw new CrmForbiddenError('You cannot verify employee records.');
}

/**
 * The profile id to attribute records to. The owner fallback user has a
 * non-uuid id; in that case there is no profile row to attach to.
 */
export function ownProfileId(user: RbacUser): string | null {
  return UUID_RE.test(user.id) ? user.id : null;
}

/** Resolve which profile's records a request may read. */
export function resolveScope(user: RbacUser, requestedProfileId?: string | null): { profileId: string | null; all: boolean } {
  if (canViewAllHr(user)) {
    return { profileId: requestedProfileId ?? null, all: !requestedProfileId };
  }
  const own = ownProfileId(user);
  if (!own) throw new CrmForbiddenError('Your staff profile is not provisioned yet.');
  if (requestedProfileId && requestedProfileId !== own) {
    throw new CrmForbiddenError('You can only view your own records.');
  }
  return { profileId: own, all: false };
}
