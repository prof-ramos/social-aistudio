-- Migrations for critical security fixes
-- 1. Create a users_public view for least privilege access
CREATE OR REPLACE VIEW users_public AS
SELECT id, name, avatar_url, bio, current_post, role, is_online, last_online, interests, created_at
FROM public.users;

-- Grant select on users_public to authenticated users
GRANT SELECT ON users_public TO authenticated;

-- Replace the permissive "Users read own profile" policy with a restrictive one
DROP POLICY IF EXISTS "Users read own profile" ON users;
CREATE POLICY "Users read own complete profile" ON users
  FOR SELECT USING (auth.uid() = id);

-- 2. Add missing INSERT/SELECT policies for chat_sessions and chat_participants
-- Users can insert chat sessions
DROP POLICY IF EXISTS "Users create chat sessions" ON chat_sessions;
-- Sessions are created via the get_or_create_chat RPC (SECURITY DEFINER), not direct INSERT

-- Users can join chats (chat_participants)
DROP POLICY IF EXISTS "Users join chats" ON chat_participants;
CREATE POLICY "Users join chats" ON chat_participants
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Fix chat_participants select policy to allow seeing the rows
DROP POLICY IF EXISTS "Users see own chat memberships" ON chat_participants;
CREATE POLICY "Users see own chat memberships" ON chat_participants
  FOR SELECT USING (user_id = auth.uid());

-- Notifications INSERT policy
DROP POLICY IF EXISTS "Users create notifications" ON notifications;
CREATE POLICY "Users create notifications" ON notifications
  FOR INSERT WITH CHECK (auth.uid() = user_id);
