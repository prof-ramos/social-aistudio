import { useState, useCallback } from 'react';
import { userService } from '../services/userService';
import { useToast } from '../components/ui/Toast';

/**
 * Tracks the set of saved post IDs in real React state so the bookmark UI
 * updates immediately. Seeded once from the profile snapshot; the toggle is
 * optimistic and reverts on error. Does NOT mutate the profile prop.
 */
export function useSavedPosts(userId: string, initialSavedIds: string[] = []) {
  const { addToast } = useToast();
  const [savedIds, setSavedIds] = useState<Set<string>>(() => new Set(initialSavedIds));

  const isSaved = useCallback((postId: string) => savedIds.has(postId), [savedIds]);

  const toggle = useCallback(async (postId: string) => {
    const wasSaved = savedIds.has(postId);
    // optimistic update
    setSavedIds(prev => {
      const next = new Set(prev);
      if (wasSaved) next.delete(postId); else next.add(postId);
      return next;
    });
    try {
      await userService.toggleSavedPost(userId, postId);
    } catch (err) {
      console.error(err);
      // revert to the pre-click value
      setSavedIds(prev => {
        const next = new Set(prev);
        if (wasSaved) next.add(postId); else next.delete(postId);
        return next;
      });
      addToast('Não foi possível salvar a publicação. Tente novamente.', 'error');
    }
  }, [savedIds, userId, addToast]);

  return { isSaved, savedCount: savedIds.size, toggle };
}
