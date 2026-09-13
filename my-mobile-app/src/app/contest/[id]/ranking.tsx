import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useContest } from '@/contexts/contest';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { useTranslations } from '@/contexts/locale';
import { useTheme } from '@/hooks/use-theme';

export default function ContestRankingScreen() {
  const theme = useTheme();
  const t = useTranslations();
  const { data, refresh, loading } = useContest();
  const [expandedMatchId, setExpandedMatchId] = useState<string | null>(null);

  const activeMd = data?.activeMatchday || 1;
  const gwMatches = useMemo(
    () => (data?.matches || []).filter((match) => match.matchday === activeMd),
    [data?.matches, activeMd]
  );

  const memberName = useMemo(() => {
    const map = new Map<string, string>();
    for (const member of data?.members || []) {
      map.set(member.userId, member.displayName);
    }
    return map;
  }, [data?.members]);

  if (!data) {
    return (
      <View style={styles.center}>
        {loading ? <ActivityIndicator color={theme.accent} /> : null}
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={loading}
          onRefresh={() => void refresh()}
          tintColor={theme.accent}
        />
      }>
      <Text style={[styles.heading, { color: theme.text }]}>
        {t('Current gameweek')} · MD {activeMd}
      </Text>

      <View style={styles.gwList}>
        {gwMatches.map((match) => {
          const expanded = expandedMatchId === match.id;
          const showPicks = match.revealable || match.locked;
          const picks = (data.predictions || []).filter((row) => row.matchId === match.id);
          return (
            <View
              key={match.id}
              style={[
                styles.matchCard,
                { backgroundColor: theme.backgroundElement, borderColor: theme.border },
              ]}>
              <Pressable
                onPress={() => setExpandedMatchId(expanded ? null : match.id)}
                style={styles.matchHeader}>
                <View style={styles.matchTeams}>
                  {match.homeCrest ? (
                    <Image source={{ uri: match.homeCrest }} style={styles.crest} />
                  ) : null}
                  <Text numberOfLines={1} style={[styles.team, { color: theme.text }]}>
                    {match.homeTeam}
                  </Text>
                  <Text style={{ color: theme.accent, fontWeight: '800' }}>
                    {match.homeScore != null && match.awayScore != null
                      ? `${match.homeScore}-${match.awayScore}`
                      : 'vs'}
                  </Text>
                  <Text
                    numberOfLines={1}
                    style={[styles.team, styles.teamRight, { color: theme.text }]}>
                    {match.awayTeam}
                  </Text>
                  {match.awayCrest ? (
                    <Image source={{ uri: match.awayCrest }} style={styles.crest} />
                  ) : null}
                </View>
                <Text style={{ color: theme.textSecondary, fontSize: 11, fontWeight: '700' }}>
                  {showPicks ? (expanded ? '▲' : '▼') : t('Hidden')}
                </Text>
              </Pressable>

              {expanded && showPicks ? (
                <View style={[styles.picks, { borderTopColor: theme.border }]}>
                  {picks.length === 0 ? (
                    <Text style={{ color: theme.textSecondary, fontSize: 13 }}>
                      {t('No predictions yet.')}
                    </Text>
                  ) : (
                    picks.map((pick) => (
                      <View key={`${pick.userId}-${pick.matchId}`} style={styles.pickRow}>
                        <Text numberOfLines={1} style={[styles.pickName, { color: theme.text }]}>
                          {memberName.get(pick.userId) || '—'}
                        </Text>
                        <Text style={[styles.pickScore, { color: theme.text }]}>
                          {pick.home ?? '—'} : {pick.away ?? '—'}
                        </Text>
                      </View>
                    ))
                  )}
                </View>
              ) : null}
              {expanded && !showPicks ? (
                <View style={[styles.picks, { borderTopColor: theme.border }]}>
                  <Text style={{ color: theme.textSecondary, fontSize: 13 }}>
                    {t('Picks reveal 30 minutes before kickoff.')}
                  </Text>
                </View>
              ) : null}
            </View>
          );
        })}
      </View>

      <Text style={[styles.heading, { color: theme.text, marginTop: 8 }]}>
        {t('Contest Leaderboard')}
      </Text>

      <View
        style={[
          styles.table,
          { backgroundColor: theme.backgroundElement, borderColor: theme.border },
        ]}>
        <View style={[styles.tableHead, { borderBottomColor: theme.border }]}>
          <Text style={[styles.colRank, styles.headText, { color: theme.textSecondary }]}>#</Text>
          <Text style={[styles.colName, styles.headText, { color: theme.textSecondary }]}>
            {t('Player')}
          </Text>
          <Text style={[styles.colPts, styles.headText, { color: theme.textSecondary }]}>
            {t('Pts')}
          </Text>
          <Text style={[styles.colStat, styles.headText, { color: theme.textSecondary }]}>E</Text>
          <Text style={[styles.colStat, styles.headText, { color: theme.textSecondary }]}>C</Text>
          <Text style={[styles.colStat, styles.headText, { color: theme.textSecondary }]}>R</Text>
        </View>
        {data.ranking.map((row) => {
          const isMe = row.userId === data.userId;
          return (
            <View
              key={row.userId}
              style={[
                styles.tableRow,
                {
                  borderBottomColor: theme.border,
                  backgroundColor: isMe ? `${theme.accent}18` : 'transparent',
                },
              ]}>
              <Text style={[styles.colRank, { color: theme.text, fontWeight: '800' }]}>
                {row.rank}
              </Text>
              <View style={styles.colName}>
                <Text numberOfLines={1} style={{ color: theme.text, fontWeight: '700' }}>
                  {row.displayName}
                </Text>
                {row.quote ? (
                  <Text numberOfLines={1} style={{ color: theme.textSecondary, fontSize: 11 }}>
                    {row.quote}
                  </Text>
                ) : null}
              </View>
              <Text style={[styles.colPts, { color: theme.accent, fontWeight: '800' }]}>
                {row.totalPoints}
              </Text>
              <Text style={[styles.colStat, { color: theme.text }]}>{row.exact}</Text>
              <Text style={[styles.colStat, { color: theme.text }]}>{row.close}</Text>
              <Text style={[styles.colStat, { color: theme.text }]}>{row.result}</Text>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: {
    padding: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.four,
    gap: 12,
  },
  heading: { fontSize: 16, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.4 },
  gwList: { gap: 8 },
  matchCard: { borderRadius: 14, borderWidth: 1, overflow: 'hidden' },
  matchHeader: { padding: 12, gap: 6 },
  matchTeams: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  crest: { width: 18, height: 18 },
  team: { flex: 1, fontSize: 12, fontWeight: '700' },
  teamRight: { textAlign: 'right' },
  picks: { borderTopWidth: StyleSheet.hairlineWidth, padding: 12, gap: 8 },
  pickRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  pickName: { flex: 1, fontSize: 13, fontWeight: '600' },
  pickScore: { fontSize: 13, fontWeight: '800', fontVariant: ['tabular-nums'] },
  table: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  tableHead: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  colRank: { width: 28, fontSize: 13 },
  colName: { flex: 1, minWidth: 0, paddingRight: 6 },
  colPts: { width: 40, textAlign: 'right', fontSize: 13 },
  colStat: { width: 28, textAlign: 'right', fontSize: 12 },
});
