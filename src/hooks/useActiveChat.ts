import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { chatService } from '../services/chatService';
import type { ChatSession } from '../types';

/**
 * Owns the currently-selected chat id and the "start a chat from a profile
 * link" flow: when navigation arrives with a targetUserId in location.state,
 * open the existing conversation or create one. Keeps chatService out of the
 * Messages page.
 */
export function useActiveChat(profile: { id: string; name: string }, chats: ChatSession[]) {
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const location = useLocation();
  const isCreatingChatRef = useRef(false);
  const locationStateRef = useRef(location.state);

  // Capture location.state once on mount to avoid re-triggering on chat updates
  useEffect(() => {
    locationStateRef.current = location.state;
  }, [location.state]);

  useEffect(() => {
    const state = locationStateRef.current as { targetUserId?: string; targetUserName?: string } | null;
    if (!state?.targetUserId || state.targetUserId === profile.id || isCreatingChatRef.current) return;
    const existingChat = chats.find((c) => c.participants.includes(state.targetUserId!));
    if (existingChat) {
      setActiveChatId(existingChat.id);
      window.history.replaceState({}, document.title);
      locationStateRef.current = null;
    } else {
      isCreatingChatRef.current = true;
      chatService
        .getOrCreateChat(profile.id, state.targetUserId, profile.name, state.targetUserName || 'Usuário')
        .then((id) => {
          setActiveChatId(id);
          window.history.replaceState({}, document.title);
          locationStateRef.current = null;
        })
        .finally(() => { isCreatingChatRef.current = false; });
    }
  }, [chats, profile.id, profile.name]);

  return { activeChatId, setActiveChatId };
}
