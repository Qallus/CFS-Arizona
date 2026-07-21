import { NextRequest, NextResponse } from 'next/server';
import { requireUser, crmError } from '@/lib/crm/http';
import {
  getClient,
  updateClient,
  archiveClient,
  deleteClient,
  type ClientInput,
} from '@/lib/clients/clients';

type Ctx = { params: Promise<{ id: string }> };

/** GET /api/clients/:id */
export async function GET(_req: NextRequest, { params }: Ctx) {
  const gate = await requireUser();
  if (gate.response) return gate.response;
  const { id } = await params;
  try {
    const client = await getClient(gate.user, id);
    if (!client) return NextResponse.json({ error: 'Client not found.' }, { status: 404 });
    return NextResponse.json({ client });
  } catch (err) {
    return crmError(err);
  }
}

/** PATCH /api/clients/:id — edit, or archive/restore via `{ archived }`. */
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const gate = await requireUser();
  if (gate.response) return gate.response;
  const { id } = await params;

  let body: ClientInput & { archived?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  try {
    if (typeof body.archived === 'boolean') {
      const client = await archiveClient(gate.user, id, body.archived);
      return NextResponse.json({ client });
    }
    const client = await updateClient(gate.user, id, body);
    return NextResponse.json({ client });
  } catch (err) {
    return crmError(err);
  }
}

/** DELETE /api/clients/:id — permanent. */
export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const gate = await requireUser();
  if (gate.response) return gate.response;
  const { id } = await params;
  try {
    await deleteClient(gate.user, id);
    return NextResponse.json({ deleted: true });
  } catch (err) {
    return crmError(err);
  }
}
