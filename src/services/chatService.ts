import { supabase } from '../lib/supabase';
import { ChatSession, ChatMessage } from '../types';

export const chatService = {
  subscribeToUserChats: (userId: string, onUpdate: (chats: ChatSession[]) => void) => {
    const fetchChats = async () => {
      const { data, error } = await supabase
        .from('chat_participants')
        .select('chat_id, unread_count, chat_sessions(*)')
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching user chats:', error);
        return;
      }

      const chats = (data || []).map(row => {
        const session = Array.isArray(row.chat_sessions)
          ? row.chat_sessions[0]
          : row.chat_sessions;
        return {
          id: session.id,
          participants: session.participants || [],
          participantNames: session.participant_names || {},
          updatedAt: session.updated_at,
          lastMessage: session.last_message,
          unreadCount: row.unread_count || 0,
        } as ChatSession;
      });

      onUpdate(chats);
    };

    fetchChats();

    const channel = supabase
      .channel(`chat_participants_${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'chat_participants', filter: 'user_id=eq.' + userId },
        () => fetchChats()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  subscribeToChatMessages: (chatId: string, onUpdate: (messages: ChatMessage[]) => void) => {
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true })
        .limit(50);

      if (error) {
        console.error('Error fetching chat messages:', error);
        return;
      }

      const messages = (data || []).map(row => ({
        id: row.id,
        senderId: row.sender_id,
        body: row.body,
        createdAt: row.created_at,
        read: row.read,
      } as ChatMessage));

      onUpdate(messages);
    };

    fetchMessages();

    const channel = supabase
      .channel(`chat_messages_${chatId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'chat_messages', filter: 'chat_id=eq.' + chatId },
        () => fetchMessages()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  getOrCreateChat: async (userId1: string, userId2: string, name1: string, name2: string) => {
    const { data, error } = await supabase.rpc('get_or_create_chat', {
      user1_id: userId1,
      user2_id: userId2,
    });

    if (error) {
      console.error('Error in get_or_create_chat RPC:', error);
      throw error;
    }

    return data as string;
  },

  sendMessage: async (chatId: string, senderId: string, body: string) => {
    const { error: msgError } = await supabase
      .from('chat_messages')
      .insert({
        chat_id: chatId,
        sender_id: senderId,
        body,
        read: false,
      });

    if (msgError) {
      console.error('Error sending message:', msgError);
      throw msgError;
    }

    const { error: updateError } = await supabase
      .from('chat_sessions')
      .update({
        updated_at: new Date().toISOString(),
        last_message: body,
      })
      .eq('id', chatId);

    if (updateError) {
      console.error('Error updating chat session:', updateError);
      throw updateError;
    }
  },

  markMessagesAsRead: async (chatId: string, userId: string) => {
    const { error } = await supabase
      .from('chat_messages')
      .update({ read: true })
      .eq('chat_id', chatId)
      .neq('sender_id', userId);

    if (error) {
      console.error('Error marking messages as read:', error);
      throw error;
    }
  }
};
