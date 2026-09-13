import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Stack, useLocalSearchParams, usePathname, useRouter, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { ContestProvider, useContest } from '@/contexts/contest';
import { useTranslations } from '@/contexts/locale';
import { useTheme } from '@/hooks/use-theme';

type TabDef = {
  segment: string;
  href: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
};

function ContestShell() {
  const theme = useTheme();
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { contestId, data, loading, error, refresh } = useContest();

  const isAdmin = data?.role === 'admin';
  const tabs: TabDef[] = [
    {
      segment: 'predictions',
      href: `/contest/${contestId}/predictions`,
      label: t('Predictions'),
      icon: 'football',
    },
    {
      segment: 'ranking',
      href: `/contest/${contestId}/ranking`,
      label: t('Table'),
      icon: 'podium',
    },
    {
      segment: 'fixtures',
      href: `/contest/${contestId}/fixtures`,
      label: t('Fixtures'),
      icon: 'calendar',
    },
    {
      segment: 'rules',
      href: `/contest/${contestId}/rules`,
      label: t('Rules'),
      icon: 'book',
    },
    ...(isAdmin
      ? [
          {
            segment: 'edit',
            href: `/contest/${contestId}/edit`,
            label: t('Settings'),
            icon: 'settings' as const,
          },
        ]
      : []),
  ];

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <View
        style={[
          styles.topBar,
          {
            paddingTop: insets.top + 8,
            backgroundColor: theme.isDark ? '#09090b' : theme.backgroundElement,
            borderBottomColor: theme.border,
          },
        ]}>
        <Pressable
          onPress={() => router.replace('/contests' as Href)}
          style={styles.backBtn}
          hitSlop={10}>
          <Ionicons name="chevron-back" size={22} color={theme.accent} />
        </Pressable>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text numberOfLines={1} style={[styles.title, { color: theme.text }]}>
            {data?.contest.name || t('Contest Hub')}
          </Text>
          {data ? (
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              {data.role === 'admin' ? t('Admin') : t('Member')}
              {data.contest.isPublic
                ? ` · ${t('Public')}`
                : ` · ${t('Key:')} ${data.contest.contestKey}`}
            </Text>
          ) : null}
        </View>
      </View>

      <View
        style={[
          styles.nav,
          {
            backgroundColor: theme.isDark ? 'rgba(9,9,11,0.85)' : theme.backgroundElement,
            borderBottomColor: theme.border,
          },
        ]}>
        {tabs.map((tab) => {
          const active = pathname.includes(`/${tab.segment}`);
          return (
            <Pressable
              key={tab.href}
              onPress={() => router.push(tab.href as Href)}
              style={[
                styles.tabBtn,
                active && {
                  backgroundColor: theme.isDark ? 'rgba(255,138,43,0.18)' : theme.backgroundSelected,
                },
              ]}>
              <Ionicons
                name={tab.icon}
                size={16}
                color={active ? theme.accent : theme.textSecondary}
              />
              <Text
                style={[
                  styles.tabLabel,
                  { color: active ? theme.text : theme.textSecondary },
                ]}
                numberOfLines={1}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {loading && !data ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.accent} />
        </View>
      ) : error && !data ? (
        <View style={styles.center}>
          <Text style={{ color: theme.danger, textAlign: 'center', paddingHorizontal: 24 }}>
            {error}
          </Text>
          <Pressable onPress={() => void refresh()} style={{ marginTop: 12 }}>
            <Text style={{ color: theme.accent, fontWeight: '700' }}>{t('Retry')}</Text>
          </Pressable>
        </View>
      ) : (
        <Stack screenOptions={{ headerShown: false }} />
      )}
    </View>
  );
}

export default function ContestLayout() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const contestId = String(id || '');

  return (
    <ContestProvider contestId={contestId}>
      <ContestShell />
    </ContestProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 17, fontWeight: '800' },
  subtitle: { marginTop: 2, fontSize: 11, fontWeight: '600' },
  nav: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 4,
    paddingVertical: 6,
    gap: 2,
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    minHeight: 44,
    borderRadius: 10,
    paddingHorizontal: 2,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
