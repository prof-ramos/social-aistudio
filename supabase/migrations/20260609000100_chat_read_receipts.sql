-- Phase 0.3: Chat read receipts
-- Adds UPDATE RLS policy on chat_messages for recipients (non-sender participants)
-- Adds BEFORE UPDATE trigger to enforce only the `read` column may change
-- Adds AFTER INSERT trigger to increment chat_participants.unread_count for recipients
-- Adds AFTER UPDATE trigger to decrement chat_participants.unread_count when messages are marked read

-- RLS: Recipients (non-sender chat participants) can mark messages as read
-- WITH CHECK is constrained by the guard_read_only trigger below
CREATE POLICY "Recipients mark messages as read" ON chat_messages
  FOR UPDATE USING (
    sender_id != auth.uid()
    AND EXISTS (
      SELECT 1 FROM chat_participants
      WHERE chat_id = chat_messages.chat_id AND user_id = auth.uid()
    )
  ) WITH CHECK (true);

-- Trigger function: enforce that only the `read` column may change on chat_messages
CREATE OR REPLACE FUNCTION guard_read_only_update()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.chat_id != OLD.chat_id
     OR NEW.sender_id != OLD.sender_id
     OR NEW.body IS DISTINCT FROM OLD.body
     OR NEW.created_at != OLD.created_at
  THEN
    RAISE EXCEPTION 'Only the read column may be updated on chat_messages';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER guard_chat_message_update
  BEFORE UPDATE ON chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION guard_read_only_update();

-- Trigger function: increment unread_count for recipients when a new message is inserted
CREATE OR REPLACE FUNCTION increment_unread_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE chat_participants
  SET unread_count = COALESCE(unread_count, 0) + 1
  WHERE chat_id = NEW.chat_id AND user_id != NEW.sender_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_message_insert
  AFTER INSERT ON chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION increment_unread_count();

-- Trigger function: decrement unread_count when a message transitions from unread to read
-- Uses auth.uid() so only the reading user's count is decremented (group-chat safe)
CREATE OR REPLACE FUNCTION decrement_unread_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.read = true AND OLD.read = false THEN
    UPDATE chat_participants
    SET unread_count = GREATEST(unread_count - 1, 0)
    WHERE chat_id = NEW.chat_id AND user_id = auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_message_read
  AFTER UPDATE ON chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION decrement_unread_count();