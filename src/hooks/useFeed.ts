import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { postService } from '../services/postService';
import { Post, UserProfile } from '../types';
import { useToast } from '../components/ui/Toast';

export type FeedFilter = 'RECENTES' | 'MAIS_COMENTADOS' | 'MEUS_POSTOS';
const PAGE_SIZE = 10;

export function useFeed(profile: UserProfile) {
  const { addToast } = useToast();
  const location = useLocation();
  const [recentPosts, setRecentPosts] = useState<Post[]>([]);
  const [olderPosts, setOlderPosts] = useState<Post[]>([]);
  const [isPosting, setIsPosting] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [filterCategory, setFilterCategory] = useState('TODOS');
  const [search, setSearch] = useState(() => new URLSearchParams(location.search).get('q') || '');
  const [activeFilter, setActiveFilter] = useState<FeedFilter>('RECENTES');
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const lastCreatedAtRef = useRef<string | null>(null);

  // Real-time subscription for the most recent PAGE_SIZE posts
  useEffect(() => {
    const unsub = postService.subscribeToFeed(
      (fetchedPosts) => {
        setRecentPosts(fetchedPosts);
        setHasMore(fetchedPosts.length >= PAGE_SIZE);
      },
      (error) => console.error('Error in feed snapshot:', error),
      PAGE_SIZE
    );
    return () => unsub();
  }, []);

  // Update search state if URL query param changes
  useEffect(() => {
    const nextSearch = new URLSearchParams(location.search).get('q') || '';
    setSearch(prev => prev !== nextSearch ? nextSearch : prev);
  }, [location.search]);

  // Merge recent and older posts, removing duplicates by id
  const posts = useMemo(() => {
    const merged = new Map<string, Post>();
    recentPosts.forEach(p => merged.set(p.id, p));
    olderPosts.forEach(p => {
      if (!merged.has(p.id)) merged.set(p.id, p);
    });
    return Array.from(merged.values());
  }, [recentPosts, olderPosts]);

  const filteredPosts = useMemo(() => {
    const filtered = posts.filter(post => {
      const matchCategory = filterCategory === 'TODOS' || post.category === filterCategory;
      const term = search.toLowerCase();
      const matchSearch = !search || post.title?.toLowerCase().includes(term) || post.body?.toLowerCase().includes(term);
      const matchAuthor = activeFilter === 'MEUS_POSTOS' ? post.authorId === profile.id : true;
      return matchCategory && matchSearch && matchAuthor;
    });

    const sorted = [...filtered];
    if (activeFilter === 'MAIS_COMENTADOS') {
      sorted.sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return (b.commentCount || 0) - (a.commentCount || 0);
      });
    } else {
      sorted.sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeB - timeA;
      });
    }
    return sorted;
  }, [posts, filterCategory, search, activeFilter, profile.id]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const { posts: newPosts, lastCreatedAt } = await postService.fetchMorePosts(lastCreatedAtRef.current, PAGE_SIZE);
      if (newPosts.length > 0) {
        setOlderPosts(prev => [...prev, ...newPosts]);
        lastCreatedAtRef.current = lastCreatedAt;
      }
      if (newPosts.length < PAGE_SIZE) {
        setHasMore(false);
      }
    } catch (e) {
      console.error('Error loading more posts:', e);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore]);

  const handleCreatePost = useCallback(async (title: string, bodyHTML: string, category: string) => {
    setIsPosting(true);
    try {
      await postService.createPost(title, bodyHTML, category, profile);
      setShowEditor(false);
    } catch (e) {
      console.error(e);
    } finally {
      setIsPosting(false);
    }
  }, [profile]);

  const handleUpdatePost = useCallback(async (postId: string, title: string, bodyHTML: string, category: string) => {
    try {
      const updated = await postService.updatePost(postId, { title, body: bodyHTML, category });
      setRecentPosts(prev => prev.map(p => (p.id === postId ? updated : p)));
      setOlderPosts(prev => prev.map(p => (p.id === postId ? updated : p)));
      setEditingPost(null);
      setShowEditor(false);
      return updated;
    } catch (e) {
      console.error(e);
      addToast('Erro ao atualizar publicação.', 'error');
      throw e;
    }
  }, [addToast]);

  const handleDeletePost = useCallback(async (postId: string) => {
    try {
      await postService.softDeletePost(postId);
      setRecentPosts(prev => prev.filter(p => p.id !== postId));
      setOlderPosts(prev => prev.filter(p => p.id !== postId));
    } catch (e) {
      console.error(e);
      addToast('Erro ao excluir publicação.', 'error');
      throw e;
    }
  }, [addToast]);

  const handleEditPost = useCallback((post: Post) => {
    setEditingPost(post);
    setShowEditor(true);
  }, []);

  const handleCloseEditor = useCallback(() => {
    setShowEditor(false);
    setEditingPost(null);
  }, []);

  return {
    filteredPosts,
    isPosting,
    showEditor,
    setShowEditor,
    editingPost,
    filterCategory,
    setFilterCategory,
    search,
    setSearch,
    handleCreatePost,
    handleUpdatePost,
    handleDeletePost,
    handleEditPost,
    handleCloseEditor,
    activeFilter,
    setActiveFilter,
    loadMore,
    hasMore,
    loadingMore
  };
}
