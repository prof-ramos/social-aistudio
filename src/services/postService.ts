import { supabase } from '../lib/supabase';
import { Post, PostCategory, UserProfile, PostComment } from '../types';
import { userService } from './userService';
import { notificationService } from './notificationService';

const notifyMentions = async (text: string, type: 'MENTION_POST' | 'MENTION_COMMENT', postId: string, actorName: string, actorId: string) => {
  try {
    // Extract @mentions from text
    const mentionRegex = /@([\wÀ-ú]+(?:\s+[\wÀ-ú]+)*)\b/g;
    const matches = [...text.matchAll(mentionRegex)];
    const mentionedNames = new Set(
      matches.map(m => m[1].toLowerCase().trim())
    );

    if (mentionedNames.size === 0) return;

    // Busca apenas os users que correspondem aos nomes mencionados
    const { data: users, error: usersError } = await supabase
      .from('users_public')
      .select('id, name')
      .neq('id', actorId);

    if (usersError || !users) {
      console.error('Error fetching users for mentions:', usersError);
      return;
    }

    const mentionedIds = new Set<string>();
    for (const user of users) {
      if (mentionedNames.has(user.name.toLowerCase().trim())) {
        mentionedIds.add(user.id);
      }
    }

    for (const userId of mentionedIds) {
      await notificationService.createNotification({
        userId,
        type,
        actorName,
        postId,
        message: `${actorName} mencionou você em um ${type === 'MENTION_POST' ? 'post' : 'comentário'}`,
        link: `/feed/${postId}`
      });
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
  const user = resolveJoinedUser(row.users_public);
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
  const user = resolveJoinedUser(row.users_public);
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
      .select('*, users_public!author_id(name, role)')
      .in('id', ids);

    if (error) {
      console.error('Error fetching posts by ids:', error);
      throw error;
    }

    const posts = (data || []).map(mapPostRow);
    return attachReactions(posts);
  },

  getPostsByAuthor: async (authorId: string): Promise<Post[]> => {
    const { data, error } = await supabase
      .from('posts')
      .select('*, users_public!author_id(name, role)')
      .eq('author_id', authorId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching posts by author:', error);
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
          .select('*, users_public!author_id(name, role)')
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

  fetchMorePosts: async (lastCreatedAt: string | null, lastId: string | null, pageSize: number = 10): Promise<{ posts: Post[]; lastCreatedAt: string | null; lastId: string | null }> => {
    let query = supabase
      .from('posts')
      .select('*, users_public!author_id(name, role)')
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .limit(pageSize);

    if (lastCreatedAt && lastId) {
      // Cursor composed (created_at, id) — handles identical timestamps
      query = query
        .or(`and(created_at.lt.${lastCreatedAt}),and(created_at.eq.${lastCreatedAt},id.lt.${lastId})`);
    } else if (lastCreatedAt) {
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
    const lastRow = rows.length > 0 ? rows[rows.length - 1] : null;

    return {
      posts,
      lastCreatedAt: lastRow ? lastRow.created_at : null,
      lastId: lastRow ? lastRow.id : null,
    };
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
      .select('*, users_public!author_id(name, role)')
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
      .select('*, users_public!author_id(name, role)')
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
          .select('*, users_public!author_id(name, role)')
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
      .select('*, users_public!author_id(name, role)')
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
  },

  softDeletePost: async (postId: string) => {
    const { error } = await supabase
      .from('posts')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', postId);
    if (error) {
      console.error('Error soft-deleting post:', error);
      throw error;
    }
  },

  softDeleteComment: async (commentId: string) => {
    const { error } = await supabase
      .from('comments')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', commentId);
    if (error) {
      console.error('Error soft-deleting comment:', error);
      throw error;
    }
  },

  updatePost: async (postId: string, data: { title: string; body: string; category: string }) => {
    const { data: updated, error } = await supabase
      .from('posts')
      .update({ title: data.title, body: data.body, category: data.category })
      .eq('id', postId)
      .select('*, users_public!author_id(name, role)')
      .single();

    if (error) {
      console.error('Error updating post:', error);
      throw error;
    }

    return mapPostRow(updated);
  },

  getPostCountByAuthor: async (authorId: string): Promise<number | null> => {
    const { count, error } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .is('deleted_at', null)
      .eq('author_id', authorId);

    if (error) {
      console.error('Error fetching post count:', error);
      return null;
    }

    return count ?? null;
  },
};
