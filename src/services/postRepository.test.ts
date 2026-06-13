import { describe, it, expect, vi, beforeEach } from 'vitest';
import { postRepository, mapPostRow, mapCommentRow } from './postRepository';

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
      lt: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
    }),
    channel: vi.fn().mockReturnValue({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnThis(),
    }),
    removeChannel: vi.fn(),
  },
}));

import { supabase } from '../lib/supabase';

vi.mock('./reactionRepository', () => ({
  reactionRepository: {
    attachToPosts: vi.fn().mockImplementation(async (posts: any[]) => posts.map((p: any) => ({ ...p, reactions: {} }))),
  },
}));

describe('postRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('mapPostRow', () => {
    it('maps a post row with joined user object', () => {
      const row = {
        id: 'p1',
        title: 'Test',
        body: '<p>Hello</p>',
        category: 'GERAL',
        author_id: 'u1',
        pinned: true,
        created_at: '2026-01-01T00:00:00Z',
        comment_count: 5,
        users_public: { name: 'Author', role: 'ADMIN' },
      };

      const post = mapPostRow(row);

      expect(post.id).toBe('p1');
      expect(post.title).toBe('Test');
      expect(post.body).toBe('<p>Hello</p>');
      expect(post.category).toBe('GERAL');
      expect(post.authorId).toBe('u1');
      expect(post.authorName).toBe('Author');
      expect(post.authorRole).toBe('ADMIN');
      expect(post.pinned).toBe(true);
      expect(post.createdAt).toBe('2026-01-01T00:00:00Z');
      expect(post.commentCount).toBe(5);
    });

    it('handles array user fallback', () => {
      const row = {
        id: 'p1',
        title: 'Test',
        body: 'body',
        category: 'GERAL',
        author_id: 'u1',
        pinned: false,
        created_at: '2026-01-01',
        comment_count: 0,
        users_public: [{ name: 'First', role: 'MEMBRO_ATIVO' }],
      };

      const post = mapPostRow(row);
      expect(post.authorName).toBe('First');
      expect(post.authorRole).toBe('MEMBRO_ATIVO');
    });

    it('handles missing user gracefully', () => {
      const row = {
        id: 'p1',
        title: 'Test',
        body: 'body',
        category: 'GERAL',
        author_id: 'u1',
        pinned: false,
        created_at: '2026-01-01',
        users_public: null,
      };

      const post = mapPostRow(row);
      expect(post.authorName).toBe('');
      expect(post.authorRole).toBe('');
    });
  });

  describe('mapCommentRow', () => {
    it('maps a comment row correctly', () => {
      const row = {
        id: 'c1',
        post_id: 'p1',
        author_id: 'u2',
        body: 'Nice post',
        created_at: '2026-02-01T00:00:00Z',
        users_public: { name: 'Commenter', role: 'MEMBRO_ATIVO' },
      };

      const comment = mapCommentRow(row);

      expect(comment.id).toBe('c1');
      expect(comment.postId).toBe('p1');
      expect(comment.authorId).toBe('u2');
      expect(comment.body).toBe('Nice post');
      expect(comment.createdAt).toBe('2026-02-01T00:00:00Z');
      expect(comment.authorName).toBe('Commenter');
      expect(comment.authorRole).toBe('MEMBRO_ATIVO');
    });
  });

  describe('getPostsByIds', () => {
    it('returns empty array when no ids provided', async () => {
      const result = await postRepository.getPostsByIds([]);
      expect(result).toEqual([]);
      expect(supabase.from).not.toHaveBeenCalled();
    });

    it('fetches and maps posts by ids', async () => {
      const mockIn = vi.fn().mockResolvedValue({
        data: [{
          id: 'p1',
          title: 'Test',
          body: 'body',
          category: 'GERAL',
          author_id: 'u1',
          pinned: false,
          created_at: '2026-01-01',
          users_public: { name: 'Author', role: 'ADMIN' },
        }],
        error: null,
      });
      const mockSelect = vi.fn().mockReturnValue({ in: mockIn });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
      } as any);

      const result = await postRepository.getPostsByIds(['p1']);

      expect(mockSelect).toHaveBeenCalledWith('*, users_public!author_id(name, role)');
      expect(mockIn).toHaveBeenCalledWith('id', ['p1']);
      expect(result.length).toBe(1);
      expect(result[0].id).toBe('p1');
    });

    it('throws when DB returns error', async () => {
      const mockIn = vi.fn().mockResolvedValue({ data: null, error: new Error('db fail') });
      const mockSelect = vi.fn().mockReturnValue({ in: mockIn });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
      } as any);

      await expect(postRepository.getPostsByIds(['p1'])).rejects.toThrow('db fail');
    });
  });

  describe('getPostsByAuthor', () => {
    it('fetches posts for an author', async () => {
      const mockOrder = vi.fn().mockResolvedValue({
        data: [{
          id: 'p1',
          title: 'Test',
          body: 'body',
          category: 'GERAL',
          author_id: 'u1',
          pinned: false,
          created_at: '2026-01-01',
          users_public: { name: 'Author', role: 'ADMIN' },
        }],
        error: null,
      });
      const mockIs = vi.fn().mockReturnValue({ order: mockOrder });
      const mockEq = vi.fn().mockReturnValue({ is: mockIs });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
      } as any);

      const result = await postRepository.getPostsByAuthor('u1');
      expect(result.length).toBe(1);
      expect(mockEq).toHaveBeenCalledWith('author_id', 'u1');
      expect(mockIs).toHaveBeenCalledWith('deleted_at', null);
    });
  });

  describe('getPost', () => {
    it('returns null for PGRST116 (not found)', async () => {
      const mockSingle = vi.fn().mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'Not found' },
      });
      const mockEq = vi.fn().mockReturnValue({ single: mockSingle });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
      } as any);

      const result = await postRepository.getPost('p1');
      expect(result).toBeNull();
    });

    it('throws on unexpected DB error', async () => {
      const mockSingle = vi.fn().mockResolvedValue({
        data: null,
        error: new Error('db error'),
      });
      const mockEq = vi.fn().mockReturnValue({ single: mockSingle });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
      } as any);

      await expect(postRepository.getPost('p1')).rejects.toThrow('db error');
    });
  });

  describe('createPost', () => {
    it('creates a post and returns mapped result', async () => {
      const mockSingle = vi.fn().mockResolvedValue({
        data: {
          id: 'p1',
          title: 'Title',
          body: '<p>Body</p>',
          category: 'GERAL',
          author_id: 'u1',
          pinned: false,
          created_at: '2026-01-01',
          users_public: { name: 'Author', role: 'ADMIN' },
        },
        error: null,
      });
      const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
      const mockInsert = vi.fn().mockReturnValue({ select: mockSelect });

      vi.mocked(supabase.from).mockReturnValue({
        insert: mockInsert,
      } as any);

      const profile = { id: 'u1', name: 'Author', email: 'a@b.com', role: 'ADMIN' as const };
      const result = await postRepository.createPost('Title', '<p>Body</p>', 'GERAL', profile);

      expect(result.title).toBe('Title');
      expect(result.body).toBe('<p>Body</p>');
      expect(result.authorId).toBe('u1');
    });
  });

  describe('softDeletePost', () => {
    it('updates deleted_at timestamp', async () => {
      const mockEq = vi.fn().mockResolvedValue({ error: null });
      const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });

      vi.mocked(supabase.from).mockReturnValue({
        update: mockUpdate,
      } as any);

      await postRepository.softDeletePost('p1');

      expect(mockUpdate).toHaveBeenCalled();
      const updateArg = mockUpdate.mock.calls[0][0];
      expect(updateArg.deleted_at).toBeDefined();
      expect(mockEq).toHaveBeenCalledWith('id', 'p1');
    });
  });

  describe('getPostCountByAuthor', () => {
    it('returns count for an author', async () => {
      const mockEq = vi.fn().mockResolvedValue({ count: 42, error: null });
      const mockIs = vi.fn().mockReturnValue({ eq: mockEq });
      const mockSelect = vi.fn().mockReturnValue({ is: mockIs });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
      } as any);

      const result = await postRepository.getPostCountByAuthor('u1');
      expect(result).toBe(42);
    });

    it('returns null on error', async () => {
      const mockEq = vi.fn().mockResolvedValue({ count: null, error: new Error('fail') });
      const mockIs = vi.fn().mockReturnValue({ eq: mockEq });
      const mockSelect = vi.fn().mockReturnValue({ is: mockIs });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
      } as any);

      const result = await postRepository.getPostCountByAuthor('u1');
      expect(result).toBeNull();
    });
  });

  describe('subscribeToFeed', () => {
    // Build a feed-query chain that resolves (so fetchFeed() completes) and a
    // channel mock that captures the postgres_changes handlers so we can fire them.
    const setupFeedMocks = () => {
      const queryChain: any = {
        select: vi.fn(() => queryChain),
        is: vi.fn(() => queryChain),
        order: vi.fn(() => queryChain),
        limit: vi.fn(() => Promise.resolve({ data: [], error: null })),
      };
      vi.mocked(supabase.from).mockReturnValue(queryChain);

      const handlers: Array<() => void> = [];
      const channelChain: any = {
        on: vi.fn((_event: any, _config: any, handler: () => void) => {
          handlers.push(handler);
          return channelChain;
        }),
        subscribe: vi.fn(() => channelChain),
      };
      vi.mocked(supabase.channel).mockReturnValue(channelChain);
      return { handlers };
    };

    it('does not fetch eagerly on subscribe (first page comes from the consumer)', async () => {
      const { handlers } = setupFeedMocks();
      const onUpdate = vi.fn();

      const unsubscribe = postRepository.subscribeToFeed(onUpdate, vi.fn(), 10);
      await Promise.resolve();
      await Promise.resolve();

      expect(handlers.length).toBe(1); // posts handler only (reactions are optimistic)
      expect(onUpdate).not.toHaveBeenCalled(); // no eager refetch
      expect(vi.mocked(supabase.from)).not.toHaveBeenCalled();
      unsubscribe();
    });

    it('collapses a burst of channel events into a single debounced refetch', async () => {
      vi.useFakeTimers();
      const { handlers } = setupFeedMocks();
      const onUpdate = vi.fn();

      const unsubscribe = postRepository.subscribeToFeed(onUpdate, vi.fn(), 10);

      // Fire the handler multiple times in quick succession (a burst of events).
      handlers[0]();
      handlers[0]();
      expect(onUpdate).not.toHaveBeenCalled(); // nothing before the window elapses

      await vi.advanceTimersByTimeAsync(250);
      expect(onUpdate).toHaveBeenCalledTimes(1); // single refetch for the whole burst
      expect(vi.mocked(supabase.from)).toHaveBeenCalledWith('posts');
      expect((vi.mocked(supabase.from).mock.results[0].value as any).is).toHaveBeenCalledWith('deleted_at', null);

      unsubscribe();
      vi.useRealTimers();
    });

    it('cleanup clears the pending debounce timer (no refetch after unmount)', async () => {
      vi.useFakeTimers();
      const { handlers } = setupFeedMocks();
      const onUpdate = vi.fn();

      const unsubscribe = postRepository.subscribeToFeed(onUpdate, vi.fn(), 10);
      handlers[0](); // schedule a fetch
      unsubscribe(); // ...then unmount before the window elapses

      await vi.advanceTimersByTimeAsync(250);
      expect(onUpdate).not.toHaveBeenCalled();
      vi.useRealTimers();
    });
  });

  describe('fetchMorePosts', () => {
    const buildQueryChain = (resolver: () => Promise<any>) => {
      const chain: any = {
        select: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockImplementation(() => resolver()),
      };
      return chain;
    };

    it('uses offset-based pagination with range', async () => {
      const mockRows = [
        { id: 'p3', title: 'Third', body: 'b3', category: 'GERAL', author_id: 'u1', pinned: false, created_at: '2026-01-03', comment_count: 0, users_public: { name: 'A', role: 'ADMIN' } },
        { id: 'p2', title: 'Second', body: 'b2', category: 'GERAL', author_id: 'u1', pinned: false, created_at: '2026-01-02', comment_count: 0, users_public: { name: 'A', role: 'ADMIN' } },
      ];
      const chain = buildQueryChain(() => Promise.resolve({ data: mockRows, error: null }));

      vi.mocked(supabase.from).mockReturnValue(chain);

      const result = await postRepository.fetchMorePosts(10, 10);

      expect(chain.range).toHaveBeenCalledWith(10, 19);
      expect(chain.is).toHaveBeenCalledWith('deleted_at', null);
      expect(result.posts).toHaveLength(2);
      expect(result.hasMore).toBe(false); // fewer rows than pageSize
    });

    it('returns hasMore=true when rows fill the page', async () => {
      const mockRows = Array.from({ length: 10 }, (_, i) => ({
        id: `p${i}`, title: `Post ${i}`, body: 'b', category: 'GERAL', author_id: 'u1', pinned: false, created_at: '2026-01-01', comment_count: 0, users_public: { name: 'A', role: 'ADMIN' },
      }));
      const chain = buildQueryChain(() => Promise.resolve({ data: mockRows, error: null }));

      vi.mocked(supabase.from).mockReturnValue(chain);

      const result = await postRepository.fetchMorePosts(0, 10);

      expect(result.hasMore).toBe(true);
    });

    it('throws on database error', async () => {
      const chain = buildQueryChain(() => Promise.resolve({ data: null, error: new Error('db fail') }));

      vi.mocked(supabase.from).mockReturnValue(chain);

      await expect(postRepository.fetchMorePosts(0, 10)).rejects.toThrow('db fail');
    });
  });

});
