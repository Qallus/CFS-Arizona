import { NextRequest, NextResponse } from 'next/server';
import { requireUser, crmError } from '@/lib/crm/http';
import { getContact } from '@/lib/crm/contacts';
import { getContactActivities, logActivity, type LogActivityInput } from '@/lib/crm/activities';

/** GET /api/crm/activities?contactId=... — timeline for a contact. */
export async function GET(req: NextRequest) {
  const gate = await requireUser();
  if (gate.response) return gate.response;
  const contactId = req.nextUrl.searchParams.get('contactId');
  if (!contactId) return NextResponse.json({ error: 'contactId is required.' }, { status: 400 });
  try {
    // Enforce contact scope before returning its activities.
    const contact = await getContact(gate.user, contactId);
    if (!contact) return NextResponse.json({ error: 'Contact not found.' }, { status: 404 });
    const activities = await getContactActivities(contactId);
    return NextResponse.json({ provisioned: true, activities });
  } catch (err) {
    return crmError(err);
  }
}

/** POST /api/crm/activities — log a call/email/sms/meeting/etc. */
export async function POST(req: NextRequest) {
  const gate = await requireUser();
  if (gate.response) return gate.response;
  let body: LogActivityInput;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }
  if (!body.contactId || !body.type) {
    return NextResponse.json({ error: 'contactId and type are required.' }, { status: 400 });
  }
  try {
    // Scope check: caller must be able to see the contact.
    const contact = await getContact(gate.user, body.contactId);
    if (!contact) return NextResponse.json({ error: 'Contact not found.' }, { status: 404 });
    // created_by references sig_profiles(id) (uuid). The legacy/owner fallback
    // user has a non-uuid id, so only pass a real profile id through.
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(gate.user.id);
    const activity = await logActivity({ ...body, createdBy: isUuid ? gate.user.id : null });
    return NextResponse.json({ activity }, { status: 201 });
  } catch (err) {
    return crmError(err);
  }
}
