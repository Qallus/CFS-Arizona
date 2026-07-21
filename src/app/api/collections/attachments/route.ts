/**
 * File uploads for any record type.
 *
 * The 'attachments' bucket is private. Downloads are short-lived signed URLs
 * minted per request after an RBAC check, never public object URLs.
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireUser, crmError } from '@/lib/crm/http';
import {
  listAttachments,
  uploadAttachment,
  deleteAttachment,
  assertEntityType,
} from '@/lib/collections';

/** GET /api/collections/attachments?entityType=matter&entityId=… */
export async function GET(req: NextRequest) {
  const gate = await requireUser();
  if (gate.response) return gate.response;
  try {
    const sp = req.nextUrl.searchParams;
    const entityType = assertEntityType(sp.get('entityType') || '');
    const entityId = sp.get('entityId');
    if (!entityId) return NextResponse.json({ error: 'entityId is required.' }, { status: 400 });
    return NextResponse.json({ attachments: await listAttachments(gate.user, entityType, entityId) });
  } catch (err) {
    return crmError(err);
  }
}

/** POST /api/collections/attachments — multipart: file, entityType, entityId */
export async function POST(req: NextRequest) {
  const gate = await requireUser();
  if (gate.response) return gate.response;
  try {
    const form = await req.formData();
    const file = form.get('file');
    const entityType = assertEntityType(String(form.get('entityType') || ''));
    const entityId = String(form.get('entityId') || '');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'No file was uploaded.' }, { status: 400 });
    }
    if (!entityId) {
      return NextResponse.json({ error: 'entityId is required.' }, { status: 400 });
    }

    const attachment = await uploadAttachment(gate.user, entityType, entityId, file);
    return NextResponse.json({ attachment }, { status: 201 });
  } catch (err) {
    return crmError(err);
  }
}

/** DELETE /api/collections/attachments?id=… */
export async function DELETE(req: NextRequest) {
  const gate = await requireUser();
  if (gate.response) return gate.response;
  try {
    const id = req.nextUrl.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id is required.' }, { status: 400 });
    await deleteAttachment(gate.user, id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return crmError(err);
  }
}
