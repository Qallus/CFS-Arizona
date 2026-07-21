import { NextRequest, NextResponse } from 'next/server';
import { requireUser, crmError } from '@/lib/crm/http';
import {
  getMatter,
  updateMatter,
  archiveMatter,
  deleteMatter,
  type MatterInput,
} from '@/lib/matters/matters';

type Ctx = { params: Promise<{ id: string }> };

/** GET /api/matters/:id */
export async function GET(_req: NextRequest, { params }: Ctx) {
  const gate = await requireUser();
  if (gate.response) return gate.response;
  const { id } = await params;
  try {
    const matter = await getMatter(gate.user, id);
    if (!matter) return NextResponse.json({ error: 'Matter not found.' }, { status: 404 });
    return NextResponse.json({ matter });
  } catch (err) {
    return crmError(err);
  }
}

/**
 * PATCH /api/matters/:id — edit, or archive/restore.
 * Body `{ archived: boolean }` toggles the archive; anything else is an edit.
 */
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const gate = await requireUser();
  if (gate.response) return gate.response;
  const { id } = await params;

  let body: MatterInput & { archived?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  try {
    if (typeof body.archived === 'boolean') {
      const matter = await archiveMatter(gate.user, id, body.archived);
      return NextResponse.json({ matter });
    }
    const matter = await updateMatter(gate.user, id, body);
    return NextResponse.json({ matter });
  } catch (err) {
    return crmError(err);
  }
}

/** DELETE /api/matters/:id — permanent. Archive is the reversible option. */
export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const gate = await requireUser();
  if (gate.response) return gate.response;
  const { id } = await params;
  try {
    await deleteMatter(gate.user, id);
    return NextResponse.json({ deleted: true });
  } catch (err) {
    return crmError(err);
  }
}
