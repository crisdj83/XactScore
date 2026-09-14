import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useContest } from '@/contexts/contest';
import { Spacing } from '@/constants/theme';
import { useTranslations } from '@/contexts/locale';
import { useTheme } from '@/hooks/use-theme';
import { useBottomTabPadding } from '@/hooks/use-bottom-tab-padding';

export default function ContestRulesScreen() {
  const theme = useTheme();
  const t = useTranslations();
  const bottomPad = useBottomTabPadding();
  const { data, refresh, loading } = useContest();

  if (!data) {
    return (
      <View style={styles.center}>
        {loading ? <ActivityIndicator color={theme.accent} /> : null}
      </View>
    );
  }

  const { scoring } = data.contest;

  return (
    <ScrollView
      contentContainerStyle={[styles.content, { paddingBottom: bottomPad }]}
      refreshControl={
        <RefreshControl
          refreshing={loading}
          onRefresh={() => void refresh()}
          tintColor={theme.accent}
        />
      }>
      <Text style={[styles.heading, { color: theme.text }]}>{t('How to play')}</Text>
      <Text style={[styles.body, { color: theme.textSecondary }]}>
        {t(
          'Predict the exact score of every Premier League match in your contest season. Picks lock 60 minutes before kickoff. Other players’ picks reveal 30 minutes before kickoff.'
        )}
      </Text>

      <Text style={[styles.heading, { color: theme.text }]}>{t('Scoring')}</Text>
      <View style={[styles.card, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
        <RuleRow label={t('Exact score')} value={`${scoring.exact} ${t('pts')}`} theme={theme} />
        <RuleRow label={t('Close (correct result, ±1 goals)')} value={`${scoring.close} ${t('pts')}`} theme={theme} />
        <RuleRow label={t('Correct result only')} value={`${scoring.result} ${t('pts')}`} theme={theme} />
        <RuleRow label={t('Wrong')} value={`0 ${t('pts')}`} theme={theme} last />
      </View>

      <Text style={[styles.heading, { color: theme.text }]}>{t('Tiebreakers')}</Text>
      <Text style={[styles.body, { color: theme.textSecondary }]}>
        {t('Total points, then exact scores, then close scores, then alphabetical name.')}
      </Text>
    </ScrollView>
  );
}

function RuleRow({
  label,
  value,
  theme,
  last,
}: {
  label: string;
  value: string;
  theme: ReturnType<typeof useTheme>;
  last?: boolean;
}) {
  return (
    <View
      style={[
        styles.ruleRow,
        !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.border },
      ]}>
      <Text style={{ color: theme.text, flex: 1, fontWeight: '600' }}>{label}</Text>
      <Text style={{ color: theme.accent, fontWeight: '800' }}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: {
    padding: Spacing.three,
    gap: 12,
  },
  heading: { fontSize: 16, fontWeight: '800', textTransform: 'uppercase', marginTop: 4 },
  body: { fontSize: 14, lineHeight: 20 },
  card: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
});
