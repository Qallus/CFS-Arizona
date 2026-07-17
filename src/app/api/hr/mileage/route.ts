import { NextRequest, NextResponse } from 'next/server';
import { requireUser, crmError } from '@/lib/crm/http';
import { listMileage, createMileage, type MileageInput } from '@/lib/hr/mileage';
import { canViewAllHr } from '@/lib/hr/access';

/** GET /api/hr/mileage — own log, or everyone's for HR/Super Admin. */
export async function GET(req: NextRequest) {
  const gate = await requireUser();
  if (gate.response) return gate.response;
  try {
    const profileId = req.nextUrl.searchParams.get('profileId');
    const entries = await listMileage(gate.user, profileId);
    return NextResponse.json({ provisioned: true, entries, canViewAll: canViewAllHr(gate.user) });
  } catch (err) {
    return crmError(err);
  }
}

/** POST /api/hr/mileage — log a trip. */
export async function POST(req: NextRequest) {
  const gate = await requireUser();
  if (gate.response) return gate.response;
  let body: MileageInput;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }
  try {
    const entry = await createMileage(gate.user, body);
    return NextResponse.json({ entry }, { status: 201 });
  } catch (err) {
    return crmError(err);
  }
}
