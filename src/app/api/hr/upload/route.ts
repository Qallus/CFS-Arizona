import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { requireUser, crmError } from '@/lib/crm/http';
import { upsertDocument } from '@/lib/hr/documents';
import { canViewAllHr, ownProfileId } from '@/lib/hr/access';

// Employee records are sensitive (insurance, MVR, agreements) so they are kept
// OUT of /public and streamed back through the auth-gated /api/hr/files route.
const ROOT = path.join(process.cwd(), 'private', 'employee-docs');

const ALLOWED: Record<string, string> = {
  'application/pdf': 'pdf',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};
const MAX_BYTES = 10 * 1024 * 1024;

/** POST /api/hr/upload — multipart: file, docTypeId, [profileId], [expiresAt] */
export async function POST(req: NextRequest) {
  const gate = await requireUser();
  if (gate.response) return gate.response;

  try {
    const form = await req.formData();
    const file = form.get('file') as File | null;
    const docTypeId = String(form.get('docTypeId') || '');
    const requestedProfile = (form.get('profileId') as string) || '';
    const expiresAt = (form.get('expiresAt') as string) || null;

    if (!file) return NextResponse.json({ error: 'No file provided.' }, { status: 400 });
    if (!docTypeId) return NextResponse.json({ error: 'docTypeId is required.' }, { status: 400 });

    const ext = ALLOWED[file.type];
    if (!ext) {
      return NextResponse.json({ error: 'Only PDF, JPEG, PNG, or WebP files are accepted.' }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: 'File too large. Maximum size is 10MB.' }, { status: 400 });
    }

    // Staff upload for themselves; HR/Super Admin may upload on someone's behalf.
    const own = ownProfileId(gate.user);
    const profileId = canViewAllHr(gate.user) && requestedProfile ? requestedProfile : own;
    if (!profileId) {
      return NextResponse.json({ error: 'No staff profile to attach this document to.' }, { status: 400 });
    }

    const dir = path.join(ROOT, profileId);
    await mkdir(dir, { recursive: true });
    const filename = `${docTypeId}-${Date.now()}.${ext}`;
    await writeFile(path.join(dir, filename), Buffer.from(await file.arrayBuffer()));

    const document = await upsertDocument(gate.user, {
      profileId,
      docTypeId,
      fileName: file.name,
      fileUrl: `/api/hr/files/${profileId}/${filename}`,
      expiresAt,
    });

    return NextResponse.json({ document }, { status: 201 });
  } catch (err) {
    return crmError(err);
  }
}
