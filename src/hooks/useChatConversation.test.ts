import { renderHook, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { useChatConversation } from './useChatConversation';
import { chatService } from '../services/chatService';

vi.mock('../services/chatService', () => ({
  chatService: {
    markMessagesAsRead: vi.fn().mockResolvedValue(undefined),
    subscribeToChatMessages: vi.fn((_chatId, cb) => {
      cb([]);
      return vi.fn();
    }),
    sendMessage: vi.fn(),
  },
}));

describe('useChatConversation', () => {
  it('marks messages as read when opening a chat', async () => {
    renderHook(() =>
      useChatConversation('chat-1', 'user-1', [{ id: 'chat-1', participants: ['user-1', 'user-2'] } as any])
    );

    await waitFor(() => {
      expect(chatService.markMessagesAsRead).toHaveBeenCalledWith('chat-1', 'user-1');
    });
  });
});