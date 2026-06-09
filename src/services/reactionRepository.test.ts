import { describe, it, expect, vi, beforeEach } from 'vitest';
import { reactionRepository } from './reactionRepository';

// Factory must be self-contained because vi.mock is hoisted
vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        in: vi.fn().mockResolvedValue({ data: [], error: null }),
      }),
      delete: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      }),
      insert: vi.fn().mockReturnValue({
        insert: vi.fn().mockResolvedValue({ error: null }),
      }),
    }),
  },
}));

import { supabase } from '../lib/supabase';

describe('reactionRepository', () => {
  const basePost = {
    id: 'p1',
    title: 'Post 1',
    body: 'body',
    category: 'GERAL',
    authorName: 'A',
    authorRole: 'MEMBRO_ATIVO' as const,
    authorId: 'a1',
    pinned: false,
    createdAt: '2026-01-01',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('attachToPosts', () => {
    it('returns empty array when no posts provided', async () => {
      const result = await reactionRepository.attachToPosts([]);
      expect(result).toEqual([]);
      expect(supabase.from).not.toHaveBeenCalled();
    });

    it('attaches reactions grouped by emoji', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        in: vi.fn().mockResolvedValue({
          data: [
            { post_id: 'p1', emoji: '👍', user_id: 'u1' },
            { post_id: 'p1', emoji: '👍', user_id: 'u2' },
            { post_id: 'p1', emoji: '❤️', user_id: 'u1' },
            { post_id: 'p2', emoji: '😂', user_id: 'u3' },
          ],
          error: null,
        }),
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
      } as any);

      const posts = [
        { ...basePost, id: 'p1' },
        { ...basePost, id: 'p2' },
      ];

      const result = await reactionRepository.attachToPosts(posts);

      expect(mockSelect).toHaveBeenCalledWith('*');
      expect(result[0].reactions).toEqual({
        '👍': ['u1', 'u2'],
        '❤️': ['u1'],
      });
      expect(result[1].reactions).toEqual({
        '😂': ['u3'],
      });
    });

    it('returns posts without reactions when DB fetch fails', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        in: vi.fn().mockResolvedValue({ data: null, error: new Error('DB error') }),
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
      } as any);

      const posts = [{ ...basePost }];
      const result = await reactionRepository.attachToPosts(posts);
      expect(result[0].reactions).toBeUndefined();
    });

    it('returns posts without reactions field when no reactions exist', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        in: vi.fn().mockResolvedValue({ data: [], error: null }),
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
      } as any);

      const posts = [{ ...basePost }];
      const result = await reactionRepository.attachToPosts(posts);
      expect(result[0].reactions).toEqual({});
    });
  });

  describe('toggleReaction', () => {
    it('deletes existing reaction', async () => {
      const deleteEq = vi.fn().mockResolvedValue({ error: null });
      const deleteFn = vi.fn().mockReturnValue({ eq: deleteEq });
      const maybeSingle = vi.fn().mockResolvedValue({ data: { id: 'r1' }, error: null });
      const eq3 = vi.fn().mockReturnValue({ maybeSingle });
      const eq2 = vi.fn().mockReturnValue({ eq: eq3 });
      const eq1 = vi.fn().mockReturnValue({ eq: eq2 });
      const selectFn = vi.fn().mockReturnValue({ eq: eq1 });

      vi.mocked(supabase.from).mockReturnValue({
        select: selectFn,
        delete: deleteFn,
      } as any);

      await reactionRepository.toggleReaction('p1', '👍', 'u1');

      expect(eq1).toHaveBeenCalledWith('post_id', 'p1');
      expect(eq2).toHaveBeenCalledWith('emoji', '👍');
      expect(eq3).toHaveBeenCalledWith('user_id', 'u1');
      expect(deleteEq).toHaveBeenCalledWith('id', 'r1');
    });

    it('inserts new reaction when none exists', async () => {
      const insertFn = vi.fn().mockResolvedValue({ error: null });
      const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
      const eq3 = vi.fn().mockReturnValue({ maybeSingle });
      const eq2 = vi.fn().mockReturnValue({ eq: eq3 });
      const eq1 = vi.fn().mockReturnValue({ eq: eq2 });
      const selectFn = vi.fn().mockReturnValue({ eq: eq1 });

      vi.mocked(supabase.from).mockReturnValue({
        select: selectFn,
        insert: insertFn,
      } as any);

      await reactionRepository.toggleReaction('p1', '👍', 'u1');

      expect(insertFn).toHaveBeenCalled();
    });

    it('throws when select query fails', async () => {
      const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: new Error('select failed') });
      const eq3 = vi.fn().mockReturnValue({ maybeSingle });
      const eq2 = vi.fn().mockReturnValue({ eq: eq3 });
      const eq1 = vi.fn().mockReturnValue({ eq: eq2 });
      const selectFn = vi.fn().mockReturnValue({ eq: eq1 });

      vi.mocked(supabase.from).mockReturnValue({
        select: selectFn,
      } as any);

      await expect(reactionRepository.toggleReaction('p1', '👍', 'u1')).rejects.toThrow('select failed');
    });
  });
});
