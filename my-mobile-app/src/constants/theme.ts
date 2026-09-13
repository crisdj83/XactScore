/**
 * XactScore brand tokens — mirrored from website `app/globals.css`
 * light (:root) and dark (.dark) CSS variables.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    /** --xactscore-bg / page chrome */
    background: '#e2e8f0',
    /** --xactscore-card / white panels */
    backgroundElement: '#ffffff',
    /** selected / soft indigo wash */
    backgroundSelected: '#e0e7ff',
    /** --xactscore-text */
    text: '#0f172a',
    /** --xactscore-muted */
    textSecondary: '#64748b',
    /** --xactscore-accent indigo */
    accent: '#4f46e5',
    accentMuted: '#c7d2fe',
    /** --xactscore-orange */
    orange: '#f97316',
    border: '#e2e8f0',
    borderStrong: '#cbd5e1',
    danger: '#e11d48',
    success: '#059669',
    /** theme-color meta on web */
    statusBar: '#e2e8f0',
  },
  dark: {
    /** page chrome (html.dark uses zinc-900 for shell) */
    background: '#18181b',
    /** content panel / zinc card surface */
    backgroundElement: '#18181b',
    backgroundSelected: '#27272a',
    /** --xactscore-text */
    text: '#f7f7f8',
    /** --xactscore-muted */
    textSecondary: '#9a9aa3',
    /** --xactscore-accent orange */
    accent: '#ff8a2b',
    accentMuted: 'rgba(255,138,43,0.18)',
    /** --xactscore-orange */
    orange: '#ff7a18',
    border: 'rgba(255,255,255,0.10)',
    borderStrong: 'rgba(255,255,255,0.15)',
    danger: '#ff5a5f',
    success: '#34d399',
    statusBar: '#18181b',
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

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
