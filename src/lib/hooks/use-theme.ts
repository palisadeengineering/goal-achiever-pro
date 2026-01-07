'use client';

import { useState, useEffect, useCallback, useSyncExternalStore } from 'react';

type Theme = 'light' | 'dark' | 'system';

// Helper to get system preference
function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

// Helper to resolve theme
function resolveTheme(theme: Theme): 'light' | 'dark' {
  return theme === 'system' ? getSystemTheme() : theme;
}

// Subscribe to localStorage changes
function subscribeToTheme(callback: () => void) {
  window.addEventListener('storage', callback);
  return () => window.removeEventListener('storage', callback);
}

// Get theme from localStorage
function getThemeSnapshot(): Theme {
  if (typeof window === 'undefined') return 'system';
  return (localStorage.getItem('theme') as Theme) || 'system';
}

// Server snapshot
function getServerSnapshot(): Theme {
  return 'system';
}

export function useTheme() {
  // Use useSyncExternalStore for localStorage to avoid setState in effects
  const theme = useSyncExternalStore(subscribeToTheme, getThemeSnapshot, getServerSnapshot);
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>(() => resolveTheme(theme));
  const [mounted, setMounted] = useState(false);

  // Apply theme to document (no state updates, just DOM manipulation)
  const applyThemeToDOM = useCallback((resolved: 'light' | 'dark') => {
    if (typeof window === 'undefined') return;
    document.documentElement.classList.toggle('dark', resolved === 'dark');
  }, []);

  // Set theme and persist
  const setTheme = useCallback((newTheme: Theme) => {
    const resolved = resolveTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    setResolvedTheme(resolved);
    applyThemeToDOM(resolved);
    // Trigger storage event for useSyncExternalStore
    window.dispatchEvent(new Event('storage'));
  }, [applyThemeToDOM]);

  // Toggle between light and dark
  const toggleTheme = useCallback(() => {
    const newTheme = resolvedTheme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  }, [resolvedTheme, setTheme]);

  // Handle mount and initial theme application
  // This is an intentional hydration pattern - we need to set mounted state
  // after hydration to prevent hydration mismatches with server-rendered content
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydration pattern
    setMounted(true);
    const resolved = resolveTheme(theme);
    setResolvedTheme(resolved);
    applyThemeToDOM(resolved);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- intentional mount-only effect

  // Listen for system theme changes
  useEffect(() => {
    if (!mounted) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (theme === 'system') {
        const resolved = getSystemTheme();
        setResolvedTheme(resolved);
        applyThemeToDOM(resolved);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [mounted, theme, applyThemeToDOM]);

  return {
    theme,
    resolvedTheme,
    setTheme,
    toggleTheme,
    mounted,
  };
}
