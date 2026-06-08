import { supabase } from '../lib/supabase';
import { Post, PostCategory, UserProfile, PostComment } from '../types';
import { userService } from './userService';
import { notificationService } from './notificationService';

const notifyMentions = async (text: string, type: 'MENTION_POST' | 'MENTION_COMMENT', postId: string, actorName: string, actorId: string) => {
  try {
    const users = await userService.getAllUsers();
    const sortedUsers = users.sort((a, b) => b.name.length - a.name.length);
    const mentionedIds = new Set<string>();

    const lowerText = text.toLowerCase();
    for (const user of sortedUsers) {
      if (user.id !== actorId && !mentionedIds.has(user.id) && lowerText.includes(`@${user.name.toLowerCase()}`)) {
        mentionedIds.add(user.id);
        await notificationService.createNotification({
          userId: user.id,
          type,
          actorName,
          postId,
          message: `${actorName} mencionou você em um ${type === 'MENTION_POST' ? 'post' : 'comentário'}`,
          link: `/feed/${postId}`
        });
      }
    }
  } catch (err) {
    console.error('Error notifying mentions:', err);
  }
};

const resolveJoinedUser = (users: { name: string; role: string } | { name: string; role: string }[] | null) => {
  if (Array.isArray(users)) return users[0];
  return users;
};

const mapPostRow = (row: Record<string, any>): Post => {
  const user = resolveJoinedUser(row.users);
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    category: row.category,
    authorId: row.author_id,
    authorName: user?.name || '',
    authorRole: user?.role || '',
    pinned: row.pinned,
    createdAt: row.created_at,
    commentCount: row.comment_count || 0,
  };
};

const mapCommentRow = (row: Record<string, any>): PostComment => {
  const user = resolveJoinedUser(row.users);
  return {
    id: row.id,
    postId: row.post_id,
    authorId: row.author_id,
    authorName: user?.name || '',
    authorRole: user?.role || '',
    body: row.body,
    createdAt: row.created_at,
  };
};

const attachReactions = async (posts: Post[]): Promise<Post[]> => {
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
};

export const postService = {
  getPostsByIds: async (ids: string[]): Promise<Post[]> => {
    if (!ids || ids.length === 0) return [];

    const { data, error } = await supabase
      .from('posts')
      .select('*, users!author_id(name, role)')
      .in('id', ids);

    if (error) {
      console.error('Error fetching posts by ids:', error);
      throw error;
    }

    const posts = (data || []).map(mapPostRow);
    return attachReactions(posts);
  },

  subscribeToFeed: (onUpdate: (posts: Post[]) => void, onError: (error: Error) => void, limitCount: number = 10) => {
    const fetchFeed = async () => {
      try {
        const { data, error } = await supabase
          .from('posts')
          .select('*, users!author_id(name, role)')
          .order('created_at', { ascending: false })
          .limit(limitCount);

        if (error) throw error;

        let posts = (data || []).map(mapPostRow);
        posts = await attachReactions(posts);
        posts.sort((a, b) => {
          if (a.pinned && !b.pinned) return -1;
          if (!a.pinned && b.pinned) return 1;
          return 0;
        });
        onUpdate(posts);
      } catch (err) {
        onError(err instanceof Error ? err : new Error(String(err)));
      }
    };

    fetchFeed();

    const channel = supabase
      .channel('posts-feed')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'posts',
      }, () => {
        fetchFeed();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'reactions',
      }, () => {
        fetchFeed();
      })
      .subscribe((status, err) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          onError(err ?? new Error(`Feed channel status: ${status}`));
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  },

  fetchMorePosts: async (lastCreatedAt: string | null, pageSize: number = 10): Promise<{ posts: Post[]; lastCreatedAt: string | null }> => {
    let query = supabase
      .from('posts')
      .select('*, users!author_id(name, role)')
      .order('created_at', { ascending: false })
      .limit(pageSize);

    if (lastCreatedAt) {
      query = query.lt('created_at', lastCreatedAt);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Error fetching more posts:', error);
      throw error;
    }

    const rows = data || [];
    let posts = rows.map(mapPostRow);
    posts = await attachReactions(posts);
    const newLastCreatedAt = rows.length > 0 ? rows[rows.length - 1].created_at : null;

    return { posts, lastCreatedAt: newLastCreatedAt };
  },

  createPost: async (title: string, bodyHTML: string, category: PostCategory | string, profile: UserProfile) => {
    const { data, error } = await supabase
      .from('posts')
      .insert({
        title,
        body: bodyHTML,
        category,
        author_id: profile.id,
        pinned: false,
      })
      .select('*, users!author_id(name, role)')
      .single();

    if (error) {
      console.error('Error creating post:', error);
      throw error;
    }

    const post = mapPostRow(data);

    notifyMentions(bodyHTML, 'MENTION_POST', post.id, profile.name, profile.id);

    return post;
  },

  getPost: async (id: string): Promise<Post | null> => {
    const { data, error } = await supabase
      .from('posts')
      .select('*, users!author_id(name, role)')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      console.error('Error fetching post:', error);
      throw error;
    }

    if (!data) return null;
    const post = mapPostRow(data);
    const [withReactions] = await attachReactions([post]);
    return withReactions;
  },

  subscribeToPost: (id: string, onUpdate: (post: Post | null) => void) => {
    const fetchPost = async () => {
      try {
        const post = await postService.getPost(id);
        onUpdate(post);
      } catch (err) {
        console.error('Error fetching post:', err);
        onUpdate(null);
      }
    };

    fetchPost();

    const channel = supabase
      .channel(`post-${id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'posts',
        filter: `id=eq.${id}`,
      }, () => {
        fetchPost();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'reactions',
        filter: `post_id=eq.${id}`,
      }, () => {
        fetchPost();
      })
      .subscribe((status, err) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.error(`Post channel status: ${status}`, err);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  },

  subscribeToComments: (postId: string, onUpdate: (comments: PostComment[]) => void) => {
    const fetchComments = async () => {
      try {
        const { data, error } = await supabase
          .from('comments')
          .select('*, users!author_id(name, role)')
          .eq('post_id', postId)
          .order('created_at', { ascending: true })
          .limit(50);

        if (error) throw error;
        onUpdate((data || []).map(mapCommentRow));
      } catch (err) {
        console.error('Error fetching comments:', err);
        onUpdate([]);
      }
    };

    fetchComments();

    const channel = supabase
      .channel(`comments-${postId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'comments',
        filter: `post_id=eq.${postId}`,
      }, () => {
        fetchComments();
      })
      .subscribe((status, err) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.error(`Comments channel status: ${status}`, err);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  },

  createComment: async (postId: string, body: string, profile: UserProfile) => {
    const { data, error } = await supabase
      .from('comments')
      .insert({
        post_id: postId,
        body,
        author_id: profile.id,
      })
      .select('*, users!author_id(name, role)')
      .single();

    if (error) {
      console.error('Error creating comment:', error);
      throw error;
    }

    const comment = mapCommentRow(data);

    notifyMentions(body, 'MENTION_COMMENT', postId, profile.name, profile.id);

    return comment;
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
  }
};
