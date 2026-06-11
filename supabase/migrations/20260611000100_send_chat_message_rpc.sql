-- Atomic send: insert message + update session in one transaction
-- Eliminates the race condition where a message is inserted but the session
-- update fails (network timeout, etc.), leaving the chat list stale.
CREATE OR REPLACE FUNCTION send_chat_message(
  p_chat_id UUID,
  p_sender_id UUID,
  p_body TEXT
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  new_msg_id UUID;
BEGIN
  INSERT INTO chat_messages (chat_id, sender_id, body, read)
  VALUES (p_chat_id, p_sender_id, p_body, false)
  RETURNING id INTO new_msg_id;

  UPDATE chat_sessions
  SET updated_at = NOW(),
      last_message = p_body
  WHERE id = p_chat_id;

  RETURN new_msg_id;
END;
$$;
