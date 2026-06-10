import { supabase } from '../lib/supabase';
import { Post } from '../types';

export const reactionRepository = {
  attachToPosts: async (posts: Post[]): Promise<Post[]> => {
    if (posts.length === 0) return posts;
    const postIds = posts.map((p) => p.id);

    const { data: reactions, error } = await supabase
      .from('reactions')
      .select('*')
      .in('post_id', postIds);

    if (error || !reactions) {
      console.error('Error fetching reactions:', error);
      return posts;
    }

    const reactionsMap: Record<string, Record<string, string[]>> = {};
    for (const r of reactions) {
      if (!reactionsMap[r.post_id]) reactionsMap[r.post_id] = {};
      if (!reactionsMap[r.post_id][r.emoji]) reactionsMap[r.post_id][r.emoji] = [];
      reactionsMap[r.post_id][r.emoji].push(r.user_id);
    }

    return posts.map((p) => ({
      ...p,
      reactions: reactionsMap[p.id] || {},
    }));
  },

  toggleReaction: async (postId: string, emoji: string, userId: string) => {
    const { data: existing, error: selectError } = await supabase
      .from('reactions')
      .select('id')
      .eq('post_id', postId)
      .eq('emoji', emoji)
      .eq('user_id', userId)
      .maybeSingle();

    if (selectError) {
      console.error('Error checking reaction:', selectError);
      throw selectError;
    }

    if (existing) {
      const { error } = await supabase
        .from('reactions')
        .delete()
        .eq('id', existing.id);

      if (error) {
        console.error('Error deleting reaction:', error);
        throw error;
      }
    } else {
      const { error } = await supabase
        .from('reactions')
        .insert({
          post_id: postId,
          emoji,
          user_id: userId,
        });

      if (error) {
        console.error('Error inserting reaction:', error);
        throw error;
      }
    }
  },
};
