import { NextRequest, NextResponse } from 'next/server';
import { guardPermission } from '@/lib/rbac/route-guards';
import { PERMISSIONS } from '@/lib/rbac';
import {
  getProfile,
  resetInvite,
  sendInvite,
  TableMissingError,
  ProfileValidationError,
} from '@/lib/rbac/profiles';

/**
 * POST /api/users/[id]/resend-invite — reset a user's invite (status → invited).
 * Requires users.reset_invite. Sending the actual invite email is a follow-up
 * (wire Resend/nodemailer here); this establishes the record + audit trail.
 */
export async function POST(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const gate = await guardPermission(PERMISSIONS.USERS_RESET_INVITE);
  if (gate.response) return gate.response;
  const { id } = await ctx.params;

  try {
    const target = await getProfile(id);
    if (!target) return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    const user = await resetInvite(id, { id: gate.user.id, email: gate.user.email });
    const invite = await sendInvite(user, gate.user.email);
    return NextResponse.json({ user, invite, emailSent: invite.emailSent });
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
