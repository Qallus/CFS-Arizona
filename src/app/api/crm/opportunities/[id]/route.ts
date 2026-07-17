import { NextRequest, NextResponse } from 'next/server';
import { requireUser, crmError } from '@/lib/crm/http';
import {
  getOpportunity,
  updateOpportunity,
  type UpdateOpportunityInput,
} from '@/lib/crm/opportunities';

/** GET /api/crm/opportunities/:id */
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const gate = await requireUser();
  if (gate.response) return gate.response;
  const { id } = await ctx.params;
  try {
    const opportunity = await getOpportunity(gate.user, id);
    if (!opportunity) return NextResponse.json({ error: 'Not found.' }, { status: 404 });
    return NextResponse.json({ opportunity });
  } catch (err) {
    return crmError(err);
  }
}

/** PATCH /api/crm/opportunities/:id — advance stage / set disposition / gates. */
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const gate = await requireUser();
  if (gate.response) return gate.response;
  const { id } = await ctx.params;
  let body: UpdateOpportunityInput;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }
  try {
    const opportunity = await updateOpportunity(gate.user, id, body);
    return NextResponse.json({ opportunity });
  } catch (err) {
    return crmError(err);
  }
}
