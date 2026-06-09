import { renderHook, act } from '@testing-library/react';
import { vi } from 'vitest';
import { useAdminModeration } from './useAdminModeration';
import { adminService } from '../services/adminService';
import { postService } from '../services/postService';

vi.mock('../services/adminService', () => ({
  adminService: {
    subscribeToReports: vi.fn((cb) => {
      cb([{
        id: 'r1',
        type: 'POST',
        contentId: 'p1',
        preview: 'test',
        reportedBy: 'u1',
        reason: 'Spam',
        status: 'PENDING',
        createdAt: new Date().toISOString(),
      }]);
      return vi.fn();
    }),
    updateReportStatus: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('../services/postService', () => ({
  postService: {
    softDeletePost: vi.fn().mockResolvedValue(undefined),
    softDeleteComment: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('../services/postoService', () => ({
  postoService: { softDeleteField: vi.fn() },
}));

vi.mock('../components/ui/Toast', () => ({
  useToast: () => ({ addToast: vi.fn() }),
}));

describe('useAdminModeration', () => {
  it('calls softDeletePost when resolving as RESOLVED_REMOVED for POST', async () => {
    const { result } = renderHook(() => useAdminModeration());

    act(() => {
      result.current.setResolvingId('r1');
      result.current.setAction('RESOLVED_REMOVED');
      result.current.setNotes('Conteúdo removido');
    });

    await act(async () => {
      await result.current.handleResolve('r1', { preventDefault: vi.fn() } as any);
    });

    expect(postService.softDeletePost).toHaveBeenCalledWith('p1');
    expect(adminService.updateReportStatus).toHaveBeenCalledWith('r1', 'RESOLVED_REMOVED', 'Conteúdo removido');
  });
});