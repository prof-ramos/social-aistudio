# Avatars Storage Bucket Setup

Public-read bucket for user avatar images. Authenticated users can upload only under their own UID path prefix.

## Option A: Supabase Dashboard

1. Go to **Storage** in the Supabase Dashboard.
2. Click **New bucket**, name it `avatars`, enable **Public bucket**.
3. Add the following policies under the bucket's **Policies** tab:

| Policy name | Allowed operation | Target roles | Definition |
|---|---|---|---|
| Public read | SELECT | anon, authenticated | `true` |
| Authenticated upload (own path) | INSERT | authenticated | `(auth.uid()::text = (storage.foldername(name))[1])` |
| Authenticated update (own path) | UPDATE | authenticated | `(auth.uid()::text = (storage.foldername(name))[1])` |
| Authenticated delete (own path) | DELETE | authenticated | `(auth.uid()::text = (storage.foldername(name))[1])` |

## Option B: Supabase CLI / SQL

Run the following in the Supabase SQL Editor or include it in a migration:

```sql
-- 1. Create the bucket (public = true)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  2097152,  -- 2 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- 2. Public read — anyone can view avatars
CREATE POLICY "Public read avatars" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

-- 3. Authenticated users can INSERT into their own uid/ path
CREATE POLICY "Users upload own avatar" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars'
    AND auth.role() = 'authenticated'
    AND (auth.uid()::text = (storage.foldername(name))[1])
  );

-- 4. Authenticated users can UPDATE files in their own uid/ path
CREATE POLICY "Users update own avatar" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'avatars'
    AND auth.role() = 'authenticated'
    AND (auth.uid()::text = (storage.foldername(name))[1])
  );

-- 5. Authenticated users can DELETE files in their own uid/ path
CREATE POLICY "Users delete own avatar" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'avatars'
    AND auth.role() = 'authenticated'
    AND (auth.uid()::text = (storage.foldername(name))[1])
  );
```

## Path Convention

All avatar files must follow: `avatars/{uid}/{timestamp}.{ext}`

- `{uid}` — the authenticated user's UUID (must match `auth.uid()`)
- `{timestamp}` — upload timestamp to avoid filename collisions
- `{ext}` — `jpg`, `png`, or `webp`

Example path: `avatars/a1b2c3d4-e5f6-7890-abcd-ef1234567890/1717900000.jpg`

## Acceptance Criteria

| AC | Description | How to verify |
|---|---|---|
| AC1 | Unauthenticated user can GET a file from `avatars` | `curl https://<project>.supabase.co/storage/v1/object/public/avatars/test-uid/test.jpg` returns 200 |
| AC2 | Authenticated user can upload to `avatars/{their_uid}/filename` | Upload via Supabase client JS SDK with valid JWT — returns 200 |
| AC3 | Authenticated user cannot upload to `avatars/{other_uid}/filename` | Upload with path prefix mismatched to JWT uid — returns 403 |

## Verification Steps

1. **Create bucket** using either Dashboard or SQL above.
2. **Upload test image** via Dashboard to `avatars/test-uid/test.jpg`, verify the public URL works in a browser.
3. **Attempt wrong-uid upload**: sign in as a different user and attempt upload to `avatars/other-uid/file.jpg` — expect policy denial (403).
4. **Client integration**: after Phase 3.5, `userService.uploadAvatar(file)` will use this bucket. The service method should construct the path as `{uid}/{Date.now()}.{ext}`.

## Fallback

If bucket creation fails (e.g. storage not enabled on the project), the app falls back to URL-based avatars — the current mechanism where users paste an image URL into their profile. The `avatar_url` field on `users` supports both storage paths and external URLs.