import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppTopBar } from '@/components/app-top-bar';
import { ThemeModeControl } from '@/components/theme-mode-control';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/auth';
import { useTranslations } from '@/contexts/locale';
import { useTheme } from '@/hooks/use-theme';

export default function ProfileScreen() {
  const theme = useTheme();
  const t = useTranslations();
  const { user, profile, signOut } = useAuth();

  const displayName = profile?.username || t('No username set');
  const email = profile?.email || user?.email || '—';
  const appearanceLabel =
    theme.preference === 'system'
      ? t('Follow phone')
      : theme.preference === 'dark'
        ? t('Dark mode')
        : t('Light mode');

  return (
    <ThemedView style={styles.root}>
      <AppTopBar includeSafeArea />
      <View style={styles.content}>
        <View style={styles.header}>
          <ThemedText type="subtitle" style={styles.title}>
            {t('Profile')}
          </ThemedText>
          <ThemedText themeColor="textSecondary">{t('Your XactScore account')}</ThemedText>
        </View>

        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.backgroundElement,
              borderColor: theme.border,
            },
          ]}>
          <ThemedText type="small" themeColor="textSecondary">
            {t('Appearance')}
          </ThemedText>
          <Text style={[styles.appearanceValue, { color: theme.text }]}>{appearanceLabel}</Text>
          <ThemeModeControl compact={false} />
        </View>

        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.backgroundElement,
              borderColor: theme.border,
            },
          ]}>
          <ThemedText type="small" themeColor="textSecondary">
            Username
          </ThemedText>
          <ThemedText type="default">{displayName}</ThemedText>

          <ThemedText type="small" themeColor="textSecondary" style={styles.fieldGap}>
            {t('Email')}
          </ThemedText>
          <ThemedText type="default">{email}</ThemedText>

          <ThemedText type="small" themeColor="textSecondary" style={styles.fieldGap}>
            Favorite team
          </ThemedText>
          <ThemedText type="default">{profile?.favorite_team || 'Not set'}</ThemedText>

          {profile?.is_global_admin ? (
            <View style={[styles.adminPill, { backgroundColor: theme.accentMuted }]}>
              <ThemedText type="smallBold" style={{ color: theme.accent }}>
                Global admin
              </ThemedText>
            </View>
          ) : null}
        </View>

        <Pressable
          onPress={() => void signOut()}
          style={[styles.signOut, { borderColor: theme.danger }]}>
          <ThemedText type="smallBold" style={{ color: theme.danger }}>
            {t('Sign out')}
          </ThemedText>
        </Pressable>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.four,
    paddingBottom: BottomTabInset + Spacing.four,
    gap: Spacing.four,
  },
  header: {
    gap: 4,
  },
  title: { fontSize: 28, lineHeight: 34 },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: Spacing.four,
    gap: Spacing.two,
  },
  appearanceValue: { fontSize: 16, fontWeight: '700', marginTop: 2 },
  fieldGap: { marginTop: Spacing.three },
  adminPill: {
    alignSelf: 'flex-start',
    marginTop: Spacing.three,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  signOut: {
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
