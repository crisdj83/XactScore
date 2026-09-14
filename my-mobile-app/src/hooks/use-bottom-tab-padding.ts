import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomTabInset, Spacing } from '@/constants/theme';

/**
 * Scroll/list padding so content clears the floating NativeTabs glass dock.
 * Includes home-indicator safe area — use this instead of bare BottomTabInset.
 */
export function useBottomTabPadding(extra: number = Spacing.four) {
  const insets = useSafeAreaInsets();
  return BottomTabInset + Math.max(insets.bottom, 8) + extra;
}

/** Absolute-positioned FABs above the tab dock (e.g. I'm lucky). */
export function useBottomFabOffset(extra: number = 12) {
  const insets = useSafeAreaInsets();
  return BottomTabInset + Math.max(insets.bottom, 8) + extra;
}
