import { NextRequest, NextResponse } from 'next/server';
import { getSessionIdentity } from '@/lib/rbac/current-user';
import {
  getProfileByEmail,
  uploadProfilePhoto,
  TableMissingError,
  ProfileValidationError,
} from '@/lib/rbac/profiles';

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif']);
const EXT: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

/** POST /api/me/photo — multipart upload of the current user's avatar. */
export async function POST(req: NextRequest) {
  const identity = await getSessionIdentity();
  if (!identity) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: 'Expected multipart/form-data.' }, { status: 400 });
  }
  const file = form.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Missing "file".' }, { status: 400 });
  }
  if (!ALLOWED.has(file.type)) {
    return NextResponse.json({ error: 'Unsupported image type. Use PNG, JPEG, WEBP, or GIF.' }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'Image too large (max 5 MB).' }, { status: 400 });
  }

  try {
    const me = await getProfileByEmail(identity.email);
    if (!me) return NextResponse.json({ error: 'Profile not found.' }, { status: 404 });

    const bytes = new Uint8Array(await file.arrayBuffer());
    const profile = await uploadProfilePhoto(
      me.id,
      { bytes, contentType: file.type, ext: EXT[file.type] ?? 'png' },
      { id: me.id, email: me.email },
    );
    return NextResponse.json({ profile, url: profile.profilePhotoUrl });
  } catch (err) {
    if (err instanceof TableMissingError) {
      return NextResponse.json(
        { error: 'Storage bucket not provisioned. Apply the profile-photos migration.' },
        { status: 503 },
      );
    }
    if (err instanceof ProfileValidationError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
