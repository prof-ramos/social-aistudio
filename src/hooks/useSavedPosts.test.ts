import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useSavedPosts } from './useSavedPosts';
import { userService } from '../services/userService';

vi.mock('../services/userService');
// useSavedPosts pulls addToast from the Toast context; stub it so the hook can
// run without a ToastProvider wrapper.
vi.mock('../components/ui/Toast', () => ({
  useToast: () => ({ addToast: vi.fn() }),
}));

const toggleSavedPost = userService.toggleSavedPost as unknown as ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
  toggleSavedPost.mockResolvedValue(undefined);
});

describe('useSavedPosts', () => {
  it('saves a post: toggling an unsaved post marks it saved and calls the service', async () => {
    const { result } = renderHook(() => useSavedPosts('user1', []));

    expect(result.current.isSaved('p1')).toBe(false);

    await act(async () => {
      await result.current.toggle('p1');
    });

    expect(result.current.isSaved('p1')).toBe(true);
    expect(result.current.savedCount).toBe(1);
    expect(toggleSavedPost).toHaveBeenCalledWith('user1', 'p1');
  });

  it('unsaves a post: toggling a seeded-saved post removes it', async () => {
    const { result } = renderHook(() => useSavedPosts('user1', ['p1']));

    expect(result.current.isSaved('p1')).toBe(true);

    await act(async () => {
      await result.current.toggle('p1');
    });

    expect(result.current.isSaved('p1')).toBe(false);
    expect(result.current.savedCount).toBe(0);
  });

  it('reverts the optimistic state when the service call fails', async () => {
    toggleSavedPost.mockRejectedValueOnce(new Error('network'));
    const { result } = renderHook(() => useSavedPosts('user1', []));

    await act(async () => {
      await result.current.toggle('p1');
    });

    // back to the pre-click value — no permanent optimistic state
    expect(result.current.isSaved('p1')).toBe(false);
    expect(result.current.savedCount).toBe(0);
  });

  it('seeds saved state from the initial profile snapshot', () => {
    const { result } = renderHook(() => useSavedPosts('user1', ['a', 'b']));

    expect(result.current.savedCount).toBe(2);
    expect(result.current.isSaved('a')).toBe(true);
    expect(result.current.isSaved('b')).toBe(true);
    expect(result.current.isSaved('c')).toBe(false);
  });
});
