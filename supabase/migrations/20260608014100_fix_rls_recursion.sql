-- Fix infinite recursion in RLS policies
-- Subqueries inside a table's own RLS policy on the same table cause recursion

-- Helper function: checks if a user is ADMIN, bypassing RLS via SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = user_id AND role = 'ADMIN'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop and recreate the problematic users SELECT policy
DROP POLICY IF EXISTS "Users read own profile" ON users;
CREATE POLICY "Users read own profile" ON users
  FOR SELECT USING (auth.uid() = id OR public.is_admin(auth.uid()));

-- Also fix posts UPDATE policy that had the same pattern
DROP POLICY IF EXISTS "Users update own posts" ON posts;
CREATE POLICY "Users update own posts" ON posts
  FOR UPDATE USING (auth.uid() = author_id OR public.is_admin(auth.uid()));

-- Fix comments SELECT policy
DROP POLICY IF EXISTS "Comments visible with post" ON comments;
CREATE POLICY "Comments visible with post" ON comments
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM posts WHERE posts.id = comments.post_id
  ));

-- Fix reactions SELECT policy
DROP POLICY IF EXISTS "Reactions visible with post" ON reactions;
CREATE POLICY "Reactions visible with post" ON reactions
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM posts WHERE posts.id = reactions.post_id
  ));

-- Fix reports SELECT policy
DROP POLICY IF EXISTS "Admins see all reports" ON reports;
CREATE POLICY "Admins see all reports" ON reports
  FOR SELECT USING (public.is_admin(auth.uid()));

-- Fix member_requests policy
DROP POLICY IF EXISTS "Admins manage requests" ON member_requests;
CREATE POLICY "Admins manage requests" ON member_requests
  FOR ALL USING (public.is_admin(auth.uid()));
