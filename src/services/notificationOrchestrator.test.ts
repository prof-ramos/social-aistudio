import { vi } from 'vitest';
import { notifyMentions } from './notificationOrchestrator';
import { supabase } from '../lib/supabase';
import { notificationService } from './notificationService';

const mockFrom = vi.fn();
const mockNeq = vi.fn();
const mockOr = vi.fn();
const mockSelect = vi.fn();

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
  },
}));

vi.mock('./notificationService', () => ({
  notificationService: {
    createNotification: vi.fn().mockResolvedValue({}),
  },
}));

describe('notificationOrchestrator - notifyMentions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFrom.mockReturnValue({
      select: mockSelect,
    });
    mockSelect.mockReturnValue({
      or: mockOr,
    });
    mockOr.mockReturnValue({
      neq: mockNeq,
    });
  });

  it('notifies user when mentioned case-insensitively with Unicode characters', async () => {
    const mockUsers = [
      { id: 'u2', name: 'João André' },
    ];
    mockNeq.mockResolvedValue({
      data: mockUsers,
      error: null,
    });

    await notifyMentions('Olá @joão andré, tudo bem?', 'MENTION_POST', 'p1', 'Maria', 'u1');

    // Should fetch from users_public table
    expect(mockFrom).toHaveBeenCalledWith('users_public');
    expect(mockSelect).toHaveBeenCalledWith('id, name');
    expect(mockOr).toHaveBeenCalledWith('name.ilike."joão andré"');
    expect(mockNeq).toHaveBeenCalledWith('id', 'u1');

    // Should trigger notification creation for u2
    expect(notificationService.createNotification).toHaveBeenCalledWith({
      userId: 'u2',
      type: 'MENTION_POST',
      actorName: 'Maria',
      postId: 'p1',
      message: 'Maria mencionou você em um post',
      link: '/feed/p1',
    });
  });

  it('does not notify if no mentions are found in text', async () => {
    await notifyMentions('Texto comum sem menção.', 'MENTION_POST', 'p1', 'Maria', 'u1');

    expect(mockFrom).not.toHaveBeenCalled();
    expect(notificationService.createNotification).not.toHaveBeenCalled();
  });
});
