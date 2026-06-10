-- Security fix: the previous "Users join chats" INSERT policy let any
-- authenticated user insert themselves into ANY chat_id, granting read access
-- to other users' private messages (chat_messages SELECT trusts participant rows).
-- Chats and their participant rows are created exclusively by the
-- get_or_create_chat() SECURITY DEFINER RPC, which bypasses RLS, so no
-- client-facing INSERT policy on chat_participants is required.

DROP POLICY IF EXISTS "Users join chats" ON chat_participants;

-- Intentionally NOT recreating an INSERT policy: with RLS enabled and no
-- permissive INSERT policy, direct client inserts are denied by default, while
-- the SECURITY DEFINER RPC continues to insert participants.
