import { Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '@/hooks/use-theme';

type Props = {
  size?: number;
};

export function ThemeToggle({ size = 44 }: Props) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={theme.isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      onPress={theme.toggle}
      style={({ pressed }) => [
        styles.button,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: theme.isDark ? 'rgba(255,255,255,0.06)' : '#ffffff',
          borderColor: theme.border,
          opacity: pressed ? 0.85 : 1,
        },
      ]}>
      <Ionicons
        name={theme.isDark ? 'moon' : 'sunny'}
        size={18}
        color={theme.isDark ? '#fed7aa' : '#d97706'}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
