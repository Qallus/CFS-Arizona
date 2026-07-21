import { NextRequest, NextResponse } from 'next/server';
import { requireUser, crmError } from '@/lib/crm/http';
import {
  updateReferral,
  archiveReferral,
  deleteReferral,
  type ReferralInput,
} from '@/lib/referrals/referrals';

type Ctx = { params: Promise<{ id: string }> };

/** PATCH /api/referrals/:id — edit, or archive/restore via `{ archived }`. */
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const gate = await requireUser();
  if (gate.response) return gate.response;
  const { id } = await params;

  let body: ReferralInput & { archived?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  try {
    if (typeof body.archived === 'boolean') {
      const referral = await archiveReferral(gate.user, id, body.archived);
      return NextResponse.json({ referral });
    }
    const referral = await updateReferral(gate.user, id, body);
    return NextResponse.json({ referral });
  } catch (err) {
    return crmError(err);
  }
}

/** DELETE /api/referrals/:id — permanent. */
export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const gate = await requireUser();
  if (gate.response) return gate.response;
  const { id } = await params;
  try {
    await deleteReferral(gate.user, id);
    return NextResponse.json({ deleted: true });
  } catch (err) {
    return crmError(err);
  }
}
