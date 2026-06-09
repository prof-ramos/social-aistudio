import { useState, useEffect, useCallback } from 'react';
import { chatService } from '../services/chatService';
import { ChatMessage, ChatSession } from '../types';

export function useChatConversation(activeChatId: string | null, userId: string, chats: ChatSession[]) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!activeChatId) {
      setMessages([]);
      return;
    }
    // Mark messages as read when opening a chat
    chatService.markMessagesAsRead(activeChatId, userId).catch(console.error);

    const unsub = chatService.subscribeToChatMessages(activeChatId, (msgs) => {
      setMessages(msgs);
      // Mark incoming (not from current user) messages as read
      const hasUnreadFromOthers = msgs.some(m => !m.read && m.senderId !== userId);
      if (hasUnreadFromOthers) {
        chatService.markMessagesAsRead(activeChatId, userId).catch(console.error);
      }
    });
    return () => unsub();
  }, [activeChatId, userId]);

  const activeChat = chats.find(c => c.id === activeChatId) || null;

  const handleSendMessage = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChatId) return;
    setSending(true);
    try {
      await chatService.sendMessage(activeChatId, userId, newMessage);
      setNewMessage('');
    } finally {
      setSending(false);
    }
  }, [newMessage, activeChatId, userId]);

  return { messages, newMessage, setNewMessage, sending, handleSendMessage, activeChat };
}