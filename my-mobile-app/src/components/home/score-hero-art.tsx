import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

/**
 * Same score-card illustration in light and dark — only the palette changes
 * (replaces the two mismatched PNG hero arts).
 */
export function ScoreHeroArt() {
  const theme = useTheme();
  const { isDark } = theme;

  const canvas = isDark ? '#0f0f12' : '#e8edf5';
  const card = isDark ? '#1c1c22' : '#ffffff';
  const score = isDark ? theme.accent : '#0f172a';
  const home = isDark ? '#6366f1' : '#64748b';
  const away = isDark ? theme.accent : '#f97316';
  const muted = isDark ? 'rgba(255,255,255,0.12)' : '#e2e8f0';
  const wave = isDark ? 'rgba(255,138,43,0.12)' : 'rgba(99,102,241,0.10)';

  return (
    <View style={[styles.canvas, { backgroundColor: canvas }]}>
      <View style={[styles.blob, styles.blobTop, { backgroundColor: wave }]} />
      <View style={[styles.blob, styles.blobBottom, { backgroundColor: wave }]} />
      <View style={[styles.dotGrid, styles.dotGridTL]}>
        {Array.from({ length: 6 }).map((_, i) => (
          <View
            key={`tl-${i}`}
            style={[styles.dot, { backgroundColor: isDark ? 'rgba(255,138,43,0.35)' : '#94a3b8' }]}
          />
        ))}
      </View>
      <View style={[styles.dotGrid, styles.dotGridBL]}>
        {Array.from({ length: 6 }).map((_, i) => (
          <View
            key={`bl-${i}`}
            style={[styles.dot, { backgroundColor: isDark ? 'rgba(255,255,255,0.18)' : '#cbd5e1' }]}
          />
        ))}
      </View>

      <View
        style={[
          styles.card,
          {
            backgroundColor: card,
            borderColor: isDark ? 'rgba(255,138,43,0.35)' : muted,
            shadowColor: isDark ? '#ff8a2b' : '#0f172a',
          },
        ]}>
        <View style={styles.pillRow}>
          <View style={[styles.pillHalf, { backgroundColor: home }]} />
          <View style={[styles.pillHalf, { backgroundColor: away }]} />
        </View>

        <View style={styles.scoreRow}>
          <View style={[styles.crest, { backgroundColor: `${home}22`, borderColor: home }]}>
            <View style={[styles.chevron, { borderColor: home }]} />
          </View>
          <Text style={[styles.score, { color: score }]}>2 - 1</Text>
          <View style={[styles.crest, { backgroundColor: `${away}22`, borderColor: away }]}>
            <View style={[styles.chevron, { borderColor: away }]} />
          </View>
        </View>

        <View style={styles.dashes}>
          <View style={[styles.dash, { backgroundColor: home }]} />
          <View style={[styles.dash, { backgroundColor: away }]} />
        </View>

        <View style={[styles.divider, { backgroundColor: muted }]} />

        <View style={styles.pillRow}>
          <View style={[styles.pillHalf, { backgroundColor: home }]} />
          <View style={[styles.pillHalf, { backgroundColor: away }]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  canvas: {
    width: '100%',
    height: 180,
    borderRadius: 20,
    marginTop: 12,
    marginBottom: 4,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  blob: {
    position: 'absolute',
    width: 180,
    height: 90,
    borderRadius: 999,
  },
  blobTop: { top: -30, right: -20 },
  blobBottom: { bottom: -40, left: -30 },
  dotGrid: {
    position: 'absolute',
    width: 28,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  dotGridTL: { top: 14, left: 14 },
  dotGridBL: { bottom: 14, left: 14 },
  dot: { width: 4, height: 4, borderRadius: 2 },
  card: {
    width: '78%',
    maxWidth: 280,
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    alignItems: 'center',
    gap: 10,
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  pillRow: {
    width: 72,
    height: 8,
    borderRadius: 999,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  pillHalf: { flex: 1 },
  scoreRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  crest: {
    width: 40,
    height: 40,
    borderRadius: 999,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chevron: {
    width: 12,
    height: 12,
    borderLeftWidth: 3,
    borderBottomWidth: 3,
    transform: [{ rotate: '-45deg' }],
    marginTop: -2,
  },
  score: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
    fontVariant: ['tabular-nums'],
  },
  dashes: {
    flexDirection: 'row',
    gap: 6,
  },
  dash: {
    width: 14,
    height: 3,
    borderRadius: 999,
  },
  divider: {
    width: '100%',
    height: StyleSheet.hairlineWidth,
  },
});
