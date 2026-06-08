import { supabase } from '../lib/supabase';
import { UserProfile, AuthUser } from '../types';

export const authService = {
  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },

  sendPasswordReset: async (email: string) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
    return data;
  },

  /**
   * Listen to authentication state and fetch the associated user profile.
   */
  onAuthStateChanged: (
    onUserChanged: (user: AuthUser | null, profile: UserProfile | null) => void
  ) => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!session?.user) {
          onUserChanged(null, null);
          return;
        }

        const u = session.user;
        const authUser: AuthUser = { uid: u.id, email: u.email ?? null };

        try {
          const { data: profileData, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', u.id)
            .single();

          if (error || !profileData) {
            await supabase.auth.signOut();
            onUserChanged(null, null);
            return;
          }

          const profile: UserProfile = {
            id: profileData.id,
            name: profileData.name,
            email: profileData.email,
            role: profileData.role,
            avatarUrl: profileData.avatar_url,
            bio: profileData.bio,
            currentPost: profileData.current_post,
            interests: profileData.interests,
            isOnline: profileData.is_online,
            lastOnline: profileData.last_online,
            createdAt: profileData.created_at,
          };

          onUserChanged(authUser, profile);
        } catch (error) {
          console.error('Error fetching user profile:', error);
          await supabase.auth.signOut();
          onUserChanged(null, null);
        }
      }
    );

    return () => subscription.unsubscribe();
  },

  /**
   * Sign out the current user.
   */
  signOut: () => {
    return supabase.auth.signOut();
  },
};
