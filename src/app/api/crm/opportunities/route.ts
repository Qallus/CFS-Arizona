import { NextRequest, NextResponse } from 'next/server';
import { requireUser, crmError } from '@/lib/crm/http';
import {
  listOpportunities,
  createOpportunity,
  getOpportunityForContact,
  type Stage,
  type Disposition,
} from '@/lib/crm/opportunities';
import { createContact, type ContactInput } from '@/lib/crm/contacts';

/** GET /api/crm/opportunities — scoped funnel list with embedded contact.
 *  Pass ?contactId= to return just that contact's current opportunity. */
export async function GET(req: NextRequest) {
  const gate = await requireUser();
  if (gate.response) return gate.response;
  const sp = req.nextUrl.searchParams;
  try {
    const contactId = sp.get('contactId');
    if (contactId) {
      const opportunity = await getOpportunityForContact(gate.user, contactId);
      return NextResponse.json({ provisioned: true, opportunities: opportunity ? [opportunity] : [] });
    }
    const opportunities = await listOpportunities(gate.user, {
      stage: (sp.get('stage') as Stage) || undefined,
      disposition: (sp.get('disposition') as Disposition) || undefined,
    });
    return NextResponse.json({ provisioned: true, opportunities });
  } catch (err) {
    return crmError(err);
  }
}

/**
 * POST /api/crm/opportunities — start an engagement.
 * Body may include `contactId` to attach to an existing contact, or a full
 * `contact` object to create a new contact + Awareness opportunity in one call.
 */
export async function POST(req: NextRequest) {
  const gate = await requireUser();
  if (gate.response) return gate.response;

  let body: { contactId?: string; stage?: Stage; contact?: ContactInput };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  try {
    let contactId = body.contactId;
    if (!contactId && body.contact) {
      const contact = await createContact(gate.user, body.contact);
      contactId = contact.id;
    }
    if (!contactId) {
      return NextResponse.json({ error: 'Provide contactId or a contact to create.' }, { status: 400 });
    }
    const opportunity = await createOpportunity(gate.user, { contactId, stage: body.stage });
    return NextResponse.json({ opportunity }, { status: 201 });
  } catch (err) {
    return crmError(err);
  }
}
