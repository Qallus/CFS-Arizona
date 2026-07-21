import { NextRequest, NextResponse } from 'next/server';
import { requireUser, crmError } from '@/lib/crm/http';
import {
  updateDocument,
  archiveDocument,
  deleteDocument,
  type DocumentInput,
} from '@/lib/documents/documents';

type Ctx = { params: Promise<{ id: string }> };

/** PATCH /api/client-documents/:id — edit, or archive/restore via `{ archived }`. */
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const gate = await requireUser();
  if (gate.response) return gate.response;
  const { id } = await params;

  let body: DocumentInput & { archived?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  try {
    if (typeof body.archived === 'boolean') {
      const document = await archiveDocument(gate.user, id, body.archived);
      return NextResponse.json({ document });
    }
    const document = await updateDocument(gate.user, id, body);
    return NextResponse.json({ document });
  } catch (err) {
    return crmError(err);
  }
}

/** DELETE /api/client-documents/:id — permanent, including the stored file. */
export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const gate = await requireUser();
  if (gate.response) return gate.response;
  const { id } = await params;
  try {
    await deleteDocument(gate.user, id);
    return NextResponse.json({ deleted: true });
  } catch (err) {
    return crmError(err);
  }
}
