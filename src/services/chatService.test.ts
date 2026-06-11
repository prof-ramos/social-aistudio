import { vi, describe, it, expect, beforeEach } from 'vitest';
import { chatService } from './chatService';

const { rpcMock, fromMock, channelMock, removeChannelMock } = vi.hoisted(() => ({
  rpcMock: vi.fn(),
  fromMock: vi.fn(),
  channelMock: vi.fn(),
  removeChannelMock: vi.fn(),
}));

vi.mock('../lib/supabase', () => ({
  supabase: {
    rpc: rpcMock,
    from: fromMock,
    channel: channelMock,
    removeChannel: removeChannelMock,
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
  // default channel chain so subscribe helpers don't blow up
  const chain: any = { on: vi.fn(() => chain), subscribe: vi.fn(() => chain) };
  channelMock.mockReturnValue(chain);
});

describe('chatService.getOrCreateChat', () => {
  it('calls the RPC with the two user ids and returns the chat id', async () => {
    rpcMock.mockResolvedValue({ data: 'chat-123', error: null });

    const id = await chatService.getOrCreateChat('u1', 'u2', 'Alice', 'Bob');

    expect(rpcMock).toHaveBeenCalledWith('get_or_create_chat', { user1_id: 'u1', user2_id: 'u2' });
    expect(id).toBe('chat-123');
  });

  it('throws when the RPC returns an error', async () => {
    rpcMock.mockResolvedValue({ data: null, error: new Error('not authorized') });
    await expect(chatService.getOrCreateChat('u1', 'u2', 'A', 'B')).rejects.toThrow('not authorized');
  });
});

describe('chatService.sendMessage', () => {
  it('calls the send_chat_message RPC and returns the message id', async () => {
    rpcMock.mockResolvedValue({ data: 'msg-uuid-1', error: null });

    const result = await chatService.sendMessage('chat-1', 'u1', 'olá');

    expect(rpcMock).toHaveBeenCalledWith('send_chat_message', {
      p_chat_id: 'chat-1',
      p_sender_id: 'u1',
      p_body: 'olá',
    });
    expect(result).toBe('msg-uuid-1');
  });

  it('throws when the RPC returns an error', async () => {
    rpcMock.mockResolvedValue({ data: null, error: new Error('rpc failed') });

    await expect(chatService.sendMessage('chat-1', 'u1', 'x')).rejects.toThrow('rpc failed');
  });
});

describe('chatService.markMessagesAsRead', () => {
  it('marks others\' messages in the chat as read', async () => {
    const neq = vi.fn().mockResolvedValue({ error: null });
    const eq = vi.fn().mockReturnValue({ neq });
    const update = vi.fn().mockReturnValue({ eq });
    fromMock.mockReturnValue({ update });

    await chatService.markMessagesAsRead('chat-1', 'u1');

    expect(update).toHaveBeenCalledWith({ read: true });
    expect(eq).toHaveBeenCalledWith('chat_id', 'chat-1');
    expect(neq).toHaveBeenCalledWith('sender_id', 'u1');
  });

  it('throws on error', async () => {
    const neq = vi.fn().mockResolvedValue({ error: new Error('rls denied') });
    const eq = vi.fn().mockReturnValue({ neq });
    fromMock.mockReturnValue({ update: vi.fn().mockReturnValue({ eq }) });

    await expect(chatService.markMessagesAsRead('chat-1', 'u1')).rejects.toThrow('rls denied');
  });
});

describe('chatService.subscribeToChatMessages', () => {
  it('fetches with limit(50) and maps rows to the ChatMessage shape', async () => {
    const limit = vi.fn().mockResolvedValue({
      data: [{ id: 'm1', sender_id: 'u2', body: 'oi', created_at: '2026-06-10', read: false }],
      error: null,
    });
    const order = vi.fn().mockReturnValue({ limit });
    const eq = vi.fn().mockReturnValue({ order });
    const select = vi.fn().mockReturnValue({ eq });
    fromMock.mockReturnValue({ select });

    const onUpdate = vi.fn();
    const unsubscribe = chatService.subscribeToChatMessages('chat-1', onUpdate);
    // the eager fetch resolves on a microtask
    await vi.waitFor(() => expect(onUpdate).toHaveBeenCalled());

    expect(limit).toHaveBeenCalledWith(50);
    expect(onUpdate).toHaveBeenCalledWith([
      { id: 'm1', senderId: 'u2', body: 'oi', createdAt: '2026-06-10', read: false },
    ]);

    unsubscribe();
    expect(removeChannelMock).toHaveBeenCalled();
  });
});
