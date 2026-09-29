'use client';

import { useState, useEffect, useCallback } from 'react';
import { ThemeMode, getStoredTheme, setStoredTheme, applyTheme, getEffectiveTheme } from '@/lib/theme';

export function useTheme() {
  const [theme, setThemeState] = useState<ThemeMode>('system');
  const [effectiveTheme, setEffectiveTheme] = useState<'light' | 'dark'>('light');

  // Load stored theme on mount and apply listeners
  useEffect(() => {
    const current = getStoredTheme();
    setThemeState(current);
    applyTheme(current);
    setEffectiveTheme(getEffectiveTheme(current));

    // Listen to OS prefers-color-scheme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleMediaChange = () => {
      const active = getStoredTheme();
      if (active === 'system') {
        applyTheme('system');
        setEffectiveTheme(getEffectiveTheme('system'));
      }
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleMediaChange);
    } else {
      mediaQuery.addListener(handleMediaChange);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleMediaChange);
      } else {
        mediaQuery.removeListener(handleMediaChange);
      }
    };
  }, []);

  const setTheme = useCallback((newTheme: ThemeMode) => {
    setThemeState(newTheme);
    setStoredTheme(newTheme);
    setEffectiveTheme(getEffectiveTheme(newTheme));
  }, []);

  return {
    theme,
    effectiveTheme,
    setTheme,
  };
}
