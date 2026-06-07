import { useState, useEffect } from 'react';
import { postService } from '../services/postService';
import { Post, UserProfile } from '../types';

export type FeedFilter = 'RECENTES' | 'MAIS_COMENTADOS' | 'MEUS_POSTOS';

export function useFeed(profile: UserProfile) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isPosting, setIsPosting] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [filterCategory, setFilterCategory] = useState('TODOS');
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<FeedFilter>('RECENTES');
  const [limitCount, setLimitCount] = useState(10);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    const unsub = postService.subscribeToFeed(
      (fetchedPosts) => {
        setPosts(fetchedPosts);
        if (fetchedPosts.length < limitCount) {
          setHasMore(false);
        } else {
          setHasMore(true);
        }
      },
      (error) => console.error('Error in feed snapshot:', error),
      limitCount
    );
    return () => unsub();
  }, [limitCount]);

  const loadMore = () => {
    if (hasMore) {
      setLimitCount(prev => prev + 10);
    }
  };

  const handleCreatePost = async (title: string, bodyHTML: string, category: string) => {
    setIsPosting(true);
    try {
      await postService.createPost(title, bodyHTML, category, profile);
      setShowEditor(false);
    } catch (e) {
      console.error(e);
    } finally {
      setIsPosting(false);
    }
  };

  const filteredPosts = posts.filter(post => {
    const matchCategory = filterCategory === 'TODOS' || post.category === filterCategory;
    const term = search.toLowerCase();
    const matchSearch = !search || post.title?.toLowerCase().includes(term) || post.body?.toLowerCase().includes(term);
    const matchAuthor = activeFilter === 'MEUS_POSTOS' ? post.authorId === profile.id : true;
    return matchCategory && matchSearch && matchAuthor;
  });

  if (activeFilter === 'MAIS_COMENTADOS') {
    filteredPosts.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return (b.commentCount || 0) - (a.commentCount || 0);
    });
  } else {
    // Rely on default insertion sort which is descending by date but keeps pinned at top
    filteredPosts.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
      const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
      return timeB - timeA;
    });
  }

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
    hasMore
  };
}
