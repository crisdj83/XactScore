import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HomeHeroBanner } from '@/components/home/hero-banner';
import { HomeProfileStrip } from '@/components/home/profile-strip';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { fetchHomeDashboard, type HomeDashboard } from '@/lib/home-api';

/** Match the gap under the header so the hero sits symmetrically above the tabs. */
const EDGE_GAP = Spacing.three;

export default function HomeScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [data, setData] = useState<HomeDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    setNotice(null);
    try {
      const dashboard = await fetchHomeDashboard();
      setData(dashboard);
      if (dashboard.source === 'supabase') {
        setNotice(
          'Showing your leagues from your account. Fixture highlights may be limited right now.',
        );
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load home';
      setError(
        message.includes('<!DOCTYPE') || message.includes('<html')
          ? 'Could not load Home. Pull to refresh.'
          : message,
      );
      setData(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void load();
    }, [load]),
  );

  const bottomPad = EDGE_GAP + BottomTabInset + Math.max(insets.bottom, 8);

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: EDGE_GAP,
            paddingBottom: bottomPad,
          },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void load();
            }}
            tintColor={theme.accent}
          />
        }>
        {loading && !data ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={theme.accent} />
          </View>
        ) : null}

        {notice ? (
          <View
            style={[
              styles.noticeCard,
              {
                backgroundColor: `${theme.accent}18`,
                borderColor: theme.accent,
              },
            ]}>
            <Text style={[styles.noticeText, { color: theme.text }]}>{notice}</Text>
          </View>
        ) : null}

        {error ? (
          <View
            style={[
              styles.errorCard,
              {
                backgroundColor: `${theme.danger}18`,
                borderColor: theme.danger,
              },
            ]}>
            <Text style={[styles.errorText, { color: theme.danger }]}>{error}</Text>
          </View>
        ) : null}

        {data ? (
          <>
            <HomeProfileStrip
              username={data.profile.username}
              email={data.profile.email}
              avatarUrl={data.profile.avatarUrl}
              favoriteTeam={data.profile.favoriteTeam}
              favoriteCrest={data.profile.favoriteCrest}
              isGlobalAdmin={data.profile.isGlobalAdmin}
              bestRank={data.bestRank}
            />

            <HomeHeroBanner
              fill
              nextMatch={data.nextMatch}
              recentScores={data.recentScores}
              predictPath={data.predictPath}
            />
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: {
    flexGrow: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.three,
    gap: 12,
  },
  loadingWrap: {
    paddingVertical: Spacing.six,
    alignItems: 'center',
  },
  noticeCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: Spacing.three,
  },
  noticeText: { fontSize: 13, lineHeight: 18, fontWeight: '600' },
  errorCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: Spacing.three,
    gap: 6,
  },
  errorText: { fontSize: 14, fontWeight: '700' },
});
