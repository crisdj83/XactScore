import type { ReactNode } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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
  const howToSteps = [
    t('Open Predictions to see upcoming Premier League fixtures.'),
    t('Use + and − to set the home and away score.'),
    t('Your picks save as you change them.'),
    t('Picks lock 60 minutes before kickoff. After lock, the pick is final.'),
    t('Other players’ picks reveal 30 minutes before kickoff.'),
  ];

  const scoringTiers = [
    {
      icon: 'locate' as const,
      color: theme.accent,
      title: t('Exact Score'),
      points: scoring.exact,
      body: t('You correctly predict the exact final score of the match.'),
      example: `${t('Predicted')} 2 - 1\n${t('Actual')} 2 - 1`,
    },
    {
      icon: 'pulse' as const,
      color: '#38bdf8',
      title: t('Close Prediction'),
      points: scoring.close,
      body: t(
        'You predict the right outcome (Win/Draw/Loss), AND total goals scored is off by no more than 1.',
      ),
      example: `${t('Predicted')} 1 - 0 (${t('Total')}: 1)\n${t('Actual')} 2 - 0 (${t('Total')}: 2)`,
    },
    {
      icon: 'checkmark-circle' as const,
      color: '#94a3b8',
      title: t('Correct Result'),
      points: scoring.result,
      body: t('You predict the right outcome (Win/Draw/Loss), but total goals are not close.'),
      example: `${t('Predicted')} 1 - 0 (${t('Total')}: 1)\n${t('Actual')} 4 - 0 (${t('Total')}: 4)`,
    },
    {
      icon: 'close-circle' as const,
      color: theme.danger,
      title: t('Wrong'),
      points: 0,
      body: t('Wrong outcome — no points for that match.'),
      example: null,
    },
  ];

  const tiebreakers = [
    `${t('Highest number of Exact Scores')} (+${scoring.exact} ${t('pts')})`,
    `${t('Highest number of Close Predictions')} (+${scoring.close} ${t('pts')})`,
    t('Highest overall prediction accuracy percentage'),
    t('Alphabetical name if still tied'),
  ];

  return (
    <ScrollView
      contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 24 }]}
      refreshControl={
        <RefreshControl
          refreshing={loading}
          onRefresh={() => void refresh()}
          tintColor={theme.accent}
        />
      }
      showsVerticalScrollIndicator={false}>
      <Text style={[styles.pageTitle, { color: theme.text }]}>{t('Contest Rules & Scoring')}</Text>
      <Text style={[styles.pageSubtitle, { color: theme.textSecondary }]}>
        {t('Everything you need to know to dominate the leaderboard.')}
      </Text>

      <SectionCard
        theme={theme}
        icon="information-circle"
        title={t('How to play')}>
        {howToSteps.map((step) => (
          <View key={step} style={styles.bulletRow}>
            <View style={[styles.bulletDot, { backgroundColor: theme.accent }]} />
            <Text style={[styles.body, { color: theme.textSecondary, flex: 1 }]}>{step}</Text>
          </View>
        ))}
      </SectionCard>

      <SectionCard
        theme={theme}
        icon="trophy"
        title={t('Tiered Scoring System')}>
        <Text style={[styles.body, { color: theme.textSecondary, marginBottom: 10 }]}>
          {t(
            'Points are awarded after the final whistle based on how accurate your prediction was compared to the real-world result.',
          )}
        </Text>
        {scoringTiers.map((tier) => (
          <View
            key={tier.title}
            style={[
              styles.tierCard,
              { backgroundColor: theme.background, borderColor: theme.border },
            ]}>
            <View style={styles.tierHeader}>
              <View style={[styles.tierIcon, { backgroundColor: `${tier.color}22` }]}>
                <Ionicons name={tier.icon} size={18} color={tier.color} />
              </View>
              <Text style={[styles.tierTitle, { color: theme.text, flex: 1 }]}>{tier.title}</Text>
              <Text style={[styles.tierPoints, { color: theme.accent }]}>
                +{tier.points} {t('pts')}
              </Text>
            </View>
            <Text style={[styles.body, { color: theme.textSecondary }]}>{tier.body}</Text>
            {tier.example ? (
              <View
                style={[
                  styles.exampleBox,
                  { backgroundColor: theme.backgroundElement, borderColor: theme.border },
                ]}>
                <Text style={[styles.exampleLabel, { color: theme.text }]}>{t('Example')}</Text>
                <Text style={[styles.exampleBody, { color: theme.textSecondary }]}>
                  {tier.example}
                </Text>
              </View>
            ) : null}
          </View>
        ))}
      </SectionCard>

      <SectionCard
        theme={theme}
        icon="swap-vertical"
        title={t('Leaderboard Tiebreakers')}>
        <Text style={[styles.body, { color: theme.textSecondary, marginBottom: 10 }]}>
          {t(
            'If two or more players have the exact same Total Points, the leaderboard will rank them based on:',
          )}
        </Text>
        {tiebreakers.map((item, index) => (
          <View key={item} style={styles.bulletRow}>
            <Text style={[styles.ordinal, { color: theme.accent }]}>{index + 1}.</Text>
            <Text style={[styles.body, { color: theme.text, flex: 1, fontWeight: '600' }]}>
              {item}
            </Text>
          </View>
        ))}
      </SectionCard>
    </ScrollView>
  );
}

function SectionCard({
  theme,
  icon,
  title,
  children,
}: {
  theme: ReturnType<typeof useTheme>;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  children: ReactNode;
}) {
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.backgroundElement, borderColor: theme.border },
      ]}>
      <View style={styles.cardHeader}>
        <View style={[styles.cardIcon, { backgroundColor: theme.accentMuted }]}>
          <Ionicons name={icon} size={18} color={theme.accent} />
        </View>
        <Text style={[styles.heading, { color: theme.text }]}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: {
    padding: Spacing.three,
    gap: 14,
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  pageSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: -6,
    marginBottom: 2,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: Spacing.three,
    gap: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 2,
  },
  cardIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heading: {
    flex: 1,
    fontSize: 15,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  body: { fontSize: 14, lineHeight: 20 },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 7,
  },
  ordinal: {
    fontSize: 14,
    fontWeight: '800',
    minWidth: 18,
    marginTop: 1,
  },
  tierCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    gap: 8,
  },
  tierHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  tierIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tierTitle: {
    fontSize: 14,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  tierPoints: {
    fontSize: 13,
    fontWeight: '800',
  },
  exampleBox: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
    gap: 4,
  },
  exampleLabel: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  exampleBody: {
    fontSize: 13,
    lineHeight: 18,
  },
});
