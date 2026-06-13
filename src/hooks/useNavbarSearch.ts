import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useGlobalSearch } from './useGlobalSearch';

/**
 * Global-search state plus the navbar's search-related side effects:
 * clear on outside click, clear on navigation, and focus on "/".
 * Escape handling stays in the navbar because it also closes the mobile menu.
 */
export function useNavbarSearch() {
  const location = useLocation();
  const { query, setQuery, results, isSearching, clearQuery } = useGlobalSearch();

  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Clear search when clicking outside the search area
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        clearQuery();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [clearQuery]);

  // Clear search on navigation
  useEffect(() => {
    clearQuery();
  }, [location.pathname, clearQuery]);

  // Keyboard shortcut: / focuses search
  useEffect(() => {
    function handleSlash(event: KeyboardEvent) {
      const target = event.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable;
      if (event.key === '/' && !event.metaKey && !event.ctrlKey && !event.altKey && !isInput) {
        event.preventDefault();
        searchInputRef.current?.focus();
      }
    }
    document.addEventListener('keydown', handleSlash);
    return () => document.removeEventListener('keydown', handleSlash);
  }, []);

  return { query, setQuery, results, isSearching, clearQuery, searchRef, searchInputRef };
}
