import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';
import { requireUser } from '@/lib/crm/http';
import { canViewAllHr, ownProfileId } from '@/lib/hr/access';

const ROOT = path.join(process.cwd(), 'private', 'employee-docs');

const CONTENT_TYPES: Record<string, string> = {
  '.pdf': 'application/pdf',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
};

/**
 * GET /api/hr/files/:profileId/:filename — stream an employee document.
 * Auth-gated: staff may read their own; HR/Super Admin may read anyone's.
 */
export async function GET(_req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const gate = await requireUser();
  if (gate.response) return gate.response;

  const { path: segments } = await ctx.params;
  if (!segments || segments.length < 2) {
    return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  }
  const [profileId, filename] = segments;

  // Authorization: own documents, or HR/Super Admin.
  if (!canViewAllHr(gate.user) && profileId !== ownProfileId(gate.user)) {
    return NextResponse.json({ error: 'You cannot view this document.' }, { status: 403 });
  }

  // Path traversal guard — resolve and confirm the file stays under ROOT.
  const target = path.resolve(ROOT, profileId, filename);
  if (!target.startsWith(path.resolve(ROOT) + path.sep)) {
    return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  }

  try {
    const buf = await readFile(target);
    const ext = path.extname(target).toLowerCase();
    return new NextResponse(new Uint8Array(buf), {
      headers: {
        'Content-Type': CONTENT_TYPES[ext] ?? 'application/octet-stream',
        'Content-Disposition': `inline; filename="${path.basename(target)}"`,
        'Cache-Control': 'private, no-store',
      },
    });
  } catch {
    return NextResponse.json({ error: 'File not found.' }, { status: 404 });
  }
}
