import React, { useEffect, useState } from 'react';
import { UserProfile } from '../../types';
import { userService } from '../../services/userService';
import { UserPlus, UserCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

interface MemberSuggestionsCardProps {
  profile: UserProfile;
}

export function MemberSuggestionsCard({ profile }: MemberSuggestionsCardProps) {
  const [suggestions, setSuggestions] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        setLoading(true);
        const allUsers = await userService.getAllUsers();
        
        const myPostos = profile.postos || [];
        
        // Filter out the current user, and users that don't share any posto
        const filtered = allUsers.filter(u => {
          if (u.id === profile.id) return false;
          
          const theirPostos = u.postos || [];
          const hasCommonPosto = theirPostos.some(p => myPostos.includes(p));
          
          return hasCommonPosto;
        });

        // Optionally, randomize or sort by number of common postos
        // For now, take up to 3 random suggestions
        const shuffled = filtered.sort(() => 0.5 - Math.random());
        setSuggestions(shuffled.slice(0, 3));
      } catch (err) {
        console.error('Error fetching suggestions:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSuggestions();
  }, [profile.id, profile.postos]);

  if (loading) {
    return (
      <div className="bg-white border border-border-gray p-6 animate-pulse">
        <div className="h-4 bg-ice w-1/2 mb-6"></div>
        <div className="space-y-4">
          {[1, 2].map(i => (
            <div key={i} className="flex gap-3">
              <div className="w-10 h-10 rounded-full bg-ice"></div>
              <div className="flex-1">
                <div className="h-3 bg-ice w-2/3 mb-2"></div>
                <div className="h-2 bg-ice w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return null; // Return null if no suggestions
  }

  return (
    <div className="bg-white border border-border-gray p-6 relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-24 h-24 bg-ice/50 rounded-bl-full -z-0 transition-transform group-hover:scale-110"></div>
      
      <div className="relative z-10">
        <h3 className="text-sm font-bold text-navy uppercase tracking-wider mb-5 flex items-center gap-2">
          <UserPlus className="w-4 h-4 text-sky-dark" />
          Sugestões para Você
        </h3>

        <div className="space-y-5">
          {suggestions.map(user => {
            const commonPostos = user.postos?.filter(p => profile.postos?.includes(p)) || [];
            
            return (
              <div key={user.id} className="flex flex-col gap-2">
                <Link to={`/perfil/${user.id}`} className="flex items-center gap-3 group/user">
                  <div className="w-10 h-10 bg-ice text-navy flex items-center justify-center rounded-full font-bold uppercase shrink-0 border border-border-gray overflow-hidden">
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      user.name.substring(0, 2)
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-navy truncate group-hover/user:text-sky-dark transition-colors">
                      {user.name}
                    </p>
                    <p className="text-xs text-slate truncate">
                      {commonPostos.length > 0 ? commonPostos[0].split(',')[0] : 'Membro'}
                    </p>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
