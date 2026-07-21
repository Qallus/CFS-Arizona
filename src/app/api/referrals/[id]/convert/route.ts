import { NextRequest, NextResponse } from 'next/server';
import { requireUser, crmError } from '@/lib/crm/http';
import { convertReferral } from '@/lib/referrals/referrals';

type Ctx = { params: Promise<{ id: string }> };

/**
 * POST /api/referrals/:id/convert — create the contact this referral becomes.
 *
 * Idempotent: a referral already linked to a contact returns that contact
 * rather than creating a second one, so two staff working the same morning's
 * intake cannot produce duplicate client records.
 */
export async function POST(_req: NextRequest, { params }: Ctx) {
  const gate = await requireUser();
  if (gate.response) return gate.response;
  const { id } = await params;
  try {
    const result = await convertReferral(gate.user, id);
    return NextResponse.json(result, { status: result.alreadyConverted ? 200 : 201 });
  } catch (err) {
    return crmError(err);
  }
}
