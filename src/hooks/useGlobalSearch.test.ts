import { renderHook, act } from '@testing-library/react';
import { vi } from 'vitest';
import { useGlobalSearch } from './useGlobalSearch';
import { searchService } from '../services/searchService';

vi.mock('../services/searchService', () => ({
  searchService: {
    searchAll: vi.fn().mockResolvedValue({ users: [], posts: [], postos: [] }),
  },
}));

describe('useGlobalSearch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('does not search when query is shorter than 2 characters', async () => {
    const { result } = renderHook(() => useGlobalSearch());

    act(() => {
      result.current.setQuery('g');
    });

    await act(async () => {
      vi.advanceTimersByTime(400);
    });

    expect(searchService.searchAll).not.toHaveBeenCalled();
    expect(result.current.results).toEqual({ users: [], posts: [], postos: [] });
  });

  it('debounces search and calls searchAll after 300ms', async () => {
    const { result } = renderHook(() => useGlobalSearch());

    act(() => {
      result.current.setQuery('gene');
    });

    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    expect(searchService.searchAll).toHaveBeenCalledWith('gene');
  });
});