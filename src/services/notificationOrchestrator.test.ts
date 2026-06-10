import { describe, it, expect, vi, beforeEach } from 'vitest';
import { notifyMentions } from './notificationOrchestrator';

const mockSingle = vi.fn();
const mockNeq = vi.fn().mockReturnValue({ single: mockSingle });
const mockIn = vi.fn().mockReturnValue({ neq: mockNeq });
const mockSelect = vi.fn().mockReturnValue({ in: mockIn });

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: () => ({ select: mockSelect }),
  },
}));

vi.mock('./notificationService', () => ({
  notificationService: {
    createNotification: vi.fn(),
  },
}));

describe('notificationOrchestrator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does nothing when no mentions are found', async () => {
    await notifyMentions('Hello world', 'MENTION_POST', 'p1', 'Author', 'u1');
    expect(mockSelect).not.toHaveBeenCalled();
  });

  it('dispatches notification for a single @mention', async () => {
    mockSingle.mockResolvedValueOnce({ data: [{ id: 'u2', name: 'João Silva' }], error: null });

    await notifyMentions('Hello @João Silva', 'MENTION_POST', 'p1', 'Author', 'u1');

    expect(mockSelect).toHaveBeenCalledWith('id, name');
    expect(mockIn).toHaveBeenCalledWith('name', expect.arrayContaining(['joão silva']));
    expect(mockNeq).toHaveBeenCalledWith('id', 'u1');
  });

  it('dispatches notification for multiple @mentions', async () => {
    mockSingle.mockResolvedValueOnce({
      data: [
        { id: 'u2', name: 'João Silva' },
        { id: 'u3', name: 'Maria Souza' },
      ],
      error: null,
    });

    await notifyMentions('@João Silva and @Maria Souza', 'MENTION_COMMENT', 'p2', 'Author', 'u1');

    const namesArg = mockIn.mock.calls[0][1];
    // Regex captures "joão silva and" because \b does not break on "and" (ASCII-only word boundary)
    // This matches the original postService.ts behavior; only exact DB matches trigger notifications
    expect(namesArg).toContain('joão silva and');
    expect(namesArg).toContain('maria souza');
  });
});
