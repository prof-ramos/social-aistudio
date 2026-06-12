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

const MOCK_POSTS = [
  { id: '1', title: 'Post about Genebra', body: 'safe', category: 'POSTOS', pinned: false, authorId: 'a1', authorName: 'Alice', authorRole: 'MEMBRO_ATIVO', createdAt: '2026-01-01' },
  { id: '2', title: 'Carreira', body: 'test', category: 'CARREIRA', pinned: false, authorId: 'a2', authorName: 'Bob', authorRole: 'MEMBRO_ATIVO', createdAt: '2026-01-02' }
];

vi.mock('../services/postService', () => ({
  postService: {
    subscribeToFeed: vi.fn((cb) => {
      cb([...MOCK_POSTS]);
      return vi.fn();
    }),
    fetchMorePosts: vi.fn(async () => ({
      posts: [...MOCK_POSTS],
      hasMore: true
    })),
    createPost: vi.fn(),
    getPostCountByAuthor: vi.fn(async () => 2)
  }
}));

describe('useFeed Hook', () => {
  const profile: any = { id: 'u1', name: 'Test' };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('filters posts by category correctly', async () => {
    const { result } = renderHook(() => useFeed(profile), { wrapper });

    // Wait for initial async fetch to populate posts
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

    // Wait for initial async fetch to populate posts
    await waitFor(() => expect(result.current.filteredPosts).toHaveLength(2));

    act(() => {
      result.current.setSearch('genebra');
    });

    await waitFor(() => expect(result.current.filteredPosts).toHaveLength(1));
    expect(result.current.filteredPosts[0].id).toBe('1');
  });

  it('loads the author post count for the profile sidebar', async () => {
    const { result } = renderHook(() => useFeed(profile), { wrapper });

    await waitFor(() => expect(result.current.postCount).toBe(2));
    expect(postService.getPostCountByAuthor).toHaveBeenCalledWith('u1');
  });
});
