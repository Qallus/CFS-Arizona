import { NextRequest, NextResponse } from 'next/server';
import { requireUser, crmError } from '@/lib/crm/http';
import {
  updateFollowUp,
  completeFollowUp,
  deleteFollowUp,
  type FollowUpInput,
} from '@/lib/followups/followups';

type Ctx = { params: Promise<{ id: string }> };

/**
 * PATCH /api/followups/:id — edit, or complete via `{ complete: true }`.
 * Completing a recurring follow-up also queues the next occurrence.
 */
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const gate = await requireUser();
  if (gate.response) return gate.response;
  const { id } = await params;

  let body: FollowUpInput & { complete?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  try {
    if (body.complete) {
      const result = await completeFollowUp(gate.user, id);
      return NextResponse.json(result);
    }
    const followUp = await updateFollowUp(gate.user, id, body);
    return NextResponse.json({ followUp });
  } catch (err) {
    return crmError(err);
  }
}

/** DELETE /api/followups/:id */
export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const gate = await requireUser();
  if (gate.response) return gate.response;
  const { id } = await params;
  try {
    await deleteFollowUp(id);
    return NextResponse.json({ deleted: true });
  } catch (err) {
    return crmError(err);
  }
}
