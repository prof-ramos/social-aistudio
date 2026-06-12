import { describe, it, expect, vi, beforeEach } from 'vitest';
import { notifyMentions, extractMentions } from './notificationOrchestrator';

const mockNeq = vi.fn();
const mockIn = vi.fn();
const mockSelect = vi.fn();

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

import { notificationService } from './notificationService';

describe('extractMentions', () => {
  it('returns empty array when no mentions found', () => {
    expect(extractMentions('Hello world')).toEqual([]);
  });

  it('extracts simple @mentions', () => {
    expect(extractMentions('Hello @João')).toEqual(['João']);
  });

  it('extracts accented Portuguese names', () => {
    expect(extractMentions('@João @André @José')).toEqual(['João', 'André', 'José']);
  });

  it('extracts names with hyphens and apostrophes', () => {
    expect(extractMentions('@Mary-Jane @O\'Connor')).toEqual(['Mary-Jane', "O'Connor"]);
  });

  it('deduplicates repeated mentions', () => {
    expect(extractMentions('@João @João @João')).toEqual(['João']);
  });

  it('does not greedily capture trailing words like "and"', () => {
    const mentions = extractMentions('@João and @Maria');
    expect(mentions).not.toContain('João and');
    expect(mentions).toContain('João');
    expect(mentions).toContain('Maria');
  });

  it('ignores @ symbols not followed by a name', () => {
    expect(extractMentions('email@example.com')).toEqual([]);
  });
});

describe('notifyMentions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSelect.mockReturnValue({ in: mockIn });
  });

  it('does nothing when no mentions are found', async () => {
    await notifyMentions('Hello world', 'MENTION_POST', 'p1', 'Author', 'u1');
    expect(mockSelect).not.toHaveBeenCalled();
  });

  it('queries for mentioned user names', async () => {
    mockIn.mockReturnValue({ neq: mockNeq });
    mockNeq.mockResolvedValue({ data: [{ id: 'u2', name: 'João' }], error: null });

    await notifyMentions('Hello @João', 'MENTION_POST', 'p1', 'Author', 'u1');

    expect(mockSelect).toHaveBeenCalledWith('id, name');
    expect(mockIn).toHaveBeenCalledWith('name', ['João']);
    expect(mockNeq).toHaveBeenCalledWith('id', 'u1');
  });

  it('creates notifications for matched users', async () => {
    mockIn.mockReturnValue({ neq: mockNeq });
    mockNeq.mockResolvedValue({
      data: [
        { id: 'u2', name: 'João' },
        { id: 'u3', name: 'Maria' },
      ],
      error: null,
    });

    await notifyMentions('@João and @Maria', 'MENTION_COMMENT', 'p2', 'Author', 'u1');

    expect(notificationService.createNotification).toHaveBeenCalledTimes(2);
    expect(notificationService.createNotification).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'u2', type: 'MENTION_COMMENT' })
    );
    expect(notificationService.createNotification).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'u3', type: 'MENTION_COMMENT' })
    );
  });

  it('queries only the names actually mentioned (not all users)', async () => {
    mockIn.mockReturnValue({ neq: mockNeq });
    mockNeq.mockResolvedValue({ data: [], error: null });

    await notifyMentions('@André', 'MENTION_POST', 'p1', 'Author', 'u1');

    expect(mockIn).toHaveBeenCalledWith('name', ['André']);
  });

  it('excludes the actor from notifications', async () => {
    mockIn.mockReturnValue({ neq: mockNeq });
    mockNeq.mockResolvedValue({ data: [], error: null });

    await notifyMentions('@Author', 'MENTION_POST', 'p1', 'Author', 'u1');

    expect(mockNeq).toHaveBeenCalledWith('id', 'u1');
  });

  it('returns early on database error', async () => {
    mockIn.mockReturnValue({ neq: mockNeq });
    mockNeq.mockResolvedValue({ data: null, error: new Error('db error') });

    await notifyMentions('@João', 'MENTION_POST', 'p1', 'Author', 'u1');

    expect(notificationService.createNotification).not.toHaveBeenCalled();
  });

  it('handles empty result set gracefully', async () => {
    mockIn.mockReturnValue({ neq: mockNeq });
    mockNeq.mockResolvedValue({ data: [], error: null });

    await notifyMentions('@Nonexistent', 'MENTION_POST', 'p1', 'Author', 'u1');

    expect(notificationService.createNotification).not.toHaveBeenCalled();
  });
});