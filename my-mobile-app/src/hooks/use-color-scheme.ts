import { useThemePreference } from '@/contexts/theme';

/**
 * Resolved app color scheme (honors manual toggle + system),
 * same idea as the website's next-themes `resolvedTheme`.
 */
export function useColorScheme() {
  return useThemePreference().resolved;
}
