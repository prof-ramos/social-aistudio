import { useState, useEffect, useRef, useCallback } from 'react';
import { searchService, SearchResult } from '../services/searchService';

export function useGlobalSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult>({ users: [], posts: [], postos: [] });
  const [isSearching, setIsSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (query.length < 2) {
      setResults({ users: [], posts: [], postos: [] });
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const data = await searchService.searchAll(query);
        setResults(data);
      } catch {
        setResults({ users: [], posts: [], postos: [] });
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query]);

  const clearQuery = useCallback(() => {
    setQuery('');
    setResults({ users: [], posts: [], postos: [] });
  }, []);

  return { query, setQuery, results, isSearching, clearQuery };
}