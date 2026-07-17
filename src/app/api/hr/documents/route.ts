import { NextRequest, NextResponse } from 'next/server';
import { requireUser, crmError } from '@/lib/crm/http';
import { listDocuments, upsertDocument, type UpsertDocInput } from '@/lib/hr/documents';

/** GET /api/hr/documents?profileId= — an employee's uploaded documents. */
export async function GET(req: NextRequest) {
  const gate = await requireUser();
  if (gate.response) return gate.response;
  try {
    const profileId = req.nextUrl.searchParams.get('profileId');
    const documents = await listDocuments(gate.user, profileId);
    return NextResponse.json({ provisioned: true, documents });
  } catch (err) {
    return crmError(err);
  }
}

/** POST /api/hr/documents — record an upload (replaces any prior file for that type). */
export async function POST(req: NextRequest) {
  const gate = await requireUser();
  if (gate.response) return gate.response;
  let body: UpsertDocInput;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }
  try {
    const document = await upsertDocument(gate.user, body);
    return NextResponse.json({ document }, { status: 201 });
  } catch (err) {
    return crmError(err);
  }
}
