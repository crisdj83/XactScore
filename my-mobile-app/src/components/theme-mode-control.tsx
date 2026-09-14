import { useEffect, useMemo, useState } from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { GlassTrack } from '@/components/glass-segmented';
import { GlassTabColors, glassTabPalette } from '@/constants/glass-tabs';
import type { ThemePreference } from '@/constants/theme';
import { useTranslations } from '@/contexts/locale';
import { useTheme } from '@/hooks/use-theme';

const OPTIONS: {
  value: ThemePreference;
  icon: keyof typeof Ionicons.glyphMap;
  labelKey: string;
}[] = [
  { value: 'light', icon: 'sunny', labelKey: 'Light mode' },
  { value: 'dark', icon: 'moon', labelKey: 'Dark mode' },
  { value: 'system', icon: 'phone-portrait-outline', labelKey: 'Auto' },
];

const SPRING = { damping: 20, stiffness: 280, mass: 0.7 };
const PAD = 3;

type Props = {
  compact?: boolean;
};

/**
 * Theme sun / moon / auto — glass track with a draggable sliding selection pill.
 */
export function ThemeModeControl({ compact = true }: Props) {
  const theme = useTheme();
  const t = useTranslations();
  const palette = glassTabPalette(theme.isDark);
  const [trackWidth, setTrackWidth] = useState(0);

  const index = Math.max(
    0,
    OPTIONS.findIndex((option) => option.value === theme.preference)
  );
  const count = OPTIONS.length;
  const slot = trackWidth > 0 ? (trackWidth - PAD * 2) / count : 0;

  const left = useSharedValue(PAD);
  const width = useSharedValue(0);
  const dragStart = useSharedValue(0);

  const snapTo = (nextIndex: number, animated = true) => {
    const clamped = Math.max(0, Math.min(count - 1, nextIndex));
    const nextLeft = PAD + clamped * slot;
    if (animated) {
      left.value = withSpring(nextLeft, SPRING);
      width.value = withSpring(slot, SPRING);
    } else {
      left.value = nextLeft;
      width.value = slot;
    }
  };

  useEffect(() => {
    if (slot <= 0) return;
    snapTo(index, true);
  }, [index, slot]);

  const selectIndex = (nextIndex: number) => {
    const clamped = Math.max(0, Math.min(count - 1, nextIndex));
    const next = OPTIONS[clamped]?.value;
    if (next && next !== theme.preference) {
      theme.setPreference(next);
    } else {
      snapTo(clamped, true);
    }
  };

  const pan = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetX([-6, 6])
        .onBegin(() => {
          dragStart.value = left.value;
        })
        .onUpdate((event) => {
          if (slot <= 0) return;
          const min = PAD;
          const max = PAD + (count - 1) * slot;
          const next = Math.max(min, Math.min(max, dragStart.value + event.translationX));
          left.value = next;
          width.value = slot;
        })
        .onEnd(() => {
          if (slot <= 0) return;
          const approx = Math.round((left.value - PAD) / slot);
          runOnJS(selectIndex)(approx);
        }),
    [slot, count, theme.preference]
  );

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: left.value }],
    width: Math.max(width.value, 0),
    opacity: width.value > 0 ? 1 : 0,
  }));

  const onTrackLayout = (e: LayoutChangeEvent) => {
    setTrackWidth(e.nativeEvent.layout.width);
  };

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={compact ? styles.compactWrap : undefined}>
        <GlassTrack radius={999} style={[styles.track, !compact && styles.trackWide]}>
          <View style={styles.row} onLayout={onTrackLayout}>
            <Animated.View
              pointerEvents="none"
              style={[
                styles.indicator,
                {
                  height: compact ? 36 : 40,
                  backgroundColor: theme.isDark
                    ? 'rgba(255,255,255,0.20)'
                    : '#FFFFFF',
                  borderColor: theme.isDark
                    ? 'rgba(255,255,255,0.28)'
                    : 'rgba(0,0,0,0.06)',
                  shadowColor: theme.isDark ? '#000' : '#94a3b8',
                },
                indicatorStyle,
              ]}
            />

            {OPTIONS.map((option, optionIndex) => {
              const active = option.value === theme.preference;
              const color = active ? GlassTabColors.active : palette.inactive;
              return (
                <Pressable
                  key={option.value}
                  accessibilityRole="button"
                  accessibilityLabel={t(option.labelKey)}
                  accessibilityState={{ selected: active }}
                  onPress={() => selectIndex(optionIndex)}
                  style={({ pressed }) => [
                    compact ? styles.slotCompact : styles.slot,
                    { width: slot > 0 ? slot : undefined, flex: slot > 0 ? 0 : 1 },
                    pressed && { opacity: 0.88 },
                  ]}>
                  <Ionicons name={option.icon} size={compact ? 16 : 18} color={color} />
                  {!compact ? (
                    <Text style={[styles.label, { color }]}>{t(option.labelKey)}</Text>
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        </GlassTrack>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  compactWrap: {
    alignSelf: 'flex-start',
  },
  track: {
    padding: PAD,
    minWidth: 120,
  },
  trackWide: {
    width: '100%',
  },
  row: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  indicator: {
    position: 'absolute',
    left: 0,
    top: 0,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    shadowOpacity: 0.22,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
    zIndex: 0,
  },
  slotCompact: {
    zIndex: 1,
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  slot: {
    zIndex: 1,
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 10,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
});
