import { NextRequest, NextResponse } from 'next/server';
import { requireUser, crmError } from '@/lib/crm/http';
import {
  updateLedgerEntry,
  archiveLedgerEntry,
  deleteLedgerEntry,
  type LedgerInput,
} from '@/lib/ledger/ledger';

type Ctx = { params: Promise<{ id: string }> };

/** PATCH /api/ledger/:id — edit, or archive/restore via `{ archived }`. */
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const gate = await requireUser();
  if (gate.response) return gate.response;
  const { id } = await params;

  let body: LedgerInput & { archived?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  try {
    if (typeof body.archived === 'boolean') {
      const entry = await archiveLedgerEntry(gate.user, id, body.archived);
      return NextResponse.json({ entry });
    }
    const entry = await updateLedgerEntry(gate.user, id, body);
    return NextResponse.json({ entry });
  } catch (err) {
    return crmError(err);
  }
}

/**
 * DELETE /api/ledger/:id — permanent.
 *
 * Voiding (status: 'void') is almost always the correct action on a ledger
 * because it preserves the audit trail, which is what a court accounting is
 * built from. The UI leads with void; this exists for genuine mistakes.
 */
export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const gate = await requireUser();
  if (gate.response) return gate.response;
  const { id } = await params;
  try {
    await deleteLedgerEntry(gate.user, id);
    return NextResponse.json({ deleted: true });
  } catch (err) {
    return crmError(err);
  }
}
