-- =====================================================
-- Phase 0.1: Add deleted_at + rating columns
-- Phase 0.2: RLS policies for soft-delete
-- =====================================================

-- Phase 0.1: Add deleted_at column for soft-delete
ALTER TABLE posts ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE comments ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE posto_fields ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Phase 0.1: Add rating column to reviews (1-5 stars)
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS rating INT;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'reviews_rating_check'
  ) THEN
    ALTER TABLE reviews ADD CONSTRAINT reviews_rating_check CHECK (rating >= 1 AND rating <= 5);
  END IF;
END $$;

-- Index for soft-delete filtering performance
CREATE INDEX IF NOT EXISTS idx_posts_deleted ON posts(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_comments_deleted ON comments(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_posto_fields_deleted ON posto_fields(deleted_at) WHERE deleted_at IS NOT NULL;

-- =====================================================
-- Phase 0.2: Modify SELECT policies to exclude soft-deleted rows
-- =====================================================

-- Posts: replace permissive SELECT with soft-delete-aware one
DROP POLICY IF EXISTS "Posts visible to all" ON posts;
CREATE POLICY "Posts visible to all" ON posts
  FOR SELECT USING (deleted_at IS NULL);

-- Comments: replace SELECT to exclude soft-deleted, keep post existence check
-- (subquery on posts automatically applies posts RLS, so comments on soft-deleted posts are also hidden)
DROP POLICY IF EXISTS "Comments visible with post" ON comments;
CREATE POLICY "Comments visible with post" ON comments
  FOR SELECT USING (
    deleted_at IS NULL
    AND EXISTS (SELECT 1 FROM posts WHERE posts.id = comments.post_id)
  );

-- Posto fields: replace SELECT to exclude soft-deleted, keep posto existence check
DROP POLICY IF EXISTS "Posto fields visible with posto" ON posto_fields;
CREATE POLICY "Posto fields visible with posto" ON posto_fields
  FOR SELECT USING (
    deleted_at IS NULL
    AND EXISTS (SELECT 1 FROM postos WHERE postos.id = posto_fields.posto_id)
  );

-- =====================================================
-- Phase 0.2: Add UPDATE policies for soft-delete
-- =====================================================

-- Comments: authors can update own comments (for soft-delete)
DROP POLICY IF EXISTS "Authors update own comments" ON comments;
CREATE POLICY "Authors update own comments" ON comments
  FOR UPDATE USING (auth.uid() = author_id);

-- Comments: admins can update any comment (for soft-delete)
DROP POLICY IF EXISTS "Admins update any comment" ON comments;
CREATE POLICY "Admins update any comment" ON comments
  FOR UPDATE USING (public.is_admin(auth.uid()));

-- Posto fields: authors can update own fields (for soft-delete)
DROP POLICY IF EXISTS "Authors update own posto fields" ON posto_fields;
CREATE POLICY "Authors update own posto fields" ON posto_fields
  FOR UPDATE USING (auth.uid() = author_id);

-- Posto fields: admins can update any field (for soft-delete)
DROP POLICY IF EXISTS "Admins update any posto field" ON posto_fields;
CREATE POLICY "Admins update any posto field" ON posto_fields
  FOR UPDATE USING (public.is_admin(auth.uid()));