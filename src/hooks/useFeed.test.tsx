import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useFeed } from './useFeed';
import { postService } from '../services/postService';
import { vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { ToastProvider } from '../components/ui/Toast';

const wrapper = ({ children }: { children: React.ReactNode }) =>
  React.createElement(MemoryRouter, null,
    React.createElement(ToastProvider, null, children)
  );

vi.mock('../services/postService', () => ({
  postService: {
    fetchMorePosts: vi.fn().mockResolvedValue({
      posts: [
        { id: '1', title: 'Post about Genebra', body: 'safe', category: 'POSTOS', pinned: false },
        { id: '2', title: 'Carreira', body: 'test', category: 'CARREIRA', pinned: false }
      ],
      lastCreatedAt: null,
      lastId: null
    }),
    createPost: vi.fn()
  }
}));

describe('useFeed Hook', () => {
  const profile: any = { id: 'u1', name: 'Test' };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('filters posts by category correctly', async () => {
    const { result } = renderHook(() => useFeed(profile), { wrapper });

    // Wait for async initial fetch
    await waitFor(() => expect(result.current.filteredPosts).toHaveLength(2));

    act(() => {
      result.current.setFilterCategory('POSTOS');
    });

    expect(result.current.filteredPosts).toHaveLength(1);
    expect(result.current.filteredPosts[0].title).toBe('Post about Genebra');

    act(() => {
      result.current.setFilterCategory('CARREIRA');
    });

    expect(result.current.filteredPosts).toHaveLength(1);
    expect(result.current.filteredPosts[0].title).toBe('Carreira');
  });

  it('filters posts by search string correctly', async () => {
    const { result } = renderHook(() => useFeed(profile), { wrapper });

    // Wait for async initial fetch
    await waitFor(() => expect(result.current.filteredPosts).toHaveLength(2));

    act(() => {
      result.current.setSearch('genebra');
    });

    expect(result.current.filteredPosts).toHaveLength(1);
    expect(result.current.filteredPosts[0].id).toBe('1');
  });
});
