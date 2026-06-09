import { vi } from 'vitest';
import { postoService } from './postoService';

const rpcMock = vi.fn();

vi.mock('../lib/supabase', () => ({
  supabase: {
    rpc: (...args: unknown[]) => rpcMock(...args),
    from: vi.fn(() => ({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      }),
    })),
  },
}));

describe('postoService.getHighlightedPosto', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns posto with highest review count from RPC', async () => {
    rpcMock.mockResolvedValue({
      data: [{
        name: 'Genebra',
        slug: 'genebra',
        review_count: 2,
        average_rating: 4.5,
      }],
      error: null,
    });

    const result = await postoService.getHighlightedPosto();
    expect(rpcMock).toHaveBeenCalledWith('get_highlighted_posto');
    expect(result).toEqual({
      name: 'Genebra',
      slug: 'genebra',
      reviewCount: 2,
      averageRating: 4.5,
    });
  });
});