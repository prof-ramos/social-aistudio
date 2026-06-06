import { useEffect } from 'react';
import { userService } from '../services/userService';
import { UserProfile } from '../types';

export function usePresence(profile: UserProfile | null) {
  useEffect(() => {
    if (!profile?.id) return;

    const setOnline = () => userService.updatePresence(profile.id, true);
    const setOffline = () => userService.updatePresence(profile.id, false);

    // Set online initially
    setOnline();

    // Setup event listeners for visibility
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        setOnline();
      } else {
        setOffline();
      }
    };

    // Keepalive interval (optional, to update lastOnline)
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        setOnline();
      }
    }, 60000); // 1 minute

    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', setOffline);

    return () => {
      setOffline();
      clearInterval(interval);
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', setOffline);
    };
  }, [profile?.id]);
}
