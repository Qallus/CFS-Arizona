import { NextRequest, NextResponse } from 'next/server';
import { requireUser, crmError } from '@/lib/crm/http';
import { listContacts, createContact, type ContactInput } from '@/lib/crm/contacts';

/** GET /api/crm/contacts — scoped list with search/type/household filters. */
export async function GET(req: NextRequest) {
  const gate = await requireUser();
  if (gate.response) return gate.response;
  const sp = req.nextUrl.searchParams;
  try {
    const result = await listContacts(gate.user, {
      search: sp.get('search') || undefined,
      type: sp.get('type') || undefined,
      householdId: sp.get('householdId') || undefined,
      limit: sp.get('limit') ? Number(sp.get('limit')) : undefined,
      offset: sp.get('offset') ? Number(sp.get('offset')) : undefined,
    });
    return NextResponse.json({ provisioned: true, ...result });
  } catch (err) {
    return crmError(err);
  }
}

/** POST /api/crm/contacts — create a manual contact. */
export async function POST(req: NextRequest) {
  const gate = await requireUser();
  if (gate.response) return gate.response;
  let body: ContactInput;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }
  try {
    const contact = await createContact(gate.user, body);
    return NextResponse.json({ contact }, { status: 201 });
  } catch (err) {
    return crmError(err);
  }
}
