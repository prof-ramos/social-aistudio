import { vi, describe, it, expect, beforeEach } from 'vitest';
import { reportService } from './reportService';

const { fromMock } = vi.hoisted(() => ({
  fromMock: vi.fn(),
}));

vi.mock('../lib/supabase', () => ({
  supabase: { from: fromMock },
}));

const mockInsert = (result: { data: unknown; error: unknown }) => {
  const single = vi.fn().mockResolvedValue(result);
  const select = vi.fn().mockReturnValue({ single });
  const insert = vi.fn().mockReturnValue({ select });
  fromMock.mockReturnValue({ insert });
  return { insert, select, single };
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('reportService.createReport', () => {
  it('inserts with preview truncated to 100 chars and returns the row on success', async () => {
    const row = { id: 'rpt-1', status: 'PENDING' };
    const { insert } = mockInsert({ data: row, error: null });

    const longPreview = 'a'.repeat(200);

    const result = await reportService.createReport(
      'post',
      'post-123',
      longPreview,
      'user-1',
      'Spam'
    );

    expect(insert).toHaveBeenCalledWith({
      type: 'post',
      content_id: 'post-123',
      preview: 'a'.repeat(100),
      reported_by: 'user-1',
      reason: 'Spam',
      status: 'PENDING',
    });
    expect(result).toBe(row);
  });

  it('throws when Supabase returns an error', async () => {
    mockInsert({ data: null, error: new Error('insert failed') });

    await expect(
      reportService.createReport('comment', 'c-1', 'short', 'user-2', 'Abuse')
    ).rejects.toThrow('insert failed');
  });
});
