import { useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { localeNames, locales, type Locale } from '@/lib/i18n';
import { useLocale, useTranslations } from '@/contexts/locale';
import { useTheme } from '@/hooks/use-theme';

export function LanguageSwitcher() {
  const theme = useTheme();
  const t = useTranslations();
  const insets = useSafeAreaInsets();
  const { locale, setLocale } = useLocale();
  const [open, setOpen] = useState(false);

  const pick = (next: Locale) => {
    setLocale(next);
    setOpen(false);
  };

  return (
    <>
      <View
        style={[
          styles.group,
          {
            backgroundColor: theme.isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9',
            borderColor: theme.border,
          },
        ]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('Language')}
          accessibilityState={{ expanded: open }}
          onPress={() => setOpen(true)}
          style={({ pressed }) => [
            styles.option,
            {
              backgroundColor: theme.isDark ? 'rgba(255,138,43,0.22)' : '#ffffff',
              borderColor: theme.isDark ? 'rgba(255,138,43,0.45)' : theme.borderStrong,
            },
            pressed && { opacity: 0.85 },
          ]}>
          <Text
            style={[
              styles.optionLabel,
              { color: theme.isDark ? '#fed7aa' : theme.accent },
            ]}>
            {locale.toUpperCase()}
          </Text>
        </Pressable>
      </View>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}>
        <Pressable
          style={[styles.backdrop, { paddingTop: insets.top + 56 }]}
          onPress={() => setOpen(false)}>
          <View style={styles.menuAnchor} pointerEvents="box-none">
            <Pressable
              onPress={(e) => e.stopPropagation()}
              style={[
                styles.menu,
                {
                  backgroundColor: theme.backgroundElement,
                  borderColor: theme.border,
                  shadowColor: '#000',
                },
              ]}>
              <Text style={[styles.menuTitle, { color: theme.textSecondary }]}>
                {t('Language')}
              </Text>
              {locales.map((item) => {
                const active = locale === item;
                return (
                  <Pressable
                    key={item}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    onPress={() => pick(item)}
                    style={({ pressed }) => [
                      styles.menuOption,
                      active && {
                        backgroundColor: theme.isDark
                          ? 'rgba(255,138,43,0.18)'
                          : theme.backgroundSelected,
                      },
                      pressed && { opacity: 0.88 },
                    ]}>
                    <View style={styles.menuOptionText}>
                      <Text
                        style={[
                          styles.menuOptionCode,
                          { color: active ? theme.accent : theme.text },
                        ]}>
                        {item.toUpperCase()}
                      </Text>
                      <Text style={[styles.menuOptionName, { color: theme.textSecondary }]}>
                        {localeNames[item]}
                      </Text>
                    </View>
                    {active ? (
                      <Ionicons name="checkmark" size={18} color={theme.accent} />
                    ) : null}
                  </Pressable>
                );
              })}
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  // Match ThemeModeControl group + option exactly
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
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  optionLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
  },
  menuAnchor: {
    width: '100%',
    maxWidth: 220,
    alignItems: 'flex-end',
  },
  menu: {
    width: 220,
    borderRadius: 16,
    borderWidth: 1,
    padding: 8,
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  menuTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  menuOption: {
    minHeight: 44,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  menuOptionText: { flex: 1, gap: 2 },
  menuOptionCode: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  menuOptionName: {
    fontSize: 12,
    fontWeight: '500',
  },
});
