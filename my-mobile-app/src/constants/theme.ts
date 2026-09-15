/**
 * XactScore brand tokens — mirrored from website `app/globals.css`
 * light (:root) and dark (.dark) CSS variables.
 * Dark theme: near-black + neon green (#12FF80).
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    /** --xactscore-bg / page chrome */
    background: '#e2e8f0',
    /** --xactscore-card / white panels */
    backgroundElement: '#ffffff',
    /** selected / soft green wash */
    backgroundSelected: '#d1fae5',
    /** --xactscore-text */
    text: '#0f172a',
    /** --xactscore-muted */
    textSecondary: '#64748b',
    /** light mode keeps a solid green primary */
    accent: '#059669',
    accentMuted: '#a7f3d0',
    orange: '#059669',
    border: '#e2e8f0',
    borderStrong: '#cbd5e1',
    danger: '#e11d48',
    success: '#059669',
    /** theme-color meta on web */
    statusBar: '#e2e8f0',
  },
  dark: {
    /** page chrome — near-black with a soft green cast for seamless screens */
    background: '#050a07',
    /** elevated card surface — dark forest green (matches home hero cards) */
    backgroundElement: '#0e1612',
    backgroundSelected: '#14201a',
    /** --xactscore-text */
    text: '#ffffff',
    /** --xactscore-muted */
    textSecondary: '#94a3b8',
    /** neon green accent */
    accent: '#12ff80',
    accentMuted: 'rgba(18,255,128,0.16)',
    orange: '#12ff80',
    border: 'rgba(18,255,128,0.14)',
    borderStrong: 'rgba(18,255,128,0.32)',
    danger: '#ff5a5f',
    success: '#12ff80',
    statusBar: '#050a07',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;
export type ResolvedTheme = 'light' | 'dark';
export type ThemePreference = 'light' | 'dark' | 'system';

/** Same storage key idea as the website (`xactscore-theme`). */
export const THEME_STORAGE_KEY = 'xactscore-theme';

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

/** Floating NativeTabs glass dock height (above home indicator). */
export const BottomTabInset = Platform.select({ ios: 88, android: 84 }) ?? 84;
export const MaxContentWidth = 800;
