-- ============================================================
-- SIG360 — Profile Photos Storage  v1
-- Public bucket for user avatars. Server uploads via the service
-- role (bypasses RLS); public read so <img> tags work anywhere.
-- Idempotent: safe to re-run.
-- ============================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-photos', 'profile-photos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Public read of avatars.
DROP POLICY IF EXISTS "profile_photos_public_read" ON storage.objects;
CREATE POLICY "profile_photos_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'profile-photos');

-- Authenticated users may write into this bucket (service-role uploads
-- bypass RLS regardless; this enables future direct client uploads).
DROP POLICY IF EXISTS "profile_photos_auth_write" ON storage.objects;
CREATE POLICY "profile_photos_auth_write" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'profile-photos');

DROP POLICY IF EXISTS "profile_photos_auth_update" ON storage.objects;
CREATE POLICY "profile_photos_auth_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'profile-photos');
