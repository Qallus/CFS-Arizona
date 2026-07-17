import { NextRequest, NextResponse } from 'next/server';
import { requireUser, crmError } from '@/lib/crm/http';
import { getHousehold, updateHousehold } from '@/lib/crm/households';
import { listContacts } from '@/lib/crm/contacts';

/** GET /api/crm/households/[id] — household + its member contacts. */
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const gate = await requireUser();
  if (gate.response) return gate.response;
  const { id } = await ctx.params;
  try {
    const household = await getHousehold(gate.user, id);
    if (!household) return NextResponse.json({ error: 'Household not found.' }, { status: 404 });
    const { contacts } = await listContacts(gate.user, { householdId: id, limit: 200 });
    return NextResponse.json({ household, members: contacts });
  } catch (err) {
    return crmError(err);
  }
}

/** PATCH /api/crm/households/[id] — rename a household. */
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const gate = await requireUser();
  if (gate.response) return gate.response;
  const { id } = await ctx.params;
  let body: { name?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }
  try {
    const household = await updateHousehold(gate.user, id, body.name ?? '');
    return NextResponse.json({ household });
  } catch (err) {
    return crmError(err);
  }
}
