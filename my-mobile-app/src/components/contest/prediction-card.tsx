import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import { saveContestPrediction } from '@/lib/contest-api';
import type { ContestMatch } from '@/lib/contest-api';

const SCORE_MAX = 5;

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

export function PredictionCard({
  contestId,
  match,
  initialHome,
  initialAway,
  onSaved,
}: Props) {
  const theme = useTheme();
  const locked = match.locked || ['FINISHED', 'IN_PLAY', 'PAUSED', 'AWARDED'].includes(match.status);
  const [home, setHome] = useState<number | null>(initialHome);
  const [away, setAway] = useState<number | null>(initialAway);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef({ home, away });
  latest.current = { home, away };

  useEffect(() => {
    setHome(initialHome);
    setAway(initialAway);
  }, [initialHome, initialAway, match.id]);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const hasPick = home !== null && away !== null;
  const urgent =
    !locked &&
    Number.isFinite(new Date(match.utcDate).getTime()) &&
    new Date(match.utcDate).getTime() - Date.now() < 2 * 60 * 60 * 1000;

  const scheduleSave = (nextHome: number | null, nextAway: number | null) => {
    if (locked) return;
    if (nextHome === null || nextAway === null) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      void (async () => {
        setSaving(true);
        setError(null);
        try {
          await saveContestPrediction(contestId, match.id, nextHome, nextAway);
          onSaved?.(match.id, nextHome, nextAway);
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
    const nextHome = side === 'home' ? nextScore(home, delta) : home;
    const nextAway = side === 'away' ? nextScore(away, delta) : away;
    // If one side still null after bumping the other, seed the other at 0 when first interaction completes both
    let h = nextHome;
    let a = nextAway;
    if (side === 'home' && a === null && h !== null) a = 0;
    if (side === 'away' && h === null && a !== null) h = 0;
    setHome(h);
    setAway(a);
    scheduleSave(h, a);
  };

  const borderColor = locked
    ? theme.border
    : urgent
      ? theme.danger
      : hasPick
        ? theme.success
        : theme.accent;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.backgroundElement,
          borderColor,
        },
      ]}>
      <View style={styles.teams}>
        <Team side="home" name={match.homeTeam} crest={match.homeCrest} theme={theme} />
        <View style={styles.scores}>
          {locked && match.homeScore != null && match.awayScore != null ? (
            <Text style={[styles.ft, { color: theme.textSecondary }]}>
              FT {match.homeScore}-{match.awayScore}
            </Text>
          ) : null}
          <View style={styles.stepperRow}>
            <Stepper
              value={home}
              locked={locked}
              onDec={() => bump('home', -1)}
              onInc={() => bump('home', 1)}
              theme={theme}
            />
            <Text style={[styles.colon, { color: theme.textSecondary }]}>:</Text>
            <Stepper
              value={away}
              locked={locked}
              onDec={() => bump('away', -1)}
              onInc={() => bump('away', 1)}
              theme={theme}
            />
          </View>
          {saving ? <ActivityIndicator size="small" color={theme.accent} /> : null}
          {error ? (
            <Text style={{ color: theme.danger, fontSize: 11, textAlign: 'center' }}>{error}</Text>
          ) : null}
          {locked ? (
            <Text style={[styles.lockHint, { color: theme.textSecondary }]}>Locked</Text>
          ) : null}
        </View>
        <Team side="away" name={match.awayTeam} crest={match.awayCrest} theme={theme} />
      </View>
    </View>
  );
}

function Team({
  name,
  crest,
  theme,
}: {
  side: 'home' | 'away';
  name: string;
  crest: string | null;
  theme: ReturnType<typeof useTheme>;
}) {
  return (
    <View style={styles.team}>
      {crest ? (
        <Image source={{ uri: crest }} style={styles.crest} />
      ) : (
        <View style={[styles.crestFallback, { backgroundColor: theme.accentMuted }]}>
          <Text style={{ color: theme.accent, fontWeight: '800', fontSize: 10 }}>
            {name.slice(0, 3).toUpperCase()}
          </Text>
        </View>
      )}
      <Text numberOfLines={2} style={[styles.teamName, { color: theme.text }]}>
        {name}
      </Text>
    </View>
  );
}

function Stepper({
  value,
  locked,
  onDec,
  onInc,
  theme,
}: {
  value: number | null;
  locked: boolean;
  onDec: () => void;
  onInc: () => void;
  theme: ReturnType<typeof useTheme>;
}) {
  return (
    <View style={styles.stepper}>
      <Pressable
        disabled={locked || value === 0}
        onPress={onDec}
        style={[
          styles.stepBtn,
          { backgroundColor: theme.isDark ? '#27272a' : '#f1f5f9', opacity: locked ? 0.35 : 1 },
        ]}>
        <Text style={{ color: theme.text, fontWeight: '800', fontSize: 18 }}>−</Text>
      </Pressable>
      <View
        style={[
          styles.scoreBox,
          {
            borderColor: theme.border,
            backgroundColor: theme.isDark ? 'rgba(0,0,0,0.35)' : '#ffffff',
          },
        ]}>
        <Text style={[styles.scoreText, { color: theme.text }]}>
          {value === null ? '—' : value}
        </Text>
      </View>
      <Pressable
        disabled={locked || value === SCORE_MAX}
        onPress={onInc}
        style={[
          styles.stepBtn,
          { backgroundColor: theme.isDark ? '#27272a' : '#f1f5f9', opacity: locked ? 0.35 : 1 },
        ]}>
        <Text style={{ color: theme.text, fontWeight: '800', fontSize: 18 }}>+</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    borderWidth: 1.5,
    padding: 12,
  },
  teams: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  team: { flex: 1, alignItems: 'center', gap: 6 },
  crest: { width: 40, height: 40 },
  crestFallback: {
    width: 40,
    height: 40,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  teamName: {
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  scores: { alignItems: 'center', gap: 6, minWidth: 150 },
  ft: { fontSize: 11, fontWeight: '700' },
  stepperRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  stepBtn: {
    width: 34,
    height: 34,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreText: { fontSize: 20, fontWeight: '800', fontVariant: ['tabular-nums'] },
  colon: { fontSize: 18, fontWeight: '900', marginHorizontal: 2 },
  lockHint: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
});
