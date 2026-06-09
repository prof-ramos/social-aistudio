import { vi } from 'vitest';
import { searchService } from './searchService';

const limitMock = vi.fn().mockResolvedValue({ data: [], error: null });

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnValue({
        ilike: vi.fn().mockReturnValue({
          limit: limitMock,
          is: vi.fn().mockReturnValue({ limit: limitMock }),
        }),
      }),
    })),
  },
}));

describe('searchService.searchAll', () => {
  it('returns grouped users, posts, and postos structure', async () => {
    const result = await searchService.searchAll('gen');
    expect(result).toEqual({ users: [], posts: [], postos: [] });
    expect(result).toHaveProperty('users');
    expect(result).toHaveProperty('posts');
    expect(result).toHaveProperty('postos');
  });
});