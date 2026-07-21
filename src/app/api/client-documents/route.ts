/**
 * The fiduciary document library: files belonging to a client or matter.
 *
 * Deliberately NOT /api/documents — that path is a legacy JSON-file store
 * (data/documents.json) still used by the Projects page and the document
 * editor at /documents/[documentId]. Replacing it would have broken both.
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireUser, crmError } from '@/lib/crm/http';
import { listDocuments, createDocument, type DocumentInput } from '@/lib/documents/documents';
import { listFavoriteIds } from '@/lib/collections';

/** GET /api/client-documents — list with search/type/status/client filters. */
export async function GET(req: NextRequest) {
  const gate = await requireUser();
  if (gate.response) return gate.response;
  const sp = req.nextUrl.searchParams;
  try {
    const result = await listDocuments(gate.user, {
      search: sp.get('search') || undefined,
      docType: sp.get('docType') || undefined,
      status: sp.get('status') || undefined,
      clientId: sp.get('clientId') || undefined,
      includeArchived: sp.get('includeArchived') === 'true',
      limit: sp.get('limit') ? Number(sp.get('limit')) : undefined,
      offset: sp.get('offset') ? Number(sp.get('offset')) : undefined,
    });

    const favorites = new Set(await listFavoriteIds(gate.user, 'document'));
    const documents = result.documents.map((d) => ({ ...d, isFavorite: favorites.has(d.id) }));

    return NextResponse.json({ provisioned: true, documents, total: result.total });
  } catch (err) {
    return crmError(err);
  }
}

/**
 * POST /api/client-documents — create, with the file in the same request.
 *
 * Multipart rather than JSON: here the upload IS the creation, so splitting it
 * into create-then-attach would leave empty rows behind whenever the second
 * call failed.
 */
export async function POST(req: NextRequest) {
  const gate = await requireUser();
  if (gate.response) return gate.response;

  try {
    const contentType = req.headers.get('content-type') ?? '';

    let input: DocumentInput;
    let file: File | null = null;

    if (contentType.includes('multipart/form-data')) {
      const form = await req.formData();
      const maybeFile = form.get('file');
      file = maybeFile instanceof File ? maybeFile : null;
      const str = (k: string) => String(form.get(k) || '');
      input = {
        title: str('title'),
        docType: str('docType') || undefined,
        status: str('status') || undefined,
        clientId: str('clientId') || null,
        matterId: str('matterId') || null,
        effectiveAt: str('effectiveAt') || null,
        expiresAt: str('expiresAt') || null,
        notes: str('notes') || undefined,
      };
    } else {
      input = (await req.json()) as DocumentInput;
    }

    const document = await createDocument(gate.user, input, file);
    return NextResponse.json({ document }, { status: 201 });
  } catch (err) {
    return crmError(err);
  }
}
