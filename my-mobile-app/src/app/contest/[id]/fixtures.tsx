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

export default function ContestFixturesScreen() {
  const theme = useTheme();
  const t = useTranslations();
  const { data, refresh, loading } = useContest();
  const [selectedMd, setSelectedMd] = useState<number | null>(null);

  const matchdays = data?.matchdays || [];
  const activeMd = selectedMd ?? data?.activeMatchday ?? matchdays[0] ?? 1;
  const mdMatches = useMemo(
    () =>
      (data?.matches || [])
        .filter((match) => match.matchday === activeMd)
        .sort((a, b) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime()),
    [data?.matches, activeMd]
  );

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
      <Text style={[styles.heading, { color: theme.text }]}>{t('Fixtures')}</Text>

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

      <View style={styles.list}>
        {mdMatches.map((match) => (
          <View
            key={match.id}
            style={[
              styles.row,
              { backgroundColor: theme.backgroundElement, borderColor: theme.border },
            ]}>
            <Text style={[styles.when, { color: theme.textSecondary }]}>
              {new Date(match.utcDate).toLocaleString(undefined, {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
            <View style={styles.teams}>
              <View style={styles.team}>
                {match.homeCrest ? (
                  <Image source={{ uri: match.homeCrest }} style={styles.crest} />
                ) : null}
                <Text numberOfLines={1} style={[styles.teamName, { color: theme.text }]}>
                  {match.homeTeam}
                </Text>
              </View>
              <Text style={[styles.score, { color: theme.text }]}>
                {match.homeScore != null && match.awayScore != null
                  ? `${match.homeScore} - ${match.awayScore}`
                  : 'vs'}
              </Text>
              <View style={[styles.team, styles.teamRight]}>
                <Text
                  numberOfLines={1}
                  style={[styles.teamName, styles.teamNameRight, { color: theme.text }]}>
                  {match.awayTeam}
                </Text>
                {match.awayCrest ? (
                  <Image source={{ uri: match.awayCrest }} style={styles.crest} />
                ) : null}
              </View>
            </View>
            {match.venue ? (
              <Text style={[styles.venue, { color: theme.textSecondary }]}>{match.venue}</Text>
            ) : null}
          </View>
        ))}
      </View>

      <Text style={[styles.heading, { color: theme.text, marginTop: 8 }]}>
        {t('Premier League table')}
      </Text>
      <View
        style={[
          styles.table,
          { backgroundColor: theme.backgroundElement, borderColor: theme.border },
        ]}>
        {(data.standings || []).slice(0, 20).map((row) => (
          <View
            key={`${row.position}-${row.team}`}
            style={[styles.tableRow, { borderBottomColor: theme.border }]}>
            <Text style={[styles.pos, { color: theme.text }]}>{row.position}</Text>
            {row.crest ? <Image source={{ uri: row.crest }} style={styles.crest} /> : null}
            <Text numberOfLines={1} style={[styles.teamCell, { color: theme.text }]}>
              {row.team}
            </Text>
            <Text style={[styles.stat, { color: theme.textSecondary }]}>{row.played}</Text>
            <Text style={[styles.stat, { color: theme.accent, fontWeight: '800' }]}>
              {row.points}
            </Text>
          </View>
        ))}
        {(data.standings || []).length === 0 ? (
          <Text style={{ color: theme.textSecondary, padding: 12 }}>
            {t('Standings unavailable right now.')}
          </Text>
        ) : null}
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
  heading: { fontSize: 16, fontWeight: '800', textTransform: 'uppercase' },
  mdStrip: { gap: 8 },
  mdChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  list: { gap: 8 },
  row: { borderRadius: 14, borderWidth: 1, padding: 12, gap: 8 },
  when: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  teams: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  team: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  teamRight: { justifyContent: 'flex-end' },
  teamName: { flex: 1, fontSize: 13, fontWeight: '700' },
  teamNameRight: { textAlign: 'right' },
  crest: { width: 18, height: 18 },
  score: { fontSize: 13, fontWeight: '800', minWidth: 48, textAlign: 'center' },
  venue: { fontSize: 12 },
  table: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  pos: { width: 22, fontWeight: '800', fontSize: 13 },
  teamCell: { flex: 1, fontSize: 13, fontWeight: '600' },
  stat: { width: 28, textAlign: 'right', fontSize: 12, fontWeight: '700' },
});
