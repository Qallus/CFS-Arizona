import { NextRequest, NextResponse } from 'next/server';
import { requireUser, crmError } from '@/lib/crm/http';
import { listReferrals, createReferral, type ReferralInput } from '@/lib/referrals/referrals';
import { listFavoriteIds } from '@/lib/collections';

/** GET /api/referrals — the intake log. */
export async function GET(req: NextRequest) {
  const gate = await requireUser();
  if (gate.response) return gate.response;
  const sp = req.nextUrl.searchParams;
  try {
    const result = await listReferrals(gate.user, {
      search: sp.get('search') || undefined,
      status: sp.get('status') || undefined,
      referralType: sp.get('referralType') || undefined,
      includeArchived: sp.get('includeArchived') === 'true',
      limit: sp.get('limit') ? Number(sp.get('limit')) : undefined,
      offset: sp.get('offset') ? Number(sp.get('offset')) : undefined,
    });
    const favorites = new Set(await listFavoriteIds(gate.user, 'referral'));
    const referrals = result.referrals.map((r) => ({ ...r, isFavorite: favorites.has(r.id) }));
    return NextResponse.json({ provisioned: true, referrals, total: result.total });
  } catch (err) {
    return crmError(err);
  }
}

/** POST /api/referrals — log a new referral. */
export async function POST(req: NextRequest) {
  const gate = await requireUser();
  if (gate.response) return gate.response;
  let body: ReferralInput;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }
  try {
    const referral = await createReferral(gate.user, body);
    return NextResponse.json({ referral }, { status: 201 });
  } catch (err) {
    return crmError(err);
  }
}
