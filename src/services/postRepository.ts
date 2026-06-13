import { supabase } from '../lib/supabase';
import { Post, PostCategory, UserProfile, PostComment } from '../types';
import { reactionRepository } from './reactionRepository';

const resolveJoinedUser = (users: { name: string; role: string } | { name: string; role: string }[] | null) => {
  if (Array.isArray(users)) return users[0];
  return users;
};

export const mapPostRow = (row: Record<string, any>): Post => {
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

export const mapCommentRow = (row: Record<string, any>): PostComment => {
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

export const postRepository = {
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
    return reactionRepository.attachToPosts(posts);
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
    return reactionRepository.attachToPosts(posts);
  },

  subscribeToFeed: (onUpdate: (posts: Post[]) => void, onError: (error: Error) => void, limitCount: number = 10) => {
    const fetchFeed = async () => {
      try {
        const { data, error } = await supabase
          .from('posts')
          .select('*, users_public!author_id(name, role)')
          .is('deleted_at', null)
          .order('created_at', { ascending: false })
          .limit(limitCount);

        if (error) throw error;

        let posts = (data || []).map(mapPostRow);
        posts = await reactionRepository.attachToPosts(posts);
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

    // The first page is loaded once by the consumer (useFeed.fetchInitial); this
    // subscription only streams subsequent post changes. A trailing debounce collapses
    // a burst of events into a single refetch instead of one per event.
    // Reactions are handled optimistically in the UI — no Realtime refetch needed.
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    const scheduleFetch = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        debounceTimer = null;
        fetchFeed();
      }, 250);
    };

    const channel = supabase
      .channel('posts-feed')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'posts',
      }, scheduleFetch)
      .subscribe((status, err) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          onError(err ?? new Error(`Feed channel status: ${status}`));
        }
      });

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      supabase.removeChannel(channel);
    };
  },

  fetchMorePosts: async (offset: number, pageSize: number = 10): Promise<{ posts: Post[]; hasMore: boolean }> => {
    const { data, error } = await supabase
      .from('posts')
      .select('*, users_public!author_id(name, role)')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (error) {
      console.error('Error fetching more posts:', error);
      throw error;
    }

    const rows = data || [];
    let posts = rows.map(mapPostRow);
    posts = await reactionRepository.attachToPosts(posts);

    return {
      posts,
      hasMore: rows.length >= pageSize,
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

    return mapPostRow(data);
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
    const [withReactions] = await reactionRepository.attachToPosts([post]);
    return withReactions;
  },

  subscribeToPost: (id: string, onUpdate: (post: Post | null) => void) => {
    const fetchPost = async () => {
      try {
        const post = await postRepository.getPost(id);
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

    return mapCommentRow(data);
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
