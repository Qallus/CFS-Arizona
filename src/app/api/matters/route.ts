import { NextRequest, NextResponse } from 'next/server';
import { requireUser, crmError } from '@/lib/crm/http';
import { listMatters, createMatter, type MatterInput } from '@/lib/matters/matters';
import { listFavoriteIds } from '@/lib/collections';

/** GET /api/matters — scoped list with search/status/type filters. */
export async function GET(req: NextRequest) {
  const gate = await requireUser();
  if (gate.response) return gate.response;
  const sp = req.nextUrl.searchParams;
  try {
    const result = await listMatters(gate.user, {
      search: sp.get('search') || undefined,
      status: sp.get('status') || undefined,
      matterType: sp.get('matterType') || undefined,
      includeArchived: sp.get('includeArchived') === 'true',
      limit: sp.get('limit') ? Number(sp.get('limit')) : undefined,
      offset: sp.get('offset') ? Number(sp.get('offset')) : undefined,
    });

    // Fold in this user's favorites so the list renders in one round trip.
    const favorites = new Set(await listFavoriteIds(gate.user, 'matter'));
    const matters = result.matters.map((m) => ({ ...m, isFavorite: favorites.has(m.id) }));

    return NextResponse.json({ provisioned: true, matters, total: result.total });
  } catch (err) {
    return crmError(err);
  }
}

/** POST /api/matters — open a new matter. */
export async function POST(req: NextRequest) {
  const gate = await requireUser();
  if (gate.response) return gate.response;
  let body: MatterInput;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }
  try {
    const matter = await createMatter(gate.user, body);
    return NextResponse.json({ matter }, { status: 201 });
  } catch (err) {
    return crmError(err);
  }
}
