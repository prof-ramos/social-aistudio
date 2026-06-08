import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { postService } from '../services/postService';
import { Post, UserProfile } from '../types';

export type FeedFilter = 'RECENTES' | 'MAIS_COMENTADOS' | 'MEUS_POSTOS';
const PAGE_SIZE = 10;

export function useFeed(profile: UserProfile) {
  const [recentPosts, setRecentPosts] = useState<Post[]>([]);
  const [olderPosts, setOlderPosts] = useState<Post[]>([]);
  const [isPosting, setIsPosting] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [filterCategory, setFilterCategory] = useState('TODOS');
  const [search, setSearch] = useState('');
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

  return {
    filteredPosts,
    isPosting,
    showEditor,
    setShowEditor,
    filterCategory,
    setFilterCategory,
    search,
    setSearch,
    handleCreatePost,
    activeFilter,
    setActiveFilter,
    loadMore,
    hasMore,
    loadingMore
  };
}
