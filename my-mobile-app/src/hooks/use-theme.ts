/**
 * Theme colors + helpers for the active light/dark mode
 * (matches website xactscore tokens).
 */

import { useThemePreference } from '@/contexts/theme';

export function useTheme() {
  const { colors, isDark, preference, resolved, setPreference, toggle } = useThemePreference();
  return {
    ...colors,
    isDark,
    preference,
    resolved,
    setPreference,
    toggle,
  };
}
