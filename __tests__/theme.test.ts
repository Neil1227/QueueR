import { describe, it, expect, beforeEach } from 'vitest';
import { getStoredTheme, setStoredTheme, getEffectiveTheme, applyTheme, ThemeMode } from '@/lib/theme';

describe('Theme & Dark Mode Management', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  it('defaults to system theme when none is saved', () => {
    expect(getStoredTheme()).toBe('system');
  });

  it('stores and retrieves theme mode correctly', () => {
    setStoredTheme('dark');
    expect(getStoredTheme()).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');

    setStoredTheme('light');
    expect(getStoredTheme()).toBe('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');

    setStoredTheme('system');
    expect(getStoredTheme()).toBe('system');
    expect(document.documentElement.getAttribute('data-theme')).toBeNull();
  });

  it('evaluates effective theme correctly for light and dark', () => {
    expect(getEffectiveTheme('dark')).toBe('dark');
    expect(getEffectiveTheme('light')).toBe('light');
  });

  it('applies data-theme attribute on document root', () => {
    applyTheme('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');

    applyTheme('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');

    applyTheme('system');
    expect(document.documentElement.getAttribute('data-theme')).toBeNull();
  });
});
