import { NextResponse } from 'next/server';
import { requireUser, crmError } from '@/lib/crm/http';
import { getCompliance } from '@/lib/hr/documents';
import { ownProfileId, canVerifyHr } from '@/lib/hr/access';

/**
 * GET /api/hr/compliance — per-employee document completion + headline stats.
 * HR/Super Admin see everyone; other staff see only themselves.
 */
export async function GET() {
  const gate = await requireUser();
  if (gate.response) return gate.response;
  try {
    const result = await getCompliance(gate.user);
    return NextResponse.json({
      provisioned: true,
      ...result,
      me: ownProfileId(gate.user),
      canVerify: canVerifyHr(gate.user),
    });
  } catch (err) {
    return crmError(err);
  }
}
