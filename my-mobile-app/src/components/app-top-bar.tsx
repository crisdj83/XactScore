import { Pressable, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LanguageSwitcher } from '@/components/language-switcher';
import { ThemeModeControl } from '@/components/theme-mode-control';
import { XactScoreLogo } from '@/components/xactscore-logo';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  showBrand?: boolean;
  includeSafeArea?: boolean;
};

function withAlpha(hex: string, alpha: number) {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

/**
 * Homepage-style top bar: logo + sun/moon/auto pill + EN pill,
 * with a soft gradient that fades into the page.
 */
export function AppTopBar({ showBrand = true, includeSafeArea = false }: Props) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const bg = theme.background;
  const topPad = includeSafeArea ? insets.top : 0;

  return (
    <View style={[styles.wrap, { paddingTop: topPad }]} pointerEvents="box-none">
      <LinearGradient
        pointerEvents="none"
        colors={[
          withAlpha(bg, 1),
          withAlpha(bg, 0.97),
          withAlpha(bg, 0.72),
          withAlpha(bg, 0.28),
          withAlpha(bg, 0),
        ]}
        locations={[0, 0.35, 0.58, 0.82, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.inner}>
        {showBrand ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="XactScore home"
            onPress={() => router.replace('/' as Href)}
            style={styles.brand}
            hitSlop={6}>
            <XactScoreLogo compact />
          </Pressable>
        ) : (
          <View style={{ flex: 1 }} />
        )}
        <View style={styles.actions}>
          <ThemeModeControl />
          <LanguageSwitcher />
        </View>
      </View>
    </View>
  );
}

/** Approximate height of the control row + fade (excluding status-bar inset). */
export const APP_TOP_BAR_CONTENT_HEIGHT = 78;

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 12,
    paddingBottom: 28,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 44,
    zIndex: 1,
  },
  brand: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 'auto',
  },
});
