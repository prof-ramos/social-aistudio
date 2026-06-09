import { useEffect, useState } from 'react';
import { postService } from '../services/postService';
import { Post, UserProfile } from '../types';

export function useUserContent(user: UserProfile | null, id: string | undefined) {
  const [savedPosts, setSavedPosts] = useState<Post[]>([]);
  const [userPosts, setUserPosts] = useState<Post[]>([]);

  useEffect(() => {
    if (!id || !user) return;

    let cancelled = false;

    const fetchContent = async () => {
      if (user.savedPosts && user.savedPosts.length > 0) {
        try {
          const posts = await postService.getPostsByIds(user.savedPosts);
          if (!cancelled) setSavedPosts(posts);
        } catch (e) {
          console.error(e);
        }
      } else {
        if (!cancelled) setSavedPosts([]);
      }

      try {
        const authored = await postService.getPostsByAuthor(id);
        if (!cancelled) setUserPosts(authored);
      } catch (e) {
        console.error(e);
        if (!cancelled) setUserPosts([]);
      }
    };

    fetchContent();

    return () => {
      cancelled = true;
    };
  }, [id, user]);

  return { savedPosts, userPosts };
}
