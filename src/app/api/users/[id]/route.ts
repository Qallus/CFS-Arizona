import { NextRequest, NextResponse } from 'next/server';
import { guardPermission } from '@/lib/rbac/route-guards';
import { PERMISSIONS, canManageUser } from '@/lib/rbac';
import {
  getProfile,
  updateProfile,
  archiveProfile,
  TableMissingError,
  ProfileValidationError,
  type UpdateProfileInput,
} from '@/lib/rbac/profiles';

/**
 * PATCH /api/users/[id] — edit role/status/profile fields.
 * Requires users.edit AND a higher management rank than the target.
 */
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const gate = await guardPermission(PERMISSIONS.USERS_EDIT);
  if (gate.response) return gate.response;
  const { id } = await ctx.params;

  let patch: UpdateProfileInput;
  try {
    patch = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  try {
    const target = await getProfile(id);
    if (!target) return NextResponse.json({ error: 'User not found.' }, { status: 404 });

    // Rank check: can't edit someone at or above your management level.
    if (!canManageUser(gate.user, { id: target.id, role: target.role })) {
      return NextResponse.json(
        { error: 'You cannot manage a user at or above your own level.' },
        { status: 403 },
      );
    }
    // Changing a role requires the assign-roles permission specifically.
    if (patch.role !== undefined && patch.role !== target.role) {
      const roleGate = await guardPermission(PERMISSIONS.USERS_ASSIGN_ROLES);
      if (roleGate.response) return roleGate.response;
    }

    const user = await updateProfile(id, patch, { id: gate.user.id, email: gate.user.email });
    return NextResponse.json({ user });
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

/**
 * DELETE /api/users/[id] — archive (soft delete) for compliance.
 * Requires users.archive AND a higher management rank than the target.
 */
export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const gate = await guardPermission(PERMISSIONS.USERS_ARCHIVE);
  if (gate.response) return gate.response;
  const { id } = await ctx.params;

  try {
    const target = await getProfile(id);
    if (!target) return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    if (!canManageUser(gate.user, { id: target.id, role: target.role })) {
      return NextResponse.json(
        { error: 'You cannot archive a user at or above your own level.' },
        { status: 403 },
      );
    }
    const user = await archiveProfile(id, { id: gate.user.id, email: gate.user.email });
    return NextResponse.json({ user });
  } catch (err) {
    if (err instanceof TableMissingError) {
      return NextResponse.json({ error: err.message }, { status: 503 });
    }
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
