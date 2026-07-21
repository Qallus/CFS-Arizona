/**
 * Shares for any record type: grant a named teammate access to one record.
 *
 * Internal only. There is intentionally no public-link option — these records
 * concern vulnerable adults under court supervision, and a URL that works
 * without a login is not something this app should be able to mint.
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireUser, crmError } from '@/lib/crm/http';
import { listShares, shareWith, unshare, assertEntityType } from '@/lib/collections';

/** GET /api/collections/shares?entityType=matter&entityId=… */
export async function GET(req: NextRequest) {
  const gate = await requireUser();
  if (gate.response) return gate.response;
  try {
    const sp = req.nextUrl.searchParams;
    const entityType = assertEntityType(sp.get('entityType') || '');
    const entityId = sp.get('entityId');
    if (!entityId) return NextResponse.json({ error: 'entityId is required.' }, { status: 400 });
    return NextResponse.json({ shares: await listShares(entityType, entityId) });
  } catch (err) {
    return crmError(err);
  }
}

/** POST /api/collections/shares — { entityType, entityId, profileId, permission?, note? } */
export async function POST(req: NextRequest) {
  const gate = await requireUser();
  if (gate.response) return gate.response;
  try {
    const body = (await req.json()) as {
      entityType?: string;
      entityId?: string;
      profileId?: string;
      permission?: 'view' | 'edit';
      note?: string;
    };
    const entityType = assertEntityType(body.entityType || '');
    if (!body.entityId || !body.profileId) {
      return NextResponse.json({ error: 'entityId and profileId are required.' }, { status: 400 });
    }
    const share = await shareWith(
      gate.user,
      entityType,
      body.entityId,
      body.profileId,
      body.permission === 'edit' ? 'edit' : 'view',
      body.note,
    );
    return NextResponse.json({ share }, { status: 201 });
  } catch (err) {
    return crmError(err);
  }
}

/** DELETE /api/collections/shares?id=… */
export async function DELETE(req: NextRequest) {
  const gate = await requireUser();
  if (gate.response) return gate.response;
  try {
    const id = req.nextUrl.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id is required.' }, { status: 400 });
    await unshare(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return crmError(err);
  }
}
