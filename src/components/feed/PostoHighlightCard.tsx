import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';
import { postoService } from '../../services/postoService';

export function PostoHighlightCard() {
  const [posto, setPosto] = useState<{
    name: string;
    slug: string;
    reviewCount: number;
    averageRating: number | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    postoService.getHighlightedPosto().then(data => {
      if (!cancelled) {
        setPosto(data);
        setLoading(false);
      }
    }).catch(() => {
      if (!cancelled) setLoading(false);
    });

    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="bg-white border border-border-gray shadow-sm border-l-4 border-l-navy p-6 font-sans min-h-[160px] animate-pulse">
        <div className="h-8 bg-slate/10 w-2/3 mb-4" />
        <div className="h-4 bg-slate/10 w-1/2 mb-6" />
        <div className="h-11 bg-slate/10 w-full" />
      </div>
    );
  }

  if (!posto || posto.reviewCount === 0) {
    return (
      <div className="bg-white border border-border-gray shadow-sm border-l-4 border-l-navy p-6 font-sans">
        <p className="text-base text-slate leading-relaxed">Nenhum posto avaliado ainda.</p>
        <Link
          to="/postos"
          className="block w-full min-h-[44px] border border-navy text-navy font-bold text-sm uppercase tracking-wider py-2.5 px-3 hover:bg-ice transition-colors focus:ring-2 focus:ring-navy focus:outline-none text-center mt-4"
        >
          Explorar Postos
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white border border-border-gray shadow-sm border-l-4 border-l-navy p-6 font-sans">
      <div className="flex justify-between items-start mb-4">
        <h2 className="font-serif text-2xl text-navy">Posto: {posto.name}</h2>
      </div>
      <div className="flex items-center gap-4 mb-4 text-base text-slate">
        <span>{posto.reviewCount} {posto.reviewCount === 1 ? 'avaliação' : 'avaliações'}</span>
        {posto.averageRating != null && (
          <span className="flex items-center gap-1 font-medium text-navy">
            <Star className="w-4 h-4 fill-warning text-warning" />
            {posto.averageRating.toFixed(1)}
          </span>
        )}
      </div>
      <Link
        to={`/postos/${posto.slug}`}
        className="block w-full min-h-[44px] border border-navy text-navy font-bold text-sm uppercase tracking-wider py-2.5 px-3 hover:bg-ice transition-colors focus:ring-2 focus:ring-navy focus:outline-none text-center"
      >
        Ver Ficha do Posto
      </Link>
    </div>
  );
}