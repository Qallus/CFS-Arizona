import { NextRequest, NextResponse } from 'next/server';
import { requireUser, crmError } from '@/lib/crm/http';
import { getContact } from '@/lib/crm/contacts';
import { tryLogActivity } from '@/lib/crm/activities';
import { sendEmail, isEmailConfigured } from '@/lib/email';

/**
 * POST /api/crm/email — send an email to a contact from inside the workflow,
 * and record it on that contact's timeline.
 *
 * Separate from /api/email, which is the older SMTP/IMAP mailbox used by the
 * standalone compose and inbox screens. This path goes through Resend and is
 * scoped to a contact, so the two concerns stay apart: that route manages a
 * mailbox, this one services a case.
 */

interface Body {
  contactId?: string;
  opportunityId?: string | null;
  to?: string;
  subject?: string;
  body?: string;
  cc?: string;
  bcc?: string;
}

/** Plain text → simple HTML. The composer is a plain textarea. */
function toHtml(text: string): string {
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  return `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.55;color:#111827;white-space:pre-wrap;">${escaped}</div>`;
}

export async function POST(req: NextRequest) {
  const gate = await requireUser();
  if (gate.response) return gate.response;

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const { contactId, opportunityId, to, subject } = body;
  const text = body.body ?? '';

  if (!contactId || !to || !subject?.trim()) {
    return NextResponse.json(
      { error: 'contactId, to and subject are required.' },
      { status: 400 },
    );
  }

  // Say this plainly rather than failing as a generic send error — an unset
  // API key is a deployment issue, not something retrying will fix.
  if (!isEmailConfigured()) {
    return NextResponse.json(
      { error: 'Email is not configured on the server. RESEND_API_KEY is not set.' },
      { status: 503 },
    );
  }

  try {
    // Scope check: the caller must be able to see this contact at all.
    const contact = await getContact(gate.user, contactId);
    if (!contact) return NextResponse.json({ error: 'Contact not found.' }, { status: 404 });

    // Replies go to the person who actually wrote the message, even though
    // the mail is sent from the practice's shared address.
    const res = await sendEmail({
      to,
      subject,
      html: toHtml(text),
      text,
      cc: body.cc,
      bcc: body.bcc,
      replyTo: gate.user.email || undefined,
    });

    if (!res.sent) {
      return NextResponse.json(
        { error: res.error || 'Resend rejected the message.' },
        { status: 502 },
      );
    }

    // Only after Resend accepts it. Logging earlier would put undelivered
    // mail on the billable record.
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      gate.user.id,
    );
    const row = await tryLogActivity({
      contactId,
      opportunityId: opportunityId ?? null,
      type: 'email',
      direction: 'out',
      subject,
      body: text || null,
      createdBy: isUuid ? gate.user.id : null,
    });

    return NextResponse.json({ success: true, id: res.id, logged: Boolean(row) });
  } catch (err) {
    return crmError(err);
  }
}
