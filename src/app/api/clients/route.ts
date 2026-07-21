import { NextRequest, NextResponse } from 'next/server';
import { requireUser, crmError } from '@/lib/crm/http';
import { listClients, createClient, type ClientInput } from '@/lib/clients/clients';
import { listFavoriteIds } from '@/lib/collections';

/** GET /api/clients — scoped list with search/status/role filters. */
export async function GET(req: NextRequest) {
  const gate = await requireUser();
  if (gate.response) return gate.response;
  const sp = req.nextUrl.searchParams;
  try {
    const supervised = sp.get('courtSupervised');
    const result = await listClients(gate.user, {
      search: sp.get('search') || undefined,
      status: sp.get('status') || undefined,
      fiduciaryRole: sp.get('fiduciaryRole') || undefined,
      courtSupervised: supervised === null ? undefined : supervised === 'true',
      includeArchived: sp.get('includeArchived') === 'true',
      limit: sp.get('limit') ? Number(sp.get('limit')) : undefined,
      offset: sp.get('offset') ? Number(sp.get('offset')) : undefined,
    });

    const favorites = new Set(await listFavoriteIds(gate.user, 'client'));
    const clients = result.clients.map((c) => ({ ...c, isFavorite: favorites.has(c.id) }));

    return NextResponse.json({ provisioned: true, clients, total: result.total });
  } catch (err) {
    return crmError(err);
  }
}

/** POST /api/clients — add a client or ward. */
export async function POST(req: NextRequest) {
  const gate = await requireUser();
  if (gate.response) return gate.response;
  let body: ClientInput;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }
  try {
    const client = await createClient(gate.user, body);
    return NextResponse.json({ client }, { status: 201 });
  } catch (err) {
    return crmError(err);
  }
}
