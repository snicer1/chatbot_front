import { useEffect } from 'preact/hooks';
import type { ThemeConfig } from '../types';

export function useTheme(theme: Required<ThemeConfig>, containerId: string) {
  useEffect(() => {
    const container = document.getElementById(containerId);
    if (!container) return;

    const cssVars: Record<string, string> = {
      '--chat-primary': theme.primary,
      '--chat-primary-hover': theme.primaryHover,
      '--chat-bg': theme.background,
      '--chat-bg-secondary': theme.backgroundSecondary,
      '--chat-text': theme.text,
      '--chat-text-secondary': theme.textSecondary,
      '--chat-border': theme.border,
      '--chat-font-family': theme.fontFamily,
      '--chat-font-mono': theme.fontFamilyMono,
      '--chat-font-size': `${theme.fontSize}px`,
      '--chat-border-radius': `${theme.borderRadius}px`,
      ...theme.cssVariables
    };

    Object.entries(cssVars).forEach(([key, value]) => container.style.setProperty(key, value));

    if (theme.mode === 'dark') {
      container.setAttribute('data-theme', 'dark');
    } else if (theme.mode === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      container.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    }
  }, [theme, containerId]);
}
