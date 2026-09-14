import { useEffect, useRef, useState } from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, type Href } from 'expo-router';

import { useTranslations } from '@/contexts/locale';
import { useTheme } from '@/hooks/use-theme';
import { saveContestPrediction, type ContestMatch } from '@/lib/contest-api';

const SCORE_MAX = 5;
const STEPPER = 30;
const CREST = 36;
const CREST_IMG = 27;
const SCORE_BOX = 30;

type Props = {
  contestId: string;
  match: ContestMatch;
  initialHome: number | null;
  initialAway: number | null;
  onSaved?: (matchId: string, home: number, away: number) => void;
};

function clamp(value: number) {
  return Math.min(SCORE_MAX, Math.max(0, value));
}

function nextScore(current: number | null, change: number) {
  if (current === null) return change > 0 ? 1 : 0;
  return clamp(current + change);
}

/**
 * Compact prediction card:
 * [crest] Name · Name [crest]   (logos at card edges)
 *   − score + – − score +       (steppers inline with score)
 */
export function PredictionCard({
  contestId,
  match,
  initialHome,
  initialAway,
  onSaved,
}: Props) {
  const theme = useTheme();
  const t = useTranslations();
  const router = useRouter();

  const finished = ['FINISHED', 'AWARDED'].includes(match.status);
  const inPlay = ['IN_PLAY', 'PAUSED'].includes(match.status);
  const locked = match.locked || finished || inPlay;
  const canReveal = match.revealable || locked;

  const [home, setHome] = useState<number | null>(initialHome);
  const [away, setAway] = useState<number | null>(initialAway);
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setHome(initialHome);
    setAway(initialAway);
  }, [initialHome, initialAway, match.id]);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
      if (flashTimer.current) clearTimeout(flashTimer.current);
    };
  }, []);

  const hasPick = home !== null && away !== null;
  const msLeft = new Date(match.utcDate).getTime() - Date.now();
  const urgent = !locked && Number.isFinite(msLeft) && msLeft > 0 && msLeft <= 2 * 60 * 60 * 1000;

  const scheduleSave = (nextHome: number | null, nextAway: number | null) => {
    if (locked || nextHome === null || nextAway === null) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      void (async () => {
        setSaving(true);
        setError(null);
        try {
          await saveContestPrediction(contestId, match.id, nextHome, nextAway);
          onSaved?.(match.id, nextHome, nextAway);
          setSavedFlash(true);
          if (flashTimer.current) clearTimeout(flashTimer.current);
          flashTimer.current = setTimeout(() => setSavedFlash(false), 1600);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Save failed');
        } finally {
          setSaving(false);
        }
      })();
    }, 700);
  };

  const bump = (side: 'home' | 'away', delta: number) => {
    if (locked) return;
    const h = side === 'home' ? nextScore(home, delta) : home;
    const a = side === 'away' ? nextScore(away, delta) : away;
    setHome(h);
    setAway(a);
    scheduleSave(h, a);
  };

  const borderColor = urgent
    ? theme.isDark
      ? 'rgba(248,113,113,0.45)'
      : 'rgba(248,113,113,0.55)'
    : hasPick
      ? theme.isDark
        ? 'rgba(16,185,129,0.28)'
        : 'rgba(167,243,208,0.95)'
      : theme.isDark
        ? 'rgba(244,63,94,0.28)'
        : 'rgba(254,205,211,0.95)';

  const bg = hasPick
    ? theme.isDark
      ? 'rgba(16,185,129,0.08)'
      : 'rgba(16,185,129,0.04)'
    : theme.isDark
      ? 'rgba(244,63,94,0.08)'
      : 'rgba(244,63,94,0.045)';

  const urgencyLabel = finished
    ? t('ENDED')
    : inPlay
      ? t('LIVE')
      : locked && !finished
        ? t('LOCKED')
        : saving
          ? t('Saving...')
          : error
            ? error
            : savedFlash
              ? `✓ ${t('Saved')}`
              : urgent
                ? t('Closing soon')
                : null;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.isDark ? theme.backgroundElement : bg,
          borderColor,
          shadowColor: '#000',
        },
      ]}>
      {/* [crest] Name · Name [crest] — logos at card edges */}
      <View style={styles.teamsRow}>
        <Crest crest={match.homeCrest} name={match.homeTeam} theme={theme} />
        <Text numberOfLines={2} style={[styles.teamName, styles.homeName, { color: theme.text }]}>
          {match.homeTeam}
        </Text>
        <View style={styles.midGap} />
        <Text numberOfLines={2} style={[styles.teamName, styles.awayName, { color: theme.text }]}>
          {match.awayTeam}
        </Text>
        <Crest crest={match.awayCrest} name={match.awayTeam} theme={theme} />
      </View>

      {/* − score + | – | − score + */}
      <View style={styles.scoreRow}>
        <ScoreStepper
          value={home}
          locked={locked}
          theme={theme}
          label={match.homeTeam}
          onDec={() => bump('home', -1)}
          onInc={() => bump('home', 1)}
          canDec={home === null || home > 0}
          canInc={home === null || home < SCORE_MAX}
        />
        <Text style={[styles.dash, { color: theme.textSecondary }]}>–</Text>
        <ScoreStepper
          value={away}
          locked={locked}
          theme={theme}
          label={match.awayTeam}
          onDec={() => bump('away', -1)}
          onInc={() => bump('away', 1)}
          canDec={away === null || away > 0}
          canInc={away === null || away < SCORE_MAX}
        />
      </View>

      {canReveal || urgencyLabel ? (
        <View style={styles.footer}>
          {canReveal ? (
            <Pressable
              onPress={() =>
                router.push(`/contests/${contestId}/ranking` as Href)
              }
              style={[styles.revealLink, urgencyLabel ? styles.revealLinkPad : null]}
              hitSlop={8}>
              <Ionicons name="eye-outline" size={12} color={theme.textSecondary} />
              <Text style={[styles.revealText, { color: theme.textSecondary }]} numberOfLines={1}>
                {t("See everyone's prediction")}
              </Text>
            </Pressable>
          ) : urgencyLabel ? (
            <Text
              style={[
                styles.urgencyPlain,
                {
                  color: error
                    ? '#f87171'
                    : urgent
                      ? '#fca5a5'
                      : theme.accent,
                },
              ]}>
              {urgencyLabel}
            </Text>
          ) : null}
          {canReveal && urgencyLabel ? (
            <View
              pointerEvents="none"
              style={[
                styles.endedBadge,
                {
                  backgroundColor:
                    finished || locked
                      ? theme.isDark
                        ? 'rgba(255,255,255,0.08)'
                        : 'rgba(148,163,184,0.18)'
                      : 'transparent',
                },
              ]}>
              <Text
                style={[
                  finished || (locked && !finished && !inPlay)
                    ? styles.endedText
                    : styles.urgencyPlain,
                  {
                    color:
                      finished || (locked && !finished && !inPlay)
                        ? theme.textSecondary
                        : error
                          ? '#f87171'
                          : theme.accent,
                  },
                ]}>
                {urgencyLabel}
              </Text>
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

function Crest({
  crest,
  name,
  theme,
}: {
  crest: string | null;
  name: string;
  theme: ReturnType<typeof useTheme>;
}) {
  return crest ? (
    <View style={styles.crestWrap}>
      <Image source={{ uri: crest }} style={styles.crest} />
    </View>
  ) : (
    <View style={[styles.crestFallback, { backgroundColor: '#ffffff' }]}>
      <Text style={{ color: theme.textSecondary, fontWeight: '800', fontSize: 9 }}>
        {name.slice(0, 3).toUpperCase()}
      </Text>
    </View>
  );
}

function ScoreStepper({
  value,
  locked,
  theme,
  label,
  onDec,
  onInc,
  canDec,
  canInc,
}: {
  value: number | null;
  locked: boolean;
  theme: ReturnType<typeof useTheme>;
  label: string;
  onDec: () => void;
  onInc: () => void;
  canDec: boolean;
  canInc: boolean;
}) {
  const decBg = theme.isDark ? 'rgba(248,113,113,0.14)' : 'rgba(248,113,113,0.12)';
  const incBg = theme.isDark ? 'rgba(52,211,153,0.14)' : 'rgba(16,185,129,0.12)';
  const decColor = theme.isDark ? 'rgba(252,165,165,0.95)' : 'rgba(185,28,28,0.75)';
  const incColor = theme.isDark ? 'rgba(110,231,183,0.95)' : 'rgba(4,120,87,0.75)';

  const score =
    locked ? (
      <Text style={[styles.scoreReadOnly, { color: theme.text }]}>
        {value === null ? '—' : value}
      </Text>
    ) : (
      <View
        style={[
          styles.scoreBox,
          {
            backgroundColor: theme.isDark ? 'rgba(0,0,0,0.35)' : '#ffffff',
            borderColor: theme.isDark ? 'rgba(255,255,255,0.15)' : '#e2e8f0',
            shadowColor: '#000',
          },
        ]}>
        <Text
          style={[
            styles.scoreText,
            { color: value === null ? theme.textSecondary : theme.text },
          ]}>
          {value === null ? '—' : value}
        </Text>
      </View>
    );

  if (locked) {
    return <View style={styles.scoreCell}>{score}</View>;
  }

  return (
    <View style={styles.scoreCell}>
      <Pressable
        accessibilityLabel={`Decrease ${label}`}
        disabled={!canDec}
        onPress={onDec}
        style={({ pressed }) => [
          styles.stepBtn,
          {
            backgroundColor: decBg,
            opacity: !canDec ? 0.3 : pressed ? 0.85 : 1,
            transform: [{ scale: pressed ? 0.95 : 1 }],
          },
        ]}>
        <Ionicons name="remove" size={14} color={decColor} />
      </Pressable>
      {score}
      <Pressable
        accessibilityLabel={`Increase ${label}`}
        disabled={!canInc}
        onPress={onInc}
        style={({ pressed }) => [
          styles.stepBtn,
          {
            backgroundColor: incBg,
            opacity: !canInc ? 0.3 : pressed ? 0.85 : 1,
            transform: [{ scale: pressed ? 0.95 : 1 }],
          },
        ]}>
        <Ionicons name="add" size={14} color={incColor} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 8,
    gap: 6,
    shadowOpacity: 0.03,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },
  teamsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  midGap: { width: 12, flexShrink: 0 },
  crestWrap: {
    width: CREST,
    height: CREST,
    borderRadius: 999,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
    flexShrink: 0,
  },
  crest: { width: CREST_IMG, height: CREST_IMG },
  crestFallback: {
    width: CREST,
    height: CREST,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    flexShrink: 0,
  },
  teamName: {
    flex: 1,
    minWidth: 0,
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 14,
  },
  homeName: {
    textAlign: 'left',
  },
  awayName: {
    textAlign: 'right',
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreCell: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: STEPPER,
  },
  scoreBox: {
    width: SCORE_BOX,
    height: SCORE_BOX,
    borderRadius: 9,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.06,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
  scoreText: { fontSize: 15, fontWeight: '700', fontVariant: ['tabular-nums'] },
  scoreReadOnly: { fontSize: 18, fontWeight: '700', fontVariant: ['tabular-nums'] },
  dash: {
    width: 16,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '700',
    flexShrink: 0,
  },
  stepBtn: {
    width: STEPPER,
    height: STEPPER,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    position: 'relative',
    marginTop: 2,
    minHeight: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  revealLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingVertical: 2,
    maxWidth: '78%',
  },
  revealLinkPad: {
    paddingRight: 48,
  },
  revealText: { fontSize: 9, fontWeight: '600' },
  urgencyPlain: {
    fontSize: 9,
    fontWeight: '600',
  },
  endedBadge: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    borderRadius: 5,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  endedText: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
});
