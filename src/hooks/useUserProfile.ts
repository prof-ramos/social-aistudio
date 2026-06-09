import { useEffect, useState } from 'react';
import { userService } from '../services/userService';
import { UserProfile } from '../types';

export function useUserProfile(id: string | undefined, currentProfile: UserProfile) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const isOwnProfile = currentProfile.id === id;
  const isViewingOwnProfile = currentProfile.id === id;

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    const unsubscribe = userService.subscribeToProfile(
      id,
      (userData) => {
        setUser(userData);
        setLoading(false);
      },
      { includePrivate: isViewingOwnProfile }
    );

    return () => unsubscribe();
  }, [id, isViewingOwnProfile]);

  return { user, loading, isOwnProfile, isViewingOwnProfile };
}
