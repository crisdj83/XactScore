import { useEffect, useMemo, useState } from 'react';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { type Href, router } from 'expo-router';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { ScoreHeroArt } from '@/components/home/score-hero-art';
import type { HomeNextMatch, HomeScore } from '@/lib/home-api';
import { useTranslations } from '@/contexts/locale';
import { useTheme } from '@/hooks/use-theme';

const SCORE_VIEWPORT_H = 196;
const MARQUEE_MS = 28000;

type Props = {
  nextMatch: HomeNextMatch | null;
  recentScores: HomeScore[];
  predictPath: string;
  /** Stretch the card to fill leftover home viewport height. */
  fill?: boolean;
};

function compactClubName(name: string) {
  if (name.length <= 11) return name;
  return name
    .replace(/\s+Wanderers$/i, '')
    .replace(/\s+Hotspur$/i, '')
    .replace(/\s+(City|Town)$/i, '');
}

function CountdownUnit({
  label,
  value,
  accent,
  isDark,
  accentColor,
  mutedColor,
}: {
  label: string;
  value: string;
  accent?: boolean;
  isDark: boolean;
  accentColor: string;
  mutedColor: string;
}) {
  return (
    <View style={styles.unit}>
      <Text style={[styles.unitLabel, { color: mutedColor }]}>{label}</Text>
      <View
        style={[
          styles.unitBox,
          {
            borderColor: isDark
              ? accent
                ? accentColor
                : 'rgba(255,255,255,0.8)'
              : '#e2e8f0',
            backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : '#ffffff',
          },
        ]}>
        <Text
          style={[
            styles.unitValue,
            { color: isDark ? (accent ? accentColor : '#ffffff') : '#0f172a' },
          ]}>
          {value}
        </Text>
      </View>
    </View>
  );
}

function ScoreRow({
  match,
  isDark,
  textColor,
}: {
  match: HomeScore;
  isDark: boolean;
  textColor: string;
}) {
  return (
    <View
      style={[
        styles.scoreRow,
        {
          backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#ffffff',
          borderColor: isDark ? 'rgba(255,255,255,0.10)' : '#e2e8f0',
        },
      ]}>
      <Text style={[styles.status, { color: isDark ? '#12ff80' : '#64748b' }]}>{match.status}</Text>
      {match.homeCrest ? (
        <Image source={{ uri: match.homeCrest }} style={styles.smallCrest} contentFit="contain" />
      ) : (
        <View style={styles.smallCrest} />
      )}
      <Text numberOfLines={1} style={[styles.scoreTeam, { color: textColor }]}>
        {compactClubName(match.homeTeam)}
      </Text>
      <Text style={[styles.scoreline, { color: textColor }]}>
        {match.homeScore ?? '-'}–{match.awayScore ?? '-'}
      </Text>
      <Text numberOfLines={1} style={[styles.scoreTeam, styles.scoreTeamRight, { color: textColor }]}>
        {compactClubName(match.awayTeam)}
      </Text>
      {match.awayCrest ? (
        <Image source={{ uri: match.awayCrest }} style={styles.smallCrest} contentFit="contain" />
      ) : (
        <View style={styles.smallCrest} />
      )}
    </View>
  );
}

/** Website-style vertical marquee for recent PL scores. */
function ScoresMarquee({
  scores,
  isDark,
  textColor,
  surfaceColor,
  emptyLabel,
  expand,
}: {
  scores: HomeScore[];
  isDark: boolean;
  textColor: string;
  surfaceColor: string;
  emptyLabel: string;
  expand?: boolean;
}) {
  const translateY = useSharedValue(0);
  const [halfHeight, setHalfHeight] = useState(0);
  const loop = useMemo(() => [...scores, ...scores], [scores]);

  useEffect(() => {
    cancelAnimation(translateY);
    translateY.value = 0;
    if (halfHeight <= 0 || scores.length < 2) return;
    translateY.value = withRepeat(
      withTiming(-halfHeight, { duration: MARQUEE_MS, easing: Easing.linear }),
      -1,
      false,
    );
    return () => cancelAnimation(translateY);
  }, [halfHeight, scores.length, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const viewportStyle = [
    styles.scoresViewport,
    expand ? styles.scoresViewportExpand : null,
  ];

  if (!scores.length) {
    return (
      <View style={viewportStyle}>
        <Text style={{ color: isDark ? '#a1a1aa' : '#64748b', fontSize: 14 }}>{emptyLabel}</Text>
      </View>
    );
  }

  // Light: soft crossfade like the website. Dark: no overlay fades — keep the
  // card surface clean under the neon accent.
  const fadeTop = [surfaceColor, `${surfaceColor}99`, `${surfaceColor}00`] as const;
  const fadeBottom = [`${surfaceColor}00`, `${surfaceColor}99`, surfaceColor] as const;

  return (
    <View style={viewportStyle} pointerEvents="none">
      <Animated.View style={[styles.scoresTrack, animatedStyle]}>
        <View
          style={styles.scoresHalf}
          onLayout={(e) => {
            const h = e.nativeEvent.layout.height;
            // Include gap between the two halves so the loop seams cleanly.
            const next = h + 8;
            if (next > 0 && Math.abs(next - halfHeight) > 1) setHalfHeight(next);
          }}>
          {scores.map((match) => (
            <ScoreRow
              key={`a-${String(match.id)}`}
              match={match}
              isDark={isDark}
              textColor={textColor}
            />
          ))}
        </View>
        <View style={styles.scoresHalf}>
          {loop.slice(scores.length).map((match, idx) => (
            <ScoreRow
              key={`b-${String(match.id)}-${idx}`}
              match={match}
              isDark={isDark}
              textColor={textColor}
            />
          ))}
        </View>
      </Animated.View>
      {!isDark ? (
        <>
          <LinearGradient
            colors={[...fadeTop]}
            locations={[0, 0.55, 1]}
            style={styles.fadeTop}
            pointerEvents="none"
          />
          <LinearGradient
            colors={[...fadeBottom]}
            locations={[0, 0.45, 1]}
            style={styles.fadeBottom}
            pointerEvents="none"
          />
        </>
      ) : null}
    </View>
  );
}

export function HomeHeroBanner({ nextMatch, recentScores, predictPath, fill = false }: Props) {
  const theme = useTheme();
  const t = useTranslations();
  const { isDark } = theme;
  const [timeLeft, setTimeLeft] = useState({
    days: '00',
    hours: '00',
    minutes: '00',
    seconds: '00',
  });

  useEffect(() => {
    if (!nextMatch?.date) return;
    const countdownDate = new Date(nextMatch.date).getTime();

    const update = () => {
      const distance = countdownDate - Date.now();
      if (distance <= 0) {
        setTimeLeft({ days: '00', hours: '00', minutes: '00', seconds: '00' });
        return;
      }
      setTimeLeft({
        days: String(Math.floor(distance / (1000 * 60 * 60 * 24))).padStart(2, '0'),
        hours: String(Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))).padStart(
          2,
          '0'
        ),
        minutes: String(Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))).padStart(2, '0'),
        seconds: String(Math.floor((distance % (1000 * 60)) / 1000)).padStart(2, '0'),
      });
    };

    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [nextMatch?.date]);

  // Keep enough rows for a smooth loop (website uses the full recent list).
  const scores = useMemo(() => recentScores.slice(0, 12), [recentScores]);

  return (
    <View
      style={[
        styles.card,
        fill ? styles.cardFill : null,
        {
          backgroundColor: theme.backgroundElement,
          borderColor: theme.border,
        },
      ]}>
      <Text style={[styles.headline, { color: theme.text }]}>
        {t('Call the scores.')}{'\n'}
        <Text style={{ color: isDark ? theme.accent : theme.text }}>{t('Own the table.')}</Text>
      </Text>
      <Text style={[styles.subcopy, { color: theme.textSecondary }]}>
        {t('Call every Premier League score. Climb the table with your league.')}
      </Text>

      {!nextMatch ? <ScoreHeroArt /> : null}

      <Text style={[styles.upcomingLabel, { color: isDark ? theme.accent : '#71717a' }]}>
        {t('Upcoming Match')}
      </Text>

      {nextMatch ? (
        <View style={styles.matchBlock}>
          <View style={styles.teamRow}>
            {nextMatch.homeCrest ? (
              <Image source={{ uri: nextMatch.homeCrest }} style={styles.crest} contentFit="contain" />
            ) : null}
            <Text numberOfLines={1} style={[styles.teamName, { color: theme.text }]}>
              {nextMatch.homeTeam}
            </Text>
          </View>
          <Text style={[styles.vs, { color: isDark ? theme.accent : '#a1a1aa' }]}>vs</Text>
          <View style={styles.teamRow}>
            {nextMatch.awayCrest ? (
              <Image source={{ uri: nextMatch.awayCrest }} style={styles.crest} contentFit="contain" />
            ) : null}
            <Text numberOfLines={1} style={[styles.teamName, { color: theme.text }]}>
              {nextMatch.awayTeam}
            </Text>
          </View>
          {nextMatch.venue ? (
            <View style={styles.venueRow}>
              <Ionicons name="location-sharp" size={12} color={theme.textSecondary} />
              <Text numberOfLines={1} style={[styles.venue, { color: theme.textSecondary }]}>
                {nextMatch.venue}
              </Text>
            </View>
          ) : null}
        </View>
      ) : (
        <Text style={[styles.noFixtures, { color: theme.text }]}>
          {t('Season Ended / No Fixtures')}
        </Text>
      )}

      <View style={styles.countdownRow}>
        <CountdownUnit
          label={t('Days')}
          value={timeLeft.days}
          isDark={isDark}
          accentColor={theme.accent}
          mutedColor={isDark ? theme.accent : '#71717a'}
        />
        <Text style={[styles.colon, { color: theme.text }]}>:</Text>
        <CountdownUnit
          label={t('Hours')}
          value={timeLeft.hours}
          isDark={isDark}
          accentColor={theme.accent}
          mutedColor={isDark ? theme.accent : '#71717a'}
        />
        <Text style={[styles.colon, { color: theme.text }]}>:</Text>
        <CountdownUnit
          label={t('Mins')}
          value={timeLeft.minutes}
          isDark={isDark}
          accentColor={theme.accent}
          mutedColor={isDark ? theme.accent : '#71717a'}
        />
        <Text style={[styles.colon, { color: theme.text }]}>:</Text>
        <CountdownUnit
          label={t('Secs')}
          value={timeLeft.seconds}
          accent
          isDark={isDark}
          accentColor={theme.accent}
          mutedColor={isDark ? theme.accent : '#71717a'}
        />
      </View>

      <Pressable
        onPress={() => router.push(predictPath as Href)}
        style={({ pressed }) => [
          styles.predictBtn,
          {
            backgroundColor: theme.accent,
            transform: [{ scale: pressed ? 0.97 : 1 }],
          },
        ]}>
        <Text style={[styles.predictBtnText, { color: isDark ? '#0f0f10' : '#ffffff' }]}>
          {t('Make Predictions')}
        </Text>
      </Pressable>

      <ScoresMarquee
        scores={scores}
        isDark={isDark}
        textColor={theme.text}
        surfaceColor={theme.backgroundElement}
        emptyLabel={t('No recent matches to display.')}
        expand={fill}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 28,
    borderWidth: 1,
    padding: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
  },
  cardFill: {
    flex: 1,
    minHeight: 420,
  },
  headline: {
    fontSize: 22,
    lineHeight: 26,
    fontWeight: '800',
    letterSpacing: -0.3,
    textTransform: 'uppercase',
    maxWidth: 340,
  },
  subcopy: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
    maxWidth: 340,
  },
  upcomingLabel: {
    marginTop: 14,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  matchBlock: { marginTop: 8, gap: 4 },
  teamRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  crest: { width: 24, height: 24 },
  teamName: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: -0.2,
    textTransform: 'uppercase',
  },
  vs: {
    paddingLeft: 30,
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  venueRow: { marginTop: 4, flexDirection: 'row', alignItems: 'center', gap: 4 },
  venue: { flex: 1, fontSize: 12, fontWeight: '600' },
  noFixtures: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  countdownRow: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'flex-end',
    flexWrap: 'wrap',
    gap: 6,
  },
  unit: { alignItems: 'center' },
  unitLabel: {
    marginBottom: 4,
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  unitBox: {
    minWidth: 40,
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  unitValue: { fontSize: 14, fontWeight: '700', fontVariant: ['tabular-nums'] },
  colon: { fontSize: 14, fontWeight: '900', paddingBottom: 12 },
  predictBtn: {
    marginTop: 14,
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  predictBtnText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  scoresViewport: {
    marginTop: 16,
    height: SCORE_VIEWPORT_H,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  scoresViewportExpand: {
    flex: 1,
    height: undefined,
    minHeight: SCORE_VIEWPORT_H,
  },
  scoresTrack: {
    gap: 8,
  },
  scoresHalf: {
    gap: 8,
  },
  fadeTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 28,
  },
  fadeBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 36,
  },
  scoreRow: {
    minHeight: 44,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  status: {
    width: 28,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  smallCrest: { width: 20, height: 20 },
  scoreTeam: { flex: 1, fontSize: 11, fontWeight: '700' },
  scoreTeamRight: { textAlign: 'right' },
  scoreline: {
    fontSize: 12,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
});
