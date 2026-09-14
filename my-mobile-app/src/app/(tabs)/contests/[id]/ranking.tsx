import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { GlassChipStrip } from '@/components/glass-segmented';
import { UserAvatar } from '@/components/user-avatar';
import { useContest } from '@/contexts/contest';
import { Spacing } from '@/constants/theme';
import { useTranslations } from '@/contexts/locale';
import { useTheme } from '@/hooks/use-theme';
import { useBottomTabPadding } from '@/hooks/use-bottom-tab-padding';
import type { ContestMatch, ContestMember, ContestRankingRow } from '@/lib/contest-api';
import {
  PREDICTION_REVEAL_MS,
  calculatePoints,
  type ContestScoring,
} from '@/lib/scoring';
import { teamTla } from '@/lib/team-tla';

type PickRow = {
  userId: string;
  name: string;
  avatarUrl: string | null;
  prediction: string;
  points: number | null;
  outcome: 'zero' | 'close' | 'exact' | 'result';
};

function ordinal(n: number) {
  const v = n % 100;
  if (v >= 11 && v <= 13) return `${n}th`;
  switch (n % 10) {
    case 1:
      return `${n}st`;
    case 2:
      return `${n}nd`;
    case 3:
      return `${n}rd`;
    default:
      return `${n}th`;
  }
}

function defaultMatchId(matches: ContestMatch[]) {
  const finished = [...matches]
    .filter((m) => m.status === 'FINISHED')
    .sort((a, b) => new Date(b.utcDate).getTime() - new Date(a.utcDate).getTime());
  if (finished[0]) return finished[0].id;
  const upcoming = [...matches].sort(
    (a, b) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime()
  );
  return upcoming.at(-1)?.id || matches[0]?.id || null;
}

function ranksFromFinished(
  members: ContestMember[],
  finished: ContestMatch[],
  predictions: Array<{ userId: string; matchId: string; home: number | null; away: number | null }>,
  scoring: ContestScoring
) {
  const totals = new Map(
    members.map((m) => [
      m.userId,
      { points: 0, exact: 0, close: 0, result: 0, name: m.displayName },
    ])
  );

  for (const match of finished) {
    if (match.homeScore == null || match.awayScore == null) continue;
    for (const pred of predictions) {
      if (pred.matchId !== match.id || pred.home == null || pred.away == null) continue;
      const row = totals.get(pred.userId);
      if (!row) continue;
      const outcome = calculatePoints(
        pred.home,
        pred.away,
        match.homeScore,
        match.awayScore,
        scoring
      );
      row.points += outcome.points;
      if (outcome.isExact) row.exact += 1;
      else if (outcome.isClose) row.close += 1;
      else if (outcome.isCorrect) row.result += 1;
    }
  }

  return [...totals.entries()]
    .sort((a, b) => {
      if (b[1].points !== a[1].points) return b[1].points - a[1].points;
      if (b[1].exact !== a[1].exact) return b[1].exact - a[1].exact;
      if (b[1].close !== a[1].close) return b[1].close - a[1].close;
      return a[1].name.localeCompare(b[1].name);
    })
    .reduce((map, [userId], index) => {
      map.set(userId, index + 1);
      return map;
    }, new Map<string, number>());
}

function buildPicksForMatch(
  match: ContestMatch,
  members: ContestMember[],
  predictions: Array<{ userId: string; matchId: string; home: number | null; away: number | null }>,
  scoring: ContestScoring,
  revealable: boolean
): PickRow[] {
  if (!revealable) return [];

  const finishedOrLive = ['FINISHED', 'IN_PLAY', 'PAUSED', 'AWARDED'].includes(match.status);
  const hasScore = match.homeScore != null && match.awayScore != null;

  return members
    .map((member) => {
      const pred = predictions.find(
        (row) => row.matchId === match.id && row.userId === member.userId
      );
      const hasPick = pred?.home != null && pred?.away != null;
      let points: number | null = null;
      let outcome: PickRow['outcome'] = 'zero';

      if (hasPick && finishedOrLive && hasScore) {
        const result = calculatePoints(
          pred!.home!,
          pred!.away!,
          match.homeScore!,
          match.awayScore!,
          scoring
        );
        points = result.points;
        outcome = result.isExact
          ? 'exact'
          : result.isClose
            ? 'close'
            : result.isCorrect
              ? 'result'
              : 'zero';
      }

      return {
        userId: member.userId,
        name: member.displayName,
        avatarUrl: member.avatarUrl,
        prediction: hasPick ? `${pred!.home} : ${pred!.away}` : '—',
        points: hasPick ? points : null,
        outcome,
      };
    })
    .sort((a, b) => {
      const ap = a.points ?? -1;
      const bp = b.points ?? -1;
      if (bp !== ap) return bp - ap;
      return a.name.localeCompare(b.name);
    });
}

export default function ContestRankingScreen() {
  const theme = useTheme();
  const t = useTranslations();
  const bottomPad = useBottomTabPadding();
  const { data, refresh, loading } = useContest();

  const initialId = useMemo(
    () => (data ? defaultMatchId(data.matches) : null),
    // freeze once data first loads
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [Boolean(data)]
  );

  const [focusedMatchId, setFocusedMatchId] = useState<string | null>(null);
  const [selectedMatchday, setSelectedMatchday] = useState<number | null>(null);

  useEffect(() => {
    if (!data || !initialId) return;
    const match = data.matches.find((m) => m.id === initialId);
    setFocusedMatchId(initialId);
    setSelectedMatchday(match?.matchday ?? data.activeMatchday);
  }, [data, initialId]);

  const gwMatches = useMemo(() => {
    if (!data || selectedMatchday == null) return [] as ContestMatch[];
    return data.matches
      .filter((m) => m.matchday === selectedMatchday)
      .sort((a, b) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime());
  }, [data, selectedMatchday]);

  useEffect(() => {
    if (!gwMatches.length) return;
    if (focusedMatchId && gwMatches.some((m) => m.id === focusedMatchId)) return;
    setFocusedMatchId(gwMatches[gwMatches.length - 1]?.id ?? null);
  }, [gwMatches, focusedMatchId]);

  const focusedMatch = gwMatches.find((m) => m.id === focusedMatchId) || null;
  const focusedIndex = focusedMatch
    ? gwMatches.findIndex((m) => m.id === focusedMatch.id)
    : -1;

  const canReveal = focusedMatch
    ? Date.now() >= new Date(focusedMatch.utcDate).getTime() - PREDICTION_REVEAL_MS
    : false;

  const showScore = Boolean(
    focusedMatch &&
      (['IN_PLAY', 'PAUSED'].includes(focusedMatch.status) ||
        focusedMatch.status === 'FINISHED' ||
        focusedMatch.status === 'AWARDED') &&
      (focusedMatch.status === 'FINISHED' ||
        focusedMatch.status === 'AWARDED' ||
        canReveal)
  );

  const picks = useMemo(() => {
    if (!data || !focusedMatch) return [] as PickRow[];
    return buildPicksForMatch(
      focusedMatch,
      data.members,
      data.predictions,
      data.contest.scoring,
      canReveal
    );
  }, [data, focusedMatch, canReveal]);

  const movement = useMemo(() => {
    if (!data) return { previous: new Map<string, number>(), current: new Map<string, number>() };
    const finished = data.matches
      .filter(
        (m) =>
          (m.status === 'FINISHED' || m.status === 'AWARDED') &&
          m.homeScore != null &&
          m.awayScore != null
      )
      .sort((a, b) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime());
    const previous = ranksFromFinished(
      data.members,
      finished.slice(0, -1),
      data.predictions,
      data.contest.scoring
    );
    const current = ranksFromFinished(
      data.members,
      finished,
      data.predictions,
      data.contest.scoring
    );
    return { previous, current };
  }, [data]);

  if (!data) {
    return (
      <View style={styles.center}>
        {loading ? <ActivityIndicator color={theme.accent} /> : null}
      </View>
    );
  }

  const scoring = data.contest.scoring;
  const inPlay = focusedMatch
    ? ['IN_PLAY', 'PAUSED'].includes(focusedMatch.status)
    : false;

  return (
    <ScrollView
      contentContainerStyle={[styles.content, { paddingBottom: bottomPad }]}
      nestedScrollEnabled
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={loading}
          onRefresh={() => void refresh()}
          tintColor={theme.accent}
        />
      }>
      {/* Current gameweek panel */}
      <View
        style={[
          styles.panel,
          {
            backgroundColor: theme.backgroundElement,
            borderColor: theme.isDark ? 'rgba(255,138,43,0.35)' : theme.border,
          },
        ]}>
        <View style={styles.gwHeader}>
          <Text style={[styles.gwTitle, { color: theme.textSecondary }]}>
            GW {selectedMatchday ?? '—'} · {t('Predictions')}
          </Text>
          {focusedIndex >= 0 ? (
            <Text style={[styles.gwCount, { color: theme.textSecondary }]}>
              {focusedIndex + 1} / {gwMatches.length}
            </Text>
          ) : null}
        </View>

        {gwMatches.length > 1 ? (
          <GlassChipStrip
            items={gwMatches.map((match) => ({
              key: match.id,
              label: `${teamTla({ name: match.homeTeam, tla: match.homeTla })} – ${teamTla({ name: match.awayTeam, tla: match.awayTla })}`,
              leadingUri: match.homeCrest,
              trailingUri: match.awayCrest,
            }))}
            value={focusedMatchId || gwMatches[0]?.id || ''}
            onChange={setFocusedMatchId}
          />
        ) : null}

        {focusedMatch ? (
          <View
            style={[
              styles.matchCard,
              {
                backgroundColor: theme.isDark
                  ? 'rgba(0,0,0,0.35)'
                  : 'rgba(16,185,129,0.10)',
                borderColor: theme.isDark ? theme.border : 'transparent',
              },
            ]}>
            <View style={styles.matchGrid}>
              <TeamCol
                crest={focusedMatch.homeCrest}
                name={focusedMatch.homeTeam}
                theme={theme}
              />
              <View style={styles.scoreCol}>
                <View style={styles.scoreLine}>
                  {inPlay ? <View style={styles.liveDot} /> : null}
                  <Text style={[styles.scoreText, { color: theme.accent }]}>
                    {showScore &&
                    focusedMatch.homeScore != null &&
                    focusedMatch.awayScore != null
                      ? `${focusedMatch.homeScore} : ${focusedMatch.awayScore}`
                      : '— : —'}
                  </Text>
                </View>
                {showScore &&
                (focusedMatch.status === 'FINISHED' || focusedMatch.status === 'AWARDED') &&
                !inPlay ? (
                  <Text style={[styles.ft, { color: theme.textSecondary }]}>FT</Text>
                ) : null}
              </View>
              <TeamCol
                crest={focusedMatch.awayCrest}
                name={focusedMatch.awayTeam}
                theme={theme}
              />
            </View>
          </View>
        ) : (
          <Text style={{ color: theme.textSecondary, fontSize: 13 }}>
            {t('No fixtures available for this gameweek.')}
          </Text>
        )}

        <View style={[styles.picksBlock, { borderTopColor: theme.border }]}>
          {canReveal && picks.length ? (
            picks.map((player, index) => (
              <PickListRow
                key={player.userId}
                rank={ordinal(index + 1)}
                player={player}
                theme={theme}
              />
            ))
          ) : (
            <Text style={[styles.hiddenCopy, { color: theme.textSecondary }]}>
              {t('Predictions and points are hidden until 30 minutes before kickoff.')}
            </Text>
          )}
        </View>
      </View>

      {/* Leaderboard */}
      <View style={styles.lbHead}>
        <Text style={[styles.lbTitle, { color: theme.text }]}>
          {t('Contest Leaderboard')}
        </Text>
        <View style={styles.legend}>
          <LegendItem
            icon="locate"
            color={theme.accent}
            label={`${scoring.exact}pts`}
          />
          <LegendItem icon="pulse" color="#38bdf8" label={`${scoring.close}pts`} />
          <LegendItem
            icon="checkmark-circle"
            color="#34d399"
            label={`${scoring.result}pts`}
          />
        </View>
      </View>

      <View
        style={[
          styles.lbList,
          { backgroundColor: theme.backgroundElement, borderColor: theme.border },
        ]}>
        {data.ranking.length === 0 ? (
          <Text style={[styles.empty, { color: theme.textSecondary }]}>
            {t('No players found in this contest.')}
          </Text>
        ) : (
          data.ranking.map((row, index) => (
            <LeaderboardRow
              key={row.userId}
              row={row}
              index={index}
              isMe={row.userId === data.userId}
              previousRank={movement.previous.get(row.userId) ?? null}
              movementRank={movement.current.get(row.userId) ?? row.rank}
              theme={theme}
              t={t}
            />
          ))
        )}
      </View>
    </ScrollView>
  );
}

function TeamCol({
  crest,
  name,
  theme,
}: {
  crest: string | null;
  name: string;
  theme: ReturnType<typeof useTheme>;
}) {
  return (
    <View style={styles.teamCol}>
      <View style={styles.crestLgWrap}>
        {crest ? (
          <Image source={{ uri: crest }} style={styles.crestLg} />
        ) : (
          <Text style={{ fontSize: 10, fontWeight: '800', color: '#64748b' }}>
            {name.slice(0, 3).toUpperCase()}
          </Text>
        )}
      </View>
      <Text numberOfLines={2} style={[styles.teamName, { color: theme.text }]}>
        {name}
      </Text>
    </View>
  );
}

function PickListRow({
  rank,
  player,
  theme,
}: {
  rank: string;
  player: PickRow;
  theme: ReturnType<typeof useTheme>;
}) {
  const pill =
    player.outcome === 'exact'
      ? { bg: 'rgba(251,191,36,0.18)', color: '#f59e0b', icon: 'locate' as const }
      : player.outcome === 'zero'
        ? { bg: 'rgba(248,113,113,0.18)', color: '#f87171', icon: 'close' as const }
        : { bg: 'rgba(52,211,153,0.18)', color: '#34d399', icon: 'checkmark' as const };

  return (
    <View
      style={[
        styles.pickRow,
        {
          backgroundColor: theme.isDark ? 'rgba(0,0,0,0.25)' : '#ffffff',
          borderColor: theme.border,
        },
      ]}>
      <Text style={[styles.pickRank, { color: theme.accent }]}>{rank}</Text>
      {player.avatarUrl ? (
        <UserAvatar uri={player.avatarUrl} size={24} />
      ) : (
        <View style={[styles.avatarFallback, { backgroundColor: `${theme.accent}22` }]}>
          <Ionicons name="person" size={12} color={theme.accent} />
        </View>
      )}
      <Text numberOfLines={1} style={[styles.pickName, { color: theme.text }]}>
        {player.name}
      </Text>
      <View
        style={[
          styles.pickPill,
          {
            backgroundColor: theme.isDark ? 'rgba(255,255,255,0.06)' : '#f8fafc',
            borderColor: theme.border,
          },
        ]}>
        <Text style={[styles.pickScore, { color: theme.text }]}>{player.prediction}</Text>
      </View>
      <View style={[styles.pointsPill, { backgroundColor: pill.bg }]}>
        <Ionicons name={pill.icon} size={11} color={pill.color} />
        <Text style={[styles.pointsText, { color: pill.color }]}>
          {player.points == null ? '—' : `+${player.points}`}
        </Text>
      </View>
    </View>
  );
}

function LegendItem({
  icon,
  color,
  label,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  label: string;
}) {
  return (
    <View style={styles.legendItem}>
      <Ionicons name={icon} size={12} color={color} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

function RankMovement({
  current,
  previous,
}: {
  current: number;
  previous: number | null;
}) {
  if (previous == null || previous === current) {
    return <View style={styles.rankDot} />;
  }
  if (current < previous) {
    return <Ionicons name="arrow-up" size={14} color="#34d399" />;
  }
  return <Ionicons name="arrow-down" size={14} color="#f87171" />;
}

function LeaderboardRow({
  row,
  index,
  isMe,
  previousRank,
  movementRank,
  theme,
  t,
}: {
  row: ContestRankingRow;
  index: number;
  isMe: boolean;
  previousRank: number | null;
  movementRank: number;
  theme: ReturnType<typeof useTheme>;
  t: (key: string) => string;
}) {
  return (
    <View
      style={[
        styles.lbRow,
        {
          borderBottomColor: theme.border,
          backgroundColor: isMe
            ? `${theme.accent}14`
            : index % 2 === 1
              ? theme.isDark
                ? 'rgba(255,255,255,0.02)'
                : 'rgba(248,250,252,0.9)'
              : 'transparent',
        },
      ]}>
      <Text style={[styles.lbRank, { color: theme.textSecondary }]}>{row.rank}.</Text>
      {row.avatarUrl ? (
        <UserAvatar uri={row.avatarUrl} size={20} />
      ) : (
        <View style={[styles.lbAvatarFallback, { borderColor: theme.border }]}>
          <Text style={{ color: theme.textSecondary, fontSize: 9, fontWeight: '800' }}>
            {row.displayName.slice(0, 1).toUpperCase()}
          </Text>
        </View>
      )}
      <Text numberOfLines={1} style={[styles.lbName, { color: theme.text }]}>
        {row.displayName}
      </Text>
      <RankMovement current={movementRank} previous={previousRank} />
      <View style={styles.lbChips}>
        <Chip icon="locate" color={theme.accent} value={row.exact} label={t('Exact Score')} />
        <Chip icon="pulse" color="#38bdf8" value={row.close} label={t('Close Prediction')} />
        <Chip
          icon="checkmark-circle"
          color="#34d399"
          value={row.result}
          label={t('Correct Result')}
        />
      </View>
      <Text style={[styles.lbPts, { color: theme.accent }]}>
        {row.totalPoints} {t('pts')}
      </Text>
    </View>
  );
}

function Chip({
  icon,
  color,
  value,
  label,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  value: number;
  label: string;
}) {
  return (
    <View style={styles.chipStat} accessibilityLabel={`${label}: ${value}`}>
      <Ionicons name={icon} size={11} color={color} />
      <Text style={styles.chipStatVal}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: {
    padding: Spacing.three,
    gap: 16,
  },
  panel: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 12,
    gap: 12,
  },
  gwHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  gwTitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  gwCount: { fontSize: 11, fontWeight: '700', fontVariant: ['tabular-nums'] },
  matchCard: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  matchGrid: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  teamCol: { flex: 1, alignItems: 'center', gap: 6, minWidth: 0 },
  crestLgWrap: {
    width: 44,
    height: 44,
    borderRadius: 999,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 1 },
  },
  crestLg: { width: 30, height: 30 },
  teamName: {
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 15,
  },
  scoreCol: { alignItems: 'center', paddingTop: 4, minWidth: 72 },
  scoreLine: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 999,
    backgroundColor: '#34d399',
  },
  scoreText: { fontSize: 18, fontWeight: '800', fontVariant: ['tabular-nums'] },
  ft: {
    marginTop: 2,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  picksBlock: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 10,
    gap: 8,
  },
  hiddenCopy: { fontSize: 13, lineHeight: 18, textAlign: 'center', paddingVertical: 8 },
  pickRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  pickRank: { width: 28, fontSize: 11, fontWeight: '800', fontVariant: ['tabular-nums'] },
  avatar: { width: 24, height: 24, borderRadius: 999 },
  avatarFallback: {
    width: 24,
    height: 24,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickName: { flex: 1, minWidth: 0, fontSize: 13, fontWeight: '600' },
  pickPill: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  pickScore: { fontSize: 12, fontWeight: '800', fontVariant: ['tabular-nums'] },
  pointsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  pointsText: { fontSize: 11, fontWeight: '800', fontVariant: ['tabular-nums'] },
  lbHead: { gap: 8 },
  lbTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendText: { fontSize: 10, fontWeight: '700', color: '#71717a' },
  lbList: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  empty: { padding: 20, textAlign: 'center', fontSize: 13 },
  lbRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 44,
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  lbRank: { width: 22, fontSize: 13, fontWeight: '700', fontVariant: ['tabular-nums'] },
  lbAvatar: { width: 20, height: 20, borderRadius: 999 },
  lbAvatarFallback: {
    width: 20,
    height: 20,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lbName: { flex: 1, minWidth: 0, fontSize: 13, fontWeight: '600' },
  rankDot: {
    width: 6,
    height: 6,
    borderRadius: 999,
    backgroundColor: '#71717a',
  },
  lbChips: { flexDirection: 'row', alignItems: 'center' },
  chipStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 2,
  },
  chipStatVal: {
    minWidth: 10,
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
    fontVariant: ['tabular-nums'],
  },
  lbPts: {
    minWidth: 48,
    textAlign: 'right',
    fontSize: 13,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
});
