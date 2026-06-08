import { supabase } from '../lib/supabase';
import { UserProfile } from '../types';

function mapUser(data: any): UserProfile {
  return {
    id: data.id,
    name: data.name,
    email: data.email,
    role: data.role,
    avatarUrl: data.avatar_url,
    bio: data.bio,
    savedPosts: data.saved_posts,
    postos: data.postos,
    createdAt: data.created_at,
    isOnline: data.is_online,
    lastOnline: data.last_online,
    currentPost: data.current_post,
    interests: data.interests,
  } as UserProfile;
}

function camelToSnake(obj: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined) continue;
    const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    result[snakeKey] = value;
  }
  return result;
}

export const userService = {
  getUserProfile: async (id: string): Promise<UserProfile | null> => {
    const { data, error } = await supabase.from('users_public').select('*').eq('id', id).single();
    if (error || !data) return null;
    return mapUser(data);
  },

  subscribeToProfile: (id: string, onUpdate: (profile: UserProfile | null) => void) => {
    const channel = supabase
      .channel('users')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'users_public', filter: 'id=eq.' + id },
        (payload) => {
          if (payload.new) {
            onUpdate(mapUser(payload.new));
          } else {
            onUpdate(null);
          }
        }
      )
      .subscribe((status) => {
        if (status !== 'SUBSCRIBED') {
          console.error('Profile subscription status:', status);
        }
      });
    return () => {
      supabase.removeChannel(channel);
    };
  },

  updatePresence: async (id: string, isOnline: boolean): Promise<void> => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ is_online: isOnline, last_online: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    } catch (e) {
      console.error('Failed to update presence', e);
    }
  },

  updateUserProfile: async (id: string, data: Partial<UserProfile>): Promise<void> => {
    const { error } = await supabase.from('users').update(camelToSnake(data)).eq('id', id);
    if (error) throw error;
  },

  getAllUsers: async (): Promise<UserProfile[]> => {
    const { data, error } = await supabase.from('users_public').select('*').limit(50);
    if (error) {
      console.error('Failed to fetch all users', error);
      return [];
    }
    return (data || []).map(mapUser);
  },

  getUsersWithCommonPostos: async (excludeUserId: string, userPostos: string[], limitCount: number = 50): Promise<UserProfile[]> => {
    const { data, error } = await supabase.from('users_public').select('*').limit(limitCount);
    if (error || !data) return [];
    const users = data.map(mapUser);
    return users.filter(u => {
      if (u.id === excludeUserId) return false;
      if (u.currentPost && userPostos.includes(u.currentPost)) return true;
      const theirPostos = u.postos || [];
      return theirPostos.some(p => userPostos.includes(p));
    });
  },

  toggleSavedPost: async (userId: string, postId: string): Promise<void> => {
    const { data } = await supabase
      .from('saved_posts')
      .select('*')
      .eq('user_id', userId)
      .eq('post_id', postId)
      .maybeSingle();

    if (data) {
      const { error } = await supabase
        .from('saved_posts')
        .delete()
        .eq('user_id', userId)
        .eq('post_id', postId);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('saved_posts')
        .insert({ user_id: userId, post_id: postId });
      if (error) throw error;
    }
  }
};
