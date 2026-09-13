import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useContest } from '@/contexts/contest';
import { PredictionCard } from '@/components/contest/prediction-card';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { useTranslations } from '@/contexts/locale';
import { useTheme } from '@/hooks/use-theme';
import { saveContestPredictionsBatch } from '@/lib/contest-api';

function randomScore() {
  return Math.random() < 0.75 ? Math.floor(Math.random() * 3) : Math.floor(Math.random() * 6);
}

function formatKickoff(utcDate: string) {
  const date = new Date(utcDate);
  if (!Number.isFinite(date.getTime())) return '—';
  return date.toLocaleString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function ContestPredictionsScreen() {
  const theme = useTheme();
  const t = useTranslations();
  const { data, contestId, refresh, setData, loading } = useContest();
  const [busyLucky, setBusyLucky] = useState(false);
  const [selectedMd, setSelectedMd] = useState<number | null>(null);

  const matchdays = data?.matchdays || [];
  const activeMd = selectedMd ?? data?.activeMatchday ?? matchdays[0] ?? 1;

  const mdMatches = useMemo(() => {
    const list = (data?.matches || []).filter((match) => match.matchday === activeMd);
    return list.sort((a, b) => {
      const rank = (match: typeof a) => {
        if (!match.locked && !['FINISHED', 'IN_PLAY', 'PAUSED'].includes(match.status)) return 0;
        if (match.locked && !['FINISHED'].includes(match.status)) return 1;
        return 2;
      };
      const diff = rank(a) - rank(b);
      if (diff !== 0) return diff;
      return new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime();
    });
  }, [data?.matches, activeMd]);

  const openLeft = mdMatches.filter((match) => {
    if (match.locked || ['FINISHED', 'IN_PLAY', 'PAUSED'].includes(match.status)) return false;
    return !data?.myPredictions[match.id];
  }).length;

  const grouped = useMemo(() => {
    const map = new Map<string, typeof mdMatches>();
    for (const match of mdMatches) {
      const key = match.utcDate.slice(0, 16);
      const list = map.get(key) || [];
      list.push(match);
      map.set(key, list);
    }
    return Array.from(map.entries());
  }, [mdMatches]);

  const onSaved = (matchId: string, home: number, away: number) => {
    if (!data) return;
    setData({
      ...data,
      myPredictions: {
        ...data.myPredictions,
        [matchId]: { home, away },
      },
    });
  };

  const onLucky = () => {
    if (!data) return;
    const targets = mdMatches.filter(
      (match) =>
        !match.locked &&
        !['FINISHED', 'IN_PLAY', 'PAUSED'].includes(match.status) &&
        !data.myPredictions[match.id]
    );
    if (targets.length === 0) {
      Alert.alert(t("I'm lucky"), t('No unlocked matches left to fill this gameweek.'));
      return;
    }
    Alert.alert(t("I'm lucky"), t('Fill remaining unlocked picks with random scores?'), [
      { text: t('Cancel'), style: 'cancel' },
      {
        text: t('Fill picks'),
        onPress: () => {
          void (async () => {
            setBusyLucky(true);
            try {
              const payload = targets.map((match) => ({
                matchId: match.id,
                home: randomScore(),
                away: randomScore(),
              }));
              await saveContestPredictionsBatch(contestId, payload);
              await refresh();
            } catch (err) {
              Alert.alert(
                t("I'm lucky"),
                err instanceof Error ? err.message : 'Failed to fill picks'
              );
            } finally {
              setBusyLucky(false);
            }
          })();
        },
      },
    ]);
  };

  if (!data) {
    return (
      <View style={styles.center}>
        {loading ? <ActivityIndicator color={theme.accent} /> : null}
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={() => void refresh()}
            tintColor={theme.accent}
          />
        }>
        <View style={styles.mdHeader}>
          <Text style={[styles.heading, { color: theme.text }]}>
            {t('Matchday')} {activeMd}
          </Text>
          <Text style={{ color: theme.textSecondary, fontWeight: '600', fontSize: 13 }}>
            {openLeft > 0
              ? `${openLeft} ${openLeft === 1 ? t('pick left') : t('picks left')}`
              : t('All picks in')}
          </Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.mdStrip}>
          {matchdays.map((md) => {
            const active = md === activeMd;
            return (
              <Pressable
                key={md}
                onPress={() => setSelectedMd(md)}
                style={[
                  styles.mdChip,
                  {
                    backgroundColor: active
                      ? theme.accent
                      : theme.isDark
                        ? 'rgba(255,255,255,0.06)'
                        : '#f1f5f9',
                    borderColor: theme.border,
                  },
                ]}>
                <Text
                  style={{
                    color: active ? (theme.isDark ? '#0f0f10' : '#ffffff') : theme.textSecondary,
                    fontWeight: '800',
                    fontSize: 12,
                  }}>
                  MD {md}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <Text style={[styles.lockCopy, { color: theme.textSecondary }]}>
          {t('Predictions lock 60 minutes before kickoff.')}
        </Text>

        {grouped.map(([key, matches]) => (
          <View key={key} style={styles.group}>
            <Text style={[styles.groupLabel, { color: theme.textSecondary }]}>
              {formatKickoff(matches[0].utcDate)}
            </Text>
            {matches.map((match) => {
              const pick = data.myPredictions[match.id];
              return (
                <PredictionCard
                  key={match.id}
                  contestId={contestId}
                  match={match}
                  initialHome={pick?.home ?? null}
                  initialAway={pick?.away ?? null}
                  onSaved={onSaved}
                />
              );
            })}
          </View>
        ))}

        {mdMatches.length === 0 ? (
          <Text style={{ color: theme.textSecondary, textAlign: 'center', marginTop: 24 }}>
            {t('No fixtures for this matchday.')}
          </Text>
        ) : null}
      </ScrollView>

      {openLeft > 0 ? (
        <Pressable
          onPress={onLucky}
          disabled={busyLucky}
          style={[
            styles.lucky,
            { backgroundColor: theme.accent, opacity: busyLucky ? 0.6 : 1 },
          ]}>
          {busyLucky ? (
            <ActivityIndicator color={theme.isDark ? '#0f0f10' : '#ffffff'} />
          ) : (
            <Text
              style={[styles.luckyText, { color: theme.isDark ? '#0f0f10' : '#ffffff' }]}>
              {t("I'm lucky")}
            </Text>
          )}
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: {
    padding: Spacing.three,
    paddingBottom: BottomTabInset + 80,
    gap: 12,
  },
  mdHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  heading: { fontSize: 20, fontWeight: '800' },
  mdStrip: { gap: 8, paddingVertical: 4 },
  mdChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  lockCopy: { fontSize: 12, fontWeight: '600' },
  group: { gap: 8 },
  groupLabel: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 4,
  },
  lucky: {
    position: 'absolute',
    right: 16,
    bottom: 24,
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  luckyText: {
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    fontSize: 12,
  },
});
