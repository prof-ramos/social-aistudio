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
    phone: data.phone,
    phoneIsWhatsapp: data.phone_is_whatsapp,
    showPhone: data.show_phone,
    showEmail: data.show_email,
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

type ProfileReadOptions = { includePrivate?: boolean };

export const userService = {
  getUserProfile: async (id: string, options?: ProfileReadOptions): Promise<UserProfile | null> => {
    const table = options?.includePrivate ? 'users' : 'users_public';
    const { data, error } = await supabase.from(table).select('*').eq('id', id).single();
    if (error || !data) return null;
    return mapUser(data);
  },

  subscribeToProfile: (
    id: string,
    onUpdate: (profile: UserProfile | null) => void,
    options?: ProfileReadOptions
  ) => {
    const table = options?.includePrivate ? 'users' : 'users_public';

    const fetchProfile = async () => {
      const profile = await userService.getUserProfile(id, options);
      onUpdate(profile);
    };

    fetchProfile();

    const channel = supabase
      .channel(`profile-${table}-${id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table, filter: 'id=eq.' + id },
        () => {
          fetchProfile();
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
  },

  uploadAvatar: async (userId: string, file: File): Promise<string> => {
    const ext = file.name.split('.').pop() || 'jpg';
    const path = `${userId}/${Date.now()}.${ext}`;

    // Clean up old avatar files
    const { data: existing } = await supabase.storage.from('avatars').list(userId);
    if (existing && existing.length > 0) {
      const oldPaths = existing.map(f => `${userId}/${f.name}`);
      await supabase.storage.from('avatars').remove(oldPaths).catch(() => {});
    }

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true });

    if (uploadError) {
      console.error('Error uploading avatar:', uploadError);
      throw uploadError;
    }

    const { data } = supabase.storage.from('avatars').getPublicUrl(path);
    return data.publicUrl;
  }
};
