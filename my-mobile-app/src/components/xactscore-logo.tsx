import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '@/hooks/use-theme';

type Props = {
  compact?: boolean;
  showWordmark?: boolean;
};

/**
 * Matches website `app/components/XactScoreLogo.tsx`:
 * dark rounded tile + orange pulse mark + corner circle-dot.
 */
export function XactScoreLogo({ compact = true, showWordmark = false }: Props) {
  const theme = useTheme();
  const size = compact ? 36 : 56;
  const iconSize = compact ? 20 : 32;
  const dot = compact ? 10 : 14;
  const radius = compact ? 16 : 20;

  return (
    <View style={[styles.row, { gap: compact ? 8 : 12 }]}>
      <View
        style={[
          styles.mark,
          {
            width: size,
            height: size,
            borderRadius: radius,
            shadowColor: '#431407',
          },
        ]}>
        <Ionicons name="pulse" size={iconSize} color="#ff7a18" />
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
          XactScore
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
    backgroundColor: '#0d0d0d',
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  /** Lucide CircleDot: ring + filled center */
  dot: {
    position: 'absolute',
    borderColor: '#ff7a18',
    backgroundColor: '#ff7a18',
  },
  wordmark: {
    fontWeight: '900',
    letterSpacing: -1.2,
    lineHeight: undefined,
  },
});
