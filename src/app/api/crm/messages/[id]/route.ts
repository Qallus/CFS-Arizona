import { NextRequest, NextResponse } from 'next/server';
import { requireUser, crmError } from '@/lib/crm/http';
import { markMessageRead } from '@/lib/crm/messages';

/** PATCH /api/crm/messages/:id — mark read. */
export async function PATCH(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const gate = await requireUser();
  if (gate.response) return gate.response;
  const { id } = await ctx.params;
  try {
    await markMessageRead(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return crmError(err);
  }
}
