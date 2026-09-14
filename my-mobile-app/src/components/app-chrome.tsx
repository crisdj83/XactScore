import { StyleSheet, View, type ViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { APP_TOP_BAR_CONTENT_HEIGHT, AppTopBar } from '@/components/app-top-bar';
import { useTheme } from '@/hooks/use-theme';

type Props = ViewProps & {
  children: React.ReactNode;
  hideTopBar?: boolean;
};

/**
 * Shared homepage top chrome. Bottom dock is NativeTabs (real liquid glass).
 */
export function AppChrome({
  children,
  hideTopBar = false,
  style,
  ...rest
}: Props) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const topPad = hideTopBar ? 0 : insets.top + APP_TOP_BAR_CONTENT_HEIGHT - 16;

  return (
    <View style={[styles.root, { backgroundColor: theme.background }, style]} {...rest}>
      <View style={[styles.body, { paddingTop: topPad }]}>{children}</View>

      {!hideTopBar ? (
        <View style={styles.topOverlay} pointerEvents="box-none">
          <AppTopBar includeSafeArea />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  body: { flex: 1 },
  topOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 30,
  },
});
