/**
 * Favorites for any record type. Generic on purpose — every dashboard page
 * uses this one endpoint rather than growing its own.
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireUser, crmError } from '@/lib/crm/http';
import { listFavoriteIds, setFavorite, assertEntityType } from '@/lib/collections';

/** GET /api/collections/favorites?entityType=matter */
export async function GET(req: NextRequest) {
  const gate = await requireUser();
  if (gate.response) return gate.response;
  try {
    const entityType = assertEntityType(req.nextUrl.searchParams.get('entityType') || '');
    return NextResponse.json({ ids: await listFavoriteIds(gate.user, entityType) });
  } catch (err) {
    return crmError(err);
  }
}

/** POST /api/collections/favorites — { entityType, entityId, favorite } */
export async function POST(req: NextRequest) {
  const gate = await requireUser();
  if (gate.response) return gate.response;
  try {
    const body = (await req.json()) as {
      entityType?: string;
      entityId?: string;
      favorite?: boolean;
    };
    const entityType = assertEntityType(body.entityType || '');
    if (!body.entityId) {
      return NextResponse.json({ error: 'entityId is required.' }, { status: 400 });
    }
    await setFavorite(gate.user, entityType, body.entityId, body.favorite !== false);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return crmError(err);
  }
}
