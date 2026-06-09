import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'asof-dark-mode';

function readDarkModePreference(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(STORAGE_KEY) === 'true';
}

export function useDarkMode() {
  const [isDarkMode, setIsDarkMode] = useState(readDarkModePreference);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  const toggleDarkMode = useCallback(() => {
    setIsDarkMode((current) => {
      const next = !current;
      localStorage.setItem(STORAGE_KEY, String(next));
      return next;
    });
  }, []);

  return { isDarkMode, toggleDarkMode };
}