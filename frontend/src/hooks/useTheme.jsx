import { useState, useEffect, useCallback } from 'react';

export default function useTheme() {
  const [isDark, setIsDark] = useState(() => {
    try {
      return localStorage.getItem('tj_theme') === 'dark';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      if (isDark) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('tj_theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('tj_theme', 'light');
      }
    } catch {}
  }, [isDark]);

  const toggleTheme = useCallback(() => setIsDark(s => !s), []);

  return { isDark, toggleTheme, setIsDark };
}