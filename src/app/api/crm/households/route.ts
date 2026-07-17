import { NextRequest, NextResponse } from 'next/server';
import { requireUser, crmError } from '@/lib/crm/http';
import { listHouseholds, createHousehold } from '@/lib/crm/households';

/** GET /api/crm/households — scoped list with optional search. */
export async function GET(req: NextRequest) {
  const gate = await requireUser();
  if (gate.response) return gate.response;
  const sp = req.nextUrl.searchParams;
  try {
    const result = await listHouseholds(gate.user, {
      search: sp.get('search') || undefined,
      limit: sp.get('limit') ? Number(sp.get('limit')) : undefined,
      offset: sp.get('offset') ? Number(sp.get('offset')) : undefined,
    });
    return NextResponse.json({ provisioned: true, ...result });
  } catch (err) {
    return crmError(err);
  }
}

/** POST /api/crm/households — create a household. */
export async function POST(req: NextRequest) {
  const gate = await requireUser();
  if (gate.response) return gate.response;
  let body: { name?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }
  try {
    const household = await createHousehold(gate.user, body.name ?? '');
    return NextResponse.json({ household }, { status: 201 });
  } catch (err) {
    return crmError(err);
  }
}
