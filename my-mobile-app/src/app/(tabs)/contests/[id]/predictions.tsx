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
import { Ionicons } from '@expo/vector-icons';

import { PredictionCard } from '@/components/contest/prediction-card';
import { GlassChipStrip } from '@/components/glass-segmented';
import { Spacing } from '@/constants/theme';
import { useContest } from '@/contexts/contest';
import { useTranslations } from '@/contexts/locale';
import { useTheme } from '@/hooks/use-theme';
import { useBottomFabOffset, useBottomTabPadding } from '@/hooks/use-bottom-tab-padding';
import { saveContestPredictionsBatch } from '@/lib/contest-api';

function randomScore() {
  return Math.random() < 0.75 ? Math.floor(Math.random() * 3) : Math.floor(Math.random() * 6);
}

function kickoffMinuteKey(utcDate: string) {
  const kickoff = new Date(utcDate).getTime();
  if (!Number.isFinite(kickoff)) return 'unknown';
  return String(Math.floor(kickoff / 60_000));
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

/** Website-style Matchday strip with glass track + sliding pill. */
function MatchdayStrip({
  matchdays,
  selected,
  onSelect,
}: {
  matchdays: number[];
  selected: number;
  onSelect: (md: number) => void;
}) {
  const t = useTranslations();
  return (
    <GlassChipStrip
      items={matchdays.map((md) => ({
        key: String(md),
        label: `${t('Matchday')} ${md}`,
      }))}
      value={String(selected)}
      onChange={(key) => onSelect(Number(key))}
    />
  );
}

export default function ContestPredictionsScreen() {
  const theme = useTheme();
  const t = useTranslations();
  const bottomPad = useBottomTabPadding();
  const luckyBottom = useBottomFabOffset(12);
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
        if (match.locked && match.status !== 'FINISHED') return 1;
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

  const openThisWeek = mdMatches.filter(
    (match) => !match.locked && !['FINISHED', 'IN_PLAY', 'PAUSED'].includes(match.status)
  );

  const grouped = useMemo(() => {
    const groups: { key: string; utcDate: string; matches: typeof mdMatches }[] = [];
    for (const match of mdMatches) {
      const minuteKey = kickoffMinuteKey(match.utcDate);
      const last = groups[groups.length - 1];
      if (last && last.key.startsWith(minuteKey)) {
        last.matches.push(match);
        continue;
      }
      groups.push({
        key: `${minuteKey}-${groups.length}`,
        utcDate: match.utcDate,
        matches: [match],
      });
    }
    return groups;
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
    Alert.alert(
      t('ATTENTION!'),
      t(
        "You're handing the whole gameweek to fate. Unlocked matches get a fresh roll and your current picks for those games get benched. No refunds, only glory."
      ),
      [
        { text: t('No'), style: 'cancel' },
        {
          text: t('Yes'),
          onPress: () => {
            void (async () => {
              setBusyLucky(true);
              try {
                await saveContestPredictionsBatch(
                  contestId,
                  targets.map((match) => ({
                    matchId: match.id,
                    home: randomScore(),
                    away: randomScore(),
                  }))
                );
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
      ]
    );
  };

  if (!data) {
    return (
      <View style={styles.center}>
        {loading ? <ActivityIndicator color={theme.accent} /> : null}
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingBottom: openLeft > 0 ? luckyBottom + 64 : bottomPad,
          },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={() => void refresh()}
            tintColor={theme.accent}
          />
        }
        showsVerticalScrollIndicator={false}>
        <View
          style={[
            styles.panel,
            {
              backgroundColor: theme.isDark ? 'transparent' : theme.backgroundElement,
              borderColor: theme.isDark ? 'transparent' : theme.border,
            },
          ]}>
          <MatchdayStrip
            matchdays={matchdays}
            selected={activeMd}
            onSelect={setSelectedMd}
          />

          {grouped.map((group, index) => (
            <View key={group.key} style={styles.group}>
              <View style={styles.groupHeader}>
                <Text style={[styles.groupTime, { color: theme.textSecondary }]}>
                  {formatKickoff(group.utcDate)}
                </Text>
                {index === 0 ? (
                  <View style={styles.groupAside}>
                    {openThisWeek.length > 0 ? (
                      openLeft > 0 ? (
                        <View style={[styles.picksBadge, { backgroundColor: theme.accent }]}>
                          <Text
                            style={[
                              styles.picksBadgeText,
                              { color: theme.isDark ? '#0f0f10' : '#ffffff' },
                            ]}>
                            {openLeft} {openLeft === 1 ? t('pick left') : t('picks left')}
                          </Text>
                        </View>
                      ) : (
                        <View
                          style={[
                            styles.picksBadgeOutline,
                            {
                              borderColor: theme.isDark
                                ? 'rgba(255,255,255,0.15)'
                                : '#e2e8f0',
                            },
                          ]}>
                          <Text
                            style={[
                              styles.picksBadgeOutlineText,
                              { color: theme.textSecondary },
                            ]}>
                            {t('All picks in')}
                          </Text>
                        </View>
                      )
                    ) : null}
                    <Text
                      style={[styles.lockHint, { color: theme.textSecondary }]}
                      numberOfLines={1}>
                      {t('Picks lock 60 minutes before kickoff.')}
                    </Text>
                  </View>
                ) : null}
              </View>

              {group.matches.map((match) => {
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
            <Text style={[styles.empty, { color: theme.textSecondary }]}>
              {t('No fixtures for this matchday.')}
            </Text>
          ) : null}
        </View>
      </ScrollView>

      {openLeft > 0 ? (
        <View pointerEvents="box-none" style={[styles.luckyWrap, { bottom: luckyBottom }]}>
          <Pressable
            onPress={onLucky}
            disabled={busyLucky}
            style={({ pressed }) => [
              styles.luckyFab,
              {
                backgroundColor: theme.isDark ? '#f59e0b' : theme.accent,
                opacity: busyLucky ? 0.7 : pressed ? 0.92 : 1,
                transform: [{ scale: pressed ? 0.97 : 1 }],
                shadowColor: theme.isDark ? '#f59e0b' : theme.accent,
              },
            ]}>
            {busyLucky ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <>
                <Ionicons name="dice-outline" size={20} color="#ffffff" />
                <Text style={styles.luckyText}>{t("I'm lucky")}</Text>
              </>
            )}
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
  },
  panel: {
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 6,
    gap: 12,
  },
  group: { gap: 6 },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingHorizontal: 4,
    minHeight: 22,
  },
  groupTime: {
    fontSize: 12,
    fontWeight: '600',
    flexShrink: 0,
  },
  groupAside: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 6,
    minWidth: 0,
  },
  picksBadge: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  picksBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  picksBadgeOutline: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  picksBadgeOutlineText: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  lockHint: {
    flexShrink: 1,
    fontSize: 10,
    fontWeight: '500',
    textAlign: 'right',
  },
  empty: { textAlign: 'center', marginTop: 40, fontSize: 14 },
  luckyWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  luckyFab: {
    minWidth: 160,
    minHeight: 48,
    borderRadius: 999,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  luckyText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
});
