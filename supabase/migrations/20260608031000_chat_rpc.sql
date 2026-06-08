-- RPC to safely get or create a chat session between two users
CREATE OR REPLACE FUNCTION get_or_create_chat(user1_id UUID, user2_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_chat_id UUID;
BEGIN
  -- Search for an existing chat session between the two users
  SELECT cp1.chat_id INTO v_chat_id
  FROM chat_participants cp1
  JOIN chat_participants cp2 ON cp1.chat_id = cp2.chat_id
  WHERE cp1.user_id = user1_id AND cp2.user_id = user2_id
  LIMIT 1;

  IF v_chat_id IS NOT NULL THEN
    RETURN v_chat_id;
  END IF;

  -- Create a new chat session
  INSERT INTO chat_sessions (last_message) VALUES (NULL) RETURNING id INTO v_chat_id;

  -- Insert participants
  INSERT INTO chat_participants (chat_id, user_id) VALUES (v_chat_id, user1_id);
  INSERT INTO chat_participants (chat_id, user_id) VALUES (v_chat_id, user2_id);

  RETURN v_chat_id;
END;
$$;

-- Comments DELETE policy
DROP POLICY IF EXISTS "Users delete comments" ON comments;
CREATE POLICY "Users delete comments" ON comments
  FOR DELETE USING (auth.uid() = author_id);

-- Posts DELETE policy
DROP POLICY IF EXISTS "Users delete own posts" ON posts;
CREATE POLICY "Users delete own posts" ON posts
  FOR DELETE USING (auth.uid() = author_id OR is_admin(auth.uid()));
