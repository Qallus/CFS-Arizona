import { NextRequest, NextResponse } from 'next/server';
import { requireUser, crmError } from '@/lib/crm/http';
import { listMessages, sendMessage, type SendMessageInput } from '@/lib/crm/messages';

/** GET /api/crm/messages — inbox list. */
export async function GET() {
  const gate = await requireUser();
  if (gate.response) return gate.response;
  try {
    const messages = await listMessages();
    return NextResponse.json({ provisioned: true, messages });
  } catch (err) {
    return crmError(err);
  }
}

/** POST /api/crm/messages — send a message. */
export async function POST(req: NextRequest) {
  const gate = await requireUser();
  if (gate.response) return gate.response;
  let body: SendMessageInput;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }
  if (!body.body?.trim()) {
    return NextResponse.json({ error: 'Message body is required.' }, { status: 400 });
  }
  try {
    const message = await sendMessage({ ...body, senderName: gate.user.email });
    return NextResponse.json({ message }, { status: 201 });
  } catch (err) {
    return crmError(err);
  }
}
