import { NextRequest, NextResponse } from 'next/server';
import { requireUser, crmError } from '@/lib/crm/http';
import { listFollowUps, createFollowUp, type FollowUpInput } from '@/lib/followups/followups';

/** GET /api/followups — by contact, by referral, mine, or everything due. */
export async function GET(req: NextRequest) {
  const gate = await requireUser();
  if (gate.response) return gate.response;
  const sp = req.nextUrl.searchParams;
  try {
    const followUps = await listFollowUps(gate.user, {
      contactId: sp.get('contactId') || undefined,
      referralId: sp.get('referralId') || undefined,
      mine: sp.get('mine') === 'true',
      status: sp.get('status') || undefined,
      dueOnly: sp.get('dueOnly') === 'true',
    });
    return NextResponse.json({ provisioned: true, followUps });
  } catch (err) {
    return crmError(err);
  }
}

/** POST /api/followups — schedule the next step. */
export async function POST(req: NextRequest) {
  const gate = await requireUser();
  if (gate.response) return gate.response;
  let body: FollowUpInput;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }
  try {
    const followUp = await createFollowUp(gate.user, body);
    return NextResponse.json({ followUp }, { status: 201 });
  } catch (err) {
    return crmError(err);
  }
}
