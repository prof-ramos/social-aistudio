import { useEffect, useState } from 'react';
import { postoService } from '../services/postoService';

interface HighlightedPosto {
  name: string;
  slug: string;
  reviewCount: number;
  averageRating: number | null;
}

/**
 * The currently highlighted posto for the feed sidebar card.
 * Keeps PostoHighlightCard free of direct service access.
 */
export function useHighlightedPosto() {
  const [posto, setPosto] = useState<HighlightedPosto | null>(null);
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

  return { posto, loading };
}
