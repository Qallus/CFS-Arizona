import { NextRequest, NextResponse } from 'next/server';
import { requireUser, crmError } from '@/lib/crm/http';
import { getContact, updateContact, type ContactInput } from '@/lib/crm/contacts';
import { getContactNotes, getContactAppointments } from '@/lib/crm/activities';

/** GET /api/crm/contacts/[id] — contact + its notes and appointments. */
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const gate = await requireUser();
  if (gate.response) return gate.response;
  const { id } = await ctx.params;
  try {
    const contact = await getContact(gate.user, id);
    if (!contact) return NextResponse.json({ error: 'Client not found.' }, { status: 404 });
    const [notes, appointments] = await Promise.all([
      getContactNotes(id).catch(() => []),
      getContactAppointments(id).catch(() => []),
    ]);
    return NextResponse.json({ contact, notes, appointments });
  } catch (err) {
    return crmError(err);
  }
}

/** PATCH /api/crm/contacts/[id] — edit a contact. */
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const gate = await requireUser();
  if (gate.response) return gate.response;
  const { id } = await ctx.params;
  let body: ContactInput;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }
  try {
    const contact = await updateContact(gate.user, id, body);
    return NextResponse.json({ contact });
  } catch (err) {
    return crmError(err);
  }
}
