import { useState, useEffect } from 'react';
import { chatService } from '../services/chatService';
import { ChatSession } from '../types';

export function useChatList(userId: string) {
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = chatService.subscribeToUserChats(userId, (fetchedChats) => {
      setChats(fetchedChats);
      setLoading(false);
    });
    return () => unsub();
  }, [userId]);

  return { chats, loading };
}