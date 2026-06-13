import { useState, useEffect, useCallback } from 'react';
import { postService } from '../services/postService';

type Reactions = Record<string, string[]>;

/**
 * Optimistic reaction toggling for a post. Applies the change immediately,
 * persists it via postService, and reverts on failure. Keeps the
 * ReactionButtons component presentational.
 */
export function useReactions(postId: string, reactions: Reactions, currentUserId: string) {
  const [localReactions, setLocalReactions] = useState<Reactions>(reactions);

  useEffect(() => {
    setLocalReactions(reactions);
  }, [reactions]);

  const toggle = useCallback(async (emoji: string) => {
    const prevReactions = { ...localReactions };
    const hasReacted = (prevReactions[emoji] || []).includes(currentUserId);

    setLocalReactions(prev => {
      const next = { ...prev };
      const list = [...(next[emoji] || [])];
      if (hasReacted) {
        next[emoji] = list.filter(id => id !== currentUserId);
      } else {
        next[emoji] = [...list, currentUserId];
      }
      if (next[emoji].length === 0) delete next[emoji];
      return next;
    });

    try {
      await postService.toggleReaction(postId, emoji, currentUserId);
    } catch (err) {
      console.error('Failed to toggle reaction', err);
      setLocalReactions(prevReactions);
    }
  }, [localReactions, currentUserId, postId]);

  return { localReactions, toggle };
}
