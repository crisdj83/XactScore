import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { ThemePreference } from '@/constants/theme';
import { useTranslations } from '@/contexts/locale';
import { useTheme } from '@/hooks/use-theme';

const OPTIONS: { value: ThemePreference; icon: keyof typeof Ionicons.glyphMap; labelKey: string }[] =
  [
    { value: 'light', icon: 'sunny', labelKey: 'Light mode' },
    { value: 'dark', icon: 'moon', labelKey: 'Dark mode' },
    { value: 'system', icon: 'phone-portrait-outline', labelKey: 'Auto' },
  ];

type Props = {
  compact?: boolean;
};

export function ThemeModeControl({ compact = true }: Props) {
  const theme = useTheme();
  const t = useTranslations();

  return (
    <View
      style={[
        styles.group,
        {
          backgroundColor: theme.isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9',
          borderColor: theme.border,
        },
      ]}>
      {OPTIONS.map((option) => {
        const active = theme.preference === option.value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            accessibilityLabel={t(option.labelKey)}
            accessibilityState={{ selected: active }}
            onPress={() => theme.setPreference(option.value)}
            style={({ pressed }) => [
              styles.option,
              compact ? styles.optionCompact : null,
              active && {
                backgroundColor: theme.isDark ? 'rgba(255,138,43,0.22)' : '#ffffff',
                borderColor: theme.isDark ? 'rgba(255,138,43,0.45)' : theme.borderStrong,
              },
              pressed && { opacity: 0.85 },
            ]}>
            <Ionicons
              name={option.icon}
              size={16}
              color={
                active
                  ? theme.isDark
                    ? '#fed7aa'
                    : theme.accent
                  : theme.textSecondary
              }
            />
            {!compact ? (
              <Text
                style={[
                  styles.label,
                  { color: active ? theme.text : theme.textSecondary },
                ]}>
                {t(option.labelKey)}
              </Text>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 999,
    padding: 3,
    gap: 2,
  },
  option: {
    minHeight: 36,
    minWidth: 36,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  optionCompact: {
    paddingHorizontal: 8,
  },
  label: {
    marginLeft: 4,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
});
