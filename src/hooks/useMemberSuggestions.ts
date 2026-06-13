import { useEffect, useState } from 'react';
import { userService } from '../services/userService';
import type { UserProfile } from '../types';

/**
 * Up to three member suggestions sharing postos with the current user.
 * Keeps MemberSuggestionsCard free of direct service access.
 */
export function useMemberSuggestions(profile: UserProfile) {
  const [suggestions, setSuggestions] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const fetchSuggestions = async () => {
      try {
        setLoading(true);
        const myPostos = profile.postos || [];
        const matchedUsers = await userService.getUsersWithCommonPostos(profile.id, myPostos, 50);
        const shuffled = matchedUsers.sort(() => 0.5 - Math.random());
        if (!cancelled) setSuggestions(shuffled.slice(0, 3));
      } catch (err) {
        console.error('Error fetching suggestions:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchSuggestions();
    return () => { cancelled = true; };
  }, [profile.id, profile.postos]);

  return { suggestions, loading };
}
