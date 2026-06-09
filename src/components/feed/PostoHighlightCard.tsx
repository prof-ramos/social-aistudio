import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { UserProfile } from '../../types';
import { postoService } from '../../services/postoService';

interface PostoHighlightCardProps {
  profile: UserProfile;
}

export function PostoHighlightCard({ profile }: PostoHighlightCardProps) {
  const [posto, setPosto] = useState<{ name: string; slug: string } | null>(null);

  useEffect(() => {
    if (!profile.currentPost) return;

    let cancelled = false;
    postoService.getPostoBySlug(profile.currentPost).then(data => {
      if (!cancelled && data) {
        setPosto({ name: data.name, slug: data.slug });
      }
    });

    return () => { cancelled = true; };
  }, [profile.currentPost]);

  if (!profile.currentPost || !posto) return null;

  return (
    <div className="bg-white border border-border-gray shadow-sm border-l-4 border-l-navy p-6 font-sans">
      <div className="flex justify-between items-start mb-4">
        <h2 className="font-serif text-2xl text-navy">Posto: {posto.name}</h2>
      </div>
      <Link
        to={`/postos/${posto.slug}`}
        className="block w-full min-h-[44px] border border-navy text-navy font-bold text-xs uppercase tracking-wider py-2.5 px-3 hover:bg-ice transition-colors focus:ring-2 focus:ring-navy focus:outline-none text-center mt-2"
      >
        Ver Ficha do Posto
      </Link>
    </div>
  );
}