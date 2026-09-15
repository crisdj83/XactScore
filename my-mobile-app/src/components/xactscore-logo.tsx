import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '@/hooks/use-theme';

type Props = {
  compact?: boolean;
  showWordmark?: boolean;
};

/**
 * Matches website `app/components/XactScoreLogo.tsx`:
 * black tile + neon green pulse mark + corner circle-dot.
 */
export function XactScoreLogo({ compact = true, showWordmark = false }: Props) {
  const theme = useTheme();
  const size = compact ? 36 : 56;
  const iconSize = compact ? 20 : 32;
  const dot = compact ? 10 : 14;
  const radius = compact ? 16 : 20;
  const accent = theme.accent;

  return (
    <View style={[styles.row, { gap: compact ? 8 : 12 }]}>
      <View
        style={[
          styles.mark,
          {
            width: size,
            height: size,
            borderRadius: radius,
            shadowColor: accent,
          },
        ]}>
        <Ionicons name="pulse" size={iconSize} color={accent} />
        <View
          style={[
            styles.dot,
            {
              width: dot,
              height: dot,
              borderRadius: dot / 2,
              top: compact ? 4 : 6,
              right: compact ? 4 : 6,
              borderWidth: compact ? 2 : 2.5,
              borderColor: accent,
              backgroundColor: accent,
            },
          ]}
        />
      </View>
      {showWordmark ? (
        <Text
          style={[
            styles.wordmark,
            {
              color: theme.text,
              fontSize: compact ? 23 : 36,
            },
          ]}>
          <Text style={{ color: theme.text }}>Xact</Text>
          <Text style={{ color: accent }}>Score</Text>
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mark: {
    backgroundColor: '#050a07',
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.45,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  /** Lucide CircleDot: ring + filled center */
  dot: {
    position: 'absolute',
  },
  wordmark: {
    fontWeight: '900',
    letterSpacing: -1.2,
    lineHeight: undefined,
  },
});
