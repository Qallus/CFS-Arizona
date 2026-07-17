import { NextRequest, NextResponse } from 'next/server';
import { requireUser, crmError } from '@/lib/crm/http';
import { setMileageStatus, deleteMileage, type MileageStatus } from '@/lib/hr/mileage';

/** PATCH /api/hr/mileage/:id — change status (approve / reimburse). */
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const gate = await requireUser();
  if (gate.response) return gate.response;
  const { id } = await ctx.params;
  let body: { status?: MileageStatus };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }
  if (!body.status) return NextResponse.json({ error: 'status is required.' }, { status: 400 });
  try {
    const entry = await setMileageStatus(gate.user, id, body.status);
    return NextResponse.json({ entry });
  } catch (err) {
    return crmError(err);
  }
}

/** DELETE /api/hr/mileage/:id */
export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const gate = await requireUser();
  if (gate.response) return gate.response;
  const { id } = await ctx.params;
  try {
    await deleteMileage(gate.user, id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return crmError(err);
  }
}
