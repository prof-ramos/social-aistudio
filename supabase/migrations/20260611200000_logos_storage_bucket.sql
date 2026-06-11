-- Phase 0.5: Logos storage bucket (public, SVG only)
-- Migration: 20260611200000_logos_storage_bucket.sql

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'logos',
  'logos',
  true,
  5242880,  -- 5 MB (SVGs can be large with embedded paths)
  ARRAY['image/svg+xml']
) ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public read logos" ON storage.objects;
CREATE POLICY "Public read logos" ON storage.objects
  FOR SELECT USING (bucket_id = 'logos');

-- Only admins can upload/update/delete logos
DROP POLICY IF EXISTS "Admins upload logos" ON storage.objects;
CREATE POLICY "Admins upload logos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'logos'
    AND auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

DROP POLICY IF EXISTS "Admins update logos" ON storage.objects;
CREATE POLICY "Admins update logos" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'logos'
    AND auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

DROP POLICY IF EXISTS "Admins delete logos" ON storage.objects;
CREATE POLICY "Admins delete logos" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'logos'
    AND auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );
