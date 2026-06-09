import { vi } from 'vitest';
import { postService } from './postService';

const mockFrom = vi.fn();

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
  },
}));

describe('postService mutations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('updatePost updates title, body, and category', async () => {
    const mockSingle = vi.fn().mockResolvedValue({
      data: {
        id: 'p1',
        title: 'Updated',
        body: '<p>body</p>',
        category: 'GERAL',
        author_id: 'u1',
        pinned: false,
        created_at: '2026-01-01',
        users_public: { name: 'Test', role: 'MEMBRO_ATIVO' },
      },
      error: null,
    });
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
    const mockEq = vi.fn().mockReturnValue({ select: mockSelect });
    const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });
    mockFrom.mockReturnValue({ update: mockUpdate });

    const result = await postService.updatePost('p1', {
      title: 'Updated',
      body: '<p>body</p>',
      category: 'GERAL',
    });

    expect(mockUpdate).toHaveBeenCalledWith({
      title: 'Updated',
      body: '<p>body</p>',
      category: 'GERAL',
    });
    expect(result.title).toBe('Updated');
  });

  it('softDeletePost sets deleted_at', async () => {
    const mockEq = vi.fn().mockResolvedValue({ error: null });
    const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });
    mockFrom.mockReturnValue({ update: mockUpdate });

    await postService.softDeletePost('p1');

    expect(mockUpdate).toHaveBeenCalledWith({ deleted_at: expect.any(String) });
    expect(mockEq).toHaveBeenCalledWith('id', 'p1');
  });
});