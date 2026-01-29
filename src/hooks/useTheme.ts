import { useEffect } from 'preact/hooks';
import type { ThemeConfig } from '../types';

export function useTheme(theme: Required<ThemeConfig>, containerId: string) {
  useEffect(() => {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Only override colors if explicitly provided (not using default theme)
    // This allows CSS file to handle dark mode colors
    const isUsingCustomColors =
      theme.primary !== '#6366f1' ||
      theme.background !== '#ffffff' ||
      theme.cssVariables && Object.keys(theme.cssVariables).length > 0;

    const cssVars: Record<string, string> = {
      // Typography - always set these
      '--chat-font-family': theme.fontFamily,
      '--chat-font-mono': theme.fontFamilyMono,
      '--chat-font-size': `${theme.fontSize}px`,
      '--chat-border-radius': `${theme.borderRadius}px`,
      // Custom CSS variables
      ...theme.cssVariables
    };

    // Only set color variables as inline styles if using custom colors
    // Otherwise, let the CSS file handle it based on data-theme
    if (isUsingCustomColors) {
      cssVars['--chat-primary'] = theme.primary;
      cssVars['--chat-primary-hover'] = theme.primaryHover;
      cssVars['--chat-bg'] = theme.background;
      cssVars['--chat-bg-secondary'] = theme.backgroundSecondary;
      cssVars['--chat-text'] = theme.text;
      cssVars['--chat-text-secondary'] = theme.textSecondary;
      cssVars['--chat-border'] = theme.border;
    }

    Object.entries(cssVars).forEach(([key, value]) => container.style.setProperty(key, value));

    // Set data-theme attribute for CSS selectors
    if (theme.mode === 'dark') {
      container.setAttribute('data-theme', 'dark');
    } else if (theme.mode === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      container.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    } else {
      container.setAttribute('data-theme', 'light');
    }
  }, [theme, containerId]);
}
