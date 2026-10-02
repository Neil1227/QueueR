/**
 * Theme management: system, light, and dark modes.
 */

export type ThemeMode = 'system' | 'light' | 'dark';

const THEME_STORAGE_KEY = 'queuer_theme';

export function getStoredTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'system';
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY) || localStorage.getItem('theme');
    if (saved === 'light' || saved === 'dark' || saved === 'system') {
      return saved;
    }
  } catch {
    // Ignore localStorage error
  }
  return 'system';
}

export function setStoredTheme(theme: ThemeMode): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
    localStorage.setItem('theme', theme);
  } catch {
    // Ignore localStorage error
  }
  applyTheme(theme);
}

export function getEffectiveTheme(theme: ThemeMode): 'light' | 'dark' {
  if (theme === 'dark') return 'dark';
  if (theme === 'light') return 'light';
  if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
}

export function applyTheme(theme: ThemeMode): void {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  const effective = getEffectiveTheme(theme);

  if (theme === 'dark') {
    root.setAttribute('data-theme', 'dark');
    root.classList.add('dark');
  } else if (theme === 'light') {
    root.setAttribute('data-theme', 'light');
    root.classList.remove('dark');
  } else {
    // System mode: remove explicit override so CSS media query activates
    root.removeAttribute('data-theme');
    if (effective === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }

  // Update theme-color meta tag
  const themeColorMeta = document.querySelector('meta[name="theme-color"]:not([media])');
  if (themeColorMeta) {
    themeColorMeta.setAttribute('content', effective === 'dark' ? '#1D1D1F' : '#F5F5F7');
  }
}
