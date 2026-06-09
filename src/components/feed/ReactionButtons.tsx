import React, { useState, useEffect, useCallback } from 'react';
import { ThumbsUp, Heart, AlertTriangle } from 'lucide-react';
import { postService } from '../../services/postService';
import { motion, AnimatePresence } from 'motion/react';

interface ReactionButtonsProps {
  postId: string;
  reactions?: Record<string, string[]>;
  currentUserId: string;
}

const POSITIVE_EMOJIS = [
  { emoji: '👍', label: 'Curtir', Icon: ThumbsUp },
  { emoji: '❤️', label: 'Apoiar', Icon: Heart },
];

const REPORT_EMOJI = { emoji: '💡', label: 'Informar', Icon: AlertTriangle };

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

  const reportReacts = localReactions[REPORT_EMOJI.emoji] || [];
  const hasReported = reportReacts.includes(currentUserId);

  return (
    <div className="flex flex-1 items-center justify-between">
      <div className="flex gap-6">
        {POSITIVE_EMOJIS.map(({ emoji, label, Icon }) => {
          const reacts = localReactions[emoji] || [];
          const hasReacted = reacts.includes(currentUserId);

          return (
            <button
              key={emoji}
              onClick={(e) => handleReact(e, emoji)}
              aria-label={`${reacts.length} ${label.toLowerCase()}`}
              aria-pressed={hasReacted}
              className={`text-sm font-medium flex items-center gap-2 transition-colors focus:ring-2 focus:ring-navy focus:outline-none min-h-[44px] ${
                hasReacted ? 'text-sky dark:text-asof-blue' : 'text-slate/70 hover:text-navy'
              }`}
            >
              <Icon className="w-5 h-5" strokeWidth={hasReacted ? 2 : 1.5} fill={hasReacted ? 'currentColor' : 'none'} />
              <span className="hidden sm:inline" aria-hidden="true">{label}</span>
              <span className="flex items-center overflow-hidden" aria-hidden="true">
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
              </span>
            </button>
          );
        })}
      </div>
      
      <button
        onClick={(e) => handleReact(e, REPORT_EMOJI.emoji)}
        aria-label={`${reportReacts.length} ${REPORT_EMOJI.label.toLowerCase()}`}
        aria-pressed={hasReported}
        className={`text-sm font-medium flex items-center gap-2 transition-colors focus:ring-2 focus:ring-navy focus:outline-none min-h-[44px] ${
          hasReported ? 'text-danger' : 'text-slate/40 hover:text-danger'
        }`}
      >
        <REPORT_EMOJI.Icon className="w-5 h-5" strokeWidth={hasReported ? 2 : 1.5} fill={hasReported ? 'currentColor' : 'none'} />
        <span className="hidden sm:inline" aria-hidden="true">{REPORT_EMOJI.label}</span>
      </button>
    </div>
  );
}
