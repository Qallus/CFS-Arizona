import { NextRequest, NextResponse } from 'next/server';
import { requireUser, crmError } from '@/lib/crm/http';
import { listLedger, createLedgerEntry, type LedgerInput } from '@/lib/ledger/ledger';
import { listFavoriteIds } from '@/lib/collections';

/** GET /api/ledger — entries plus running totals. */
export async function GET(req: NextRequest) {
  const gate = await requireUser();
  if (gate.response) return gate.response;
  const sp = req.nextUrl.searchParams;
  try {
    const result = await listLedger(gate.user, {
      search: sp.get('search') || undefined,
      clientId: sp.get('clientId') || undefined,
      entryType: sp.get('entryType') || undefined,
      status: sp.get('status') || undefined,
      includeArchived: sp.get('includeArchived') === 'true',
      limit: sp.get('limit') ? Number(sp.get('limit')) : undefined,
      offset: sp.get('offset') ? Number(sp.get('offset')) : undefined,
    });

    const favorites = new Set(await listFavoriteIds(gate.user, 'ledger_entry'));
    const entries = result.entries.map((e) => ({ ...e, isFavorite: favorites.has(e.id) }));

    return NextResponse.json({
      provisioned: true,
      entries,
      total: result.total,
      totals: result.totals,
    });
  } catch (err) {
    return crmError(err);
  }
}

/** POST /api/ledger — record an entry. Amounts are integer cents. */
export async function POST(req: NextRequest) {
  const gate = await requireUser();
  if (gate.response) return gate.response;
  let body: LedgerInput;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }
  try {
    const entry = await createLedgerEntry(gate.user, body);
    return NextResponse.json({ entry }, { status: 201 });
  } catch (err) {
    return crmError(err);
  }
}
