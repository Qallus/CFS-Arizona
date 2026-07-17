# SIG360 RBAC Foundation

Central role-based access control for SIG360. This is the first stable layer
the rest of user management, the client portal, and compliance build on.

## Files

| File | Purpose | Import from |
|------|---------|-------------|
| `roles.ts` | Role constants, internal/external/advisor groupings, management rank | `@/lib/rbac` (client-safe) |
| `role-labels.ts` | Display labels + descriptions per role | `@/lib/rbac` |
| `user-statuses.ts` | Account status constants + labels | `@/lib/rbac` |
| `permissions.ts` | Fine-grained permission constants | `@/lib/rbac` |
| `role-permissions.ts` | Default role → permission map | `@/lib/rbac` |
| `access-control.ts` | Pure helpers: `hasRole`, `hasPermission`, `canAccessClient`, `canManageUser`, … | `@/lib/rbac` |
| `types.ts` | `RbacUser`, `ClientAssignment` | `@/lib/rbac` |
| `current-user.ts` | **server-only** — resolves session → `RbacUser` | `@/lib/rbac/current-user` |
| `route-guards.ts` | **server-only** — `guard*` / `assert*` for routes & actions | `@/lib/rbac/route-guards` |
| `audit.ts` | **server-only** — `writeAuditLog`, `AUDIT_ACTIONS` | `@/lib/rbac/audit` |

> The `@/lib/rbac` barrel exports only client-safe modules. Server-only helpers
> touch cookies / the service-role Supabase client — import them by explicit path.

## Applying the database schema

The migration `supabase/migrations/20260707000001_rbac_foundation.sql` creates
`sig_profiles`, `sig_client_assignments`, `sig_audit_logs`, the `sig_user_role` /
`sig_user_status` enums, and RLS policies.

```bash
# From the project root, against your SIG360 Supabase project:
supabase link --project-ref <your-sig360-ref>
supabase db push
```

Or paste the SQL into the Supabase SQL editor.

The role/status **values** in the SQL enums mirror `roles.ts` / `user-statuses.ts`.
If you change one, change the other (and add a follow-up migration for the enum).

## Using it

### In an API route
```ts
import { guardPermission } from '@/lib/rbac/route-guards';
import { PERMISSIONS } from '@/lib/rbac';

export async function POST(req: Request) {
  const gate = await guardPermission(PERMISSIONS.USERS_INVITE);
  if (gate.response) return gate.response;      // 401/403 already formed
  const { user } = gate;                        // authorized RbacUser
  // …invite logic…
}
```

### In a server action
```ts
import { assertPermission } from '@/lib/rbac/route-guards';
import { PERMISSIONS } from '@/lib/rbac';

const actor = await assertPermission(PERMISSIONS.USERS_EDIT); // throws RbacError on deny
```

### Record-scoped access
```ts
import { canAccessClient } from '@/lib/rbac';
// assignments loaded from sig_client_assignments for this user
if (!canAccessClient(user, { clientId }, assignments)) return forbidden();
```

### UI visibility (client-safe)
```tsx
import { hasPermission, PERMISSIONS } from '@/lib/rbac';
{hasPermission(user, PERMISSIONS.MARKETING_CREATE_CAMPAIGNS) && <NewCampaignButton />}
```
Frontend checks are UX-only — always enforce on the server too.

## Current auth seam

SIG360 still authenticates a single admin via cookie (`src/lib/auth.ts`).
`getCurrentRbacUser()` bridges that to an `RbacUser`:

1. If `sig_profiles` has a row matching the session email, its real role +
   permissions apply.
2. Otherwise the legacy admin is treated as `super_admin` so **every existing
   route keeps working with no migration required**.

When Supabase Auth is adopted, tighten step 2 to "no profile → no access" —
that is the only file that changes.

## Next steps (not in this increment)

- Wire `account/roles` page to `sig_profiles` (replace the mocked state).
- Real invite flow (email + `pending_setup` → `active`) with audit logging.
- Profile photo upload to Supabase Storage.
- Adopt Supabase Auth; enforce guards on existing mutating routes.
- Seed the first `super_admin` profile row for the owner.
