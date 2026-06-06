import { useState, useEffect, useMemo } from 'react';
import { postoService } from '../services/postoService';
import { STATIC_POSTOS } from '../data/postosData';

export function usePostos() {
  const [dbPostos, setDbPostos] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [regionFilter, setRegionFilter] = useState('');

  useEffect(() => {
    const unsub = postoService.subscribeToPostos((postos) => {
      setDbPostos(postos);
    });
    return () => unsub();
  }, []);

  const allPostos = useMemo(() => {
    const mapped = new Map();
    STATIC_POSTOS.forEach(p => mapped.set(p.slug, { id: p.slug, ...p }));
    dbPostos.forEach(p => mapped.set(p.slug, p)); // DB overrides static if same slug
    return Array.from(mapped.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [dbPostos]);

  const filtered = allPostos.filter(p => {
    const term = search.toLowerCase();
    const matchSearch = !search || p.name.toLowerCase().includes(term) || p.country.toLowerCase().includes(term) || p.region.toLowerCase().includes(term);
    const matchRegion = !regionFilter || p.region === regionFilter;
    return matchSearch && matchRegion;
  });

  const regions = useMemo(() => Array.from(new Set(allPostos.map(p => p.region))).sort(), [allPostos]);

  return {
    search,
    setSearch,
    regionFilter,
    setRegionFilter,
    filtered,
    regions
  };
}
