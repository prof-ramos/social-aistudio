import React, { useState, useEffect, useCallback } from 'react';
import { ThumbsUp, Heart, Lightbulb } from 'lucide-react';
import { postService } from '../../services/postService';
import { motion, AnimatePresence } from 'motion/react';

interface ReactionButtonsProps {
  postId: string;
  reactions?: Record<string, string[]>;
  currentUserId: string;
}

const EMOJIS = [
  { emoji: '👍', label: 'Curtir', Icon: ThumbsUp },
  { emoji: '❤️', label: 'Apoiar', Icon: Heart },
  { emoji: '💡', label: 'Informar', Icon: Lightbulb },
];

export function ReactionButtons({ postId, reactions = {}, currentUserId }: ReactionButtonsProps) {
  const [localReactions, setLocalReactions] = useState(reactions);

  useEffect(() => {
    setLocalReactions(reactions);
  }, [reactions]);

  const handleReact = useCallback(async (e: React.MouseEvent, emoji: string) => {
    e.preventDefault();
    e.stopPropagation();

    const prevReactions = { ...localReactions };
    const userReacts = prevReactions[emoji] || [];
    const hasReacted = userReacts.includes(currentUserId);

    // Optimistic update
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
      // Revert on error
      setLocalReactions(prevReactions);
    }
  }, [localReactions, currentUserId, postId]);

  return (
    <div className="flex gap-4">
      {EMOJIS.map(({ emoji, label, Icon }) => {
        const reacts = localReactions[emoji] || [];
        const hasReacted = reacts.includes(currentUserId);

        return (
          <button
            key={emoji}
            onClick={(e) => handleReact(e, emoji)}
            aria-label={`${reacts.length} ${label.toLowerCase()}`}
            aria-pressed={hasReacted}
            className={`text-xs font-bold flex items-center gap-1.5 transition-colors focus:ring-2 focus:ring-navy focus:outline-none min-h-[44px] ${
              hasReacted ? 'text-sky' : 'text-slate/50 hover:text-navy'
            }`}
          >
            <Icon className="w-4 h-4" strokeWidth={hasReacted ? 2 : 1.5} fill={hasReacted ? 'currentColor' : 'none'} />
            <span className="hidden sm:inline uppercase tracking-wider" aria-hidden="true">{label}</span>
            <span className="flex items-center overflow-hidden" aria-hidden="true">
              (
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span
                  key={reacts.length}
                  initial={{ y: -20, opacity: 0, scale: 0.5 }}
                  animate={{ y: 0, opacity: 1, scale: 1 }}
                  exit={{ y: 20, opacity: 0, scale: 0.5 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  className="inline-block relative text-center min-w-[8px]"
                >
                  {reacts.length}
                </motion.span>
              </AnimatePresence>
              )
            </span>
          </button>
        );
      })}
    </div>
  );
}
