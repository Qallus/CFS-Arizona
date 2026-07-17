import { NextRequest, NextResponse } from 'next/server';
import { requireUser, crmError } from '@/lib/crm/http';
import { setDocumentStatus, type DocStatus } from '@/lib/hr/documents';

/** PATCH /api/hr/documents/:id — verify / reject (Super Admin or HR). */
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const gate = await requireUser();
  if (gate.response) return gate.response;
  const { id } = await ctx.params;
  let body: { status?: DocStatus };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }
  if (!body.status) return NextResponse.json({ error: 'status is required.' }, { status: 400 });
  try {
    const document = await setDocumentStatus(gate.user, id, body.status);
    return NextResponse.json({ document });
  } catch (err) {
    return crmError(err);
  }
}
