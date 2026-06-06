import { useState, useEffect } from 'react';
import { postService } from '../services/postService';
import { Post, UserProfile } from '../types';

export function useFeed(profile: UserProfile) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isPosting, setIsPosting] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [filterCategory, setFilterCategory] = useState('TODOS');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const unsub = postService.subscribeToFeed(
      (fetchedPosts) => setPosts(fetchedPosts),
      (error) => console.error('Error in feed snapshot:', error)
    );
    return () => unsub();
  }, []);

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
    return matchCategory && matchSearch;
  });

  return {
    filteredPosts,
    isPosting,
    showEditor,
    setShowEditor,
    filterCategory,
    setFilterCategory,
    search,
    setSearch,
    handleCreatePost
  };
}
