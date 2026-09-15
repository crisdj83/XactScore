/**
 * App Store–style glass tab palette (light + dark).
 * Active accent stays system blue in both appearances.
 */
export const GlassTabColors = {
  active: '#007AFF',
  light: {
    inactive: '#000000',
    trackWash: 'rgba(255,255,255,0.72)',
    trackBorder: 'rgba(255,255,255,0.85)',
    /** Raised white glass pill — must stay visible on frosted white track */
    indicator: '#FFFFFF',
    indicatorBorder: 'rgba(0,0,0,0.06)',
    indicatorHighlight: 'rgba(255,255,255,0.95)',
    blurTint: 'systemChromeMaterialLight' as const,
    blurIntensity: 70,
  },
  dark: {
    inactive: '#FFFFFF',
    trackWash: 'rgba(5,10,7,0.55)',
    trackBorder: 'rgba(18,255,128,0.18)',
    indicator: 'rgba(18,255,128,0.16)',
    indicatorBorder: 'rgba(18,255,128,0.28)',
    indicatorHighlight: 'rgba(255,255,255,0.10)',
    blurTint: 'systemChromeMaterialDark' as const,
    blurIntensity: 56,
  },
} as const;

export function glassTabPalette(isDark: boolean) {
  return isDark ? GlassTabColors.dark : GlassTabColors.light;
}
