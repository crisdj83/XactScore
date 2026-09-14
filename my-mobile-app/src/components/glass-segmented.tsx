import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  LayoutChangeEvent,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  Image,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import { Gesture, GestureDetector, RectButton, ScrollView } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { GlassTabColors, glassTabPalette } from '@/constants/glass-tabs';
import { useTheme } from '@/hooks/use-theme';

const SPRING = { damping: 20, stiffness: 280, mass: 0.7 };
const PAD = 3;
const ICON_SLOT = 48;

export type GlassSegmentItem = {
  key: string;
  label?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  iconOnly?: boolean;
};

type Layout = { x: number; width: number; height: number };

function indicatorFill(isDark: boolean) {
  return isDark ? 'rgba(255,255,255,0.22)' : '#FFFFFF';
}

function indicatorBorder(isDark: boolean) {
  return isDark ? 'rgba(255,255,255,0.30)' : 'rgba(15,23,42,0.10)';
}

/** Frosted / liquid-glass track — App Store light/dark glass colors. */
export function GlassTrack({
  children,
  style,
  radius = 28,
  interactive = true,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  radius?: number;
  /** When false, glass doesn't steal pan gestures (needed for nested scroll strips). */
  interactive?: boolean;
}) {
  const theme = useTheme();
  const palette = glassTabPalette(theme.isDark);
  const liquid = Platform.OS === 'ios' && isLiquidGlassAvailable();
  const shellStyle = [
    styles.track,
    {
      borderRadius: radius,
      borderColor: palette.trackBorder,
      backgroundColor: liquid ? undefined : palette.trackWash,
    },
    style,
  ];

  if (liquid) {
    return (
      <GlassView
        glassEffectStyle="regular"
        colorScheme={theme.isDark ? 'dark' : 'light'}
        tintColor={palette.trackWash}
        isInteractive={interactive}
        style={shellStyle}>
        {children}
      </GlassView>
    );
  }

  return (
    <View style={shellStyle}>
      <BlurView
        intensity={palette.blurIntensity}
        tint={palette.blurTint}
        style={[StyleSheet.absoluteFill, { borderRadius: radius }]}
      />
      <View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          {
            borderRadius: radius,
            backgroundColor: palette.trackWash,
          },
        ]}
      />
      <View
        pointerEvents="none"
        style={[
          styles.specular,
          {
            borderTopColor: theme.isDark
              ? 'rgba(255,255,255,0.18)'
              : 'rgba(255,255,255,0.95)',
            borderRadius: radius,
          },
        ]}
      />
      {children}
    </View>
  );
}

/**
 * Glass control with raised sliding pill.
 * - equal: every item same width (Mine/Join/New, theme)
 * - split: labeled items share space evenly; icon-only stay compact (contest nav)
 */
export function GlassSegmented({
  items,
  value,
  onChange,
  radius = 999,
  style,
  itemHeight = 48,
  distribution = 'equal',
}: {
  items: GlassSegmentItem[];
  value: string;
  onChange: (key: string) => void;
  radius?: number;
  style?: StyleProp<ViewStyle>;
  itemHeight?: number;
  distribution?: 'equal' | 'split';
}) {
  const theme = useTheme();
  const palette = glassTabPalette(theme.isDark);
  const [layouts, setLayouts] = useState<Record<string, Layout>>({});
  const layoutsRef = useRef(layouts);
  layoutsRef.current = layouts;

  const index = Math.max(
    0,
    items.findIndex((item) => item.key === value)
  );
  const count = Math.max(items.length, 1);

  const left = useSharedValue(PAD);
  const width = useSharedValue(0);
  const dragStart = useSharedValue(0);

  const snapToKey = (key: string, animated = true) => {
    const layout = layoutsRef.current[key];
    if (!layout) return;
    if (animated) {
      left.value = withSpring(layout.x, SPRING);
      width.value = withSpring(layout.width, SPRING);
    } else {
      left.value = layout.x;
      width.value = layout.width;
    }
  };

  useEffect(() => {
    if (!layouts[value]) return;
    snapToKey(value, true);
  }, [value, layouts]);

  const nearestIndex = (xCenter: number) => {
    let best = 0;
    let bestDist = Number.POSITIVE_INFINITY;
    items.forEach((item, i) => {
      const layout = layoutsRef.current[item.key];
      if (!layout) return;
      const mid = layout.x + layout.width / 2;
      const dist = Math.abs(mid - xCenter);
      if (dist < bestDist) {
        bestDist = dist;
        best = i;
      }
    });
    return best;
  };

  const selectIndex = (nextIndex: number) => {
    const clamped = Math.max(0, Math.min(count - 1, nextIndex));
    const next = items[clamped]?.key;
    if (!next) return;
    if (next !== value) onChange(next);
    else snapToKey(next, true);
  };

  const finishDrag = (x: number) => {
    selectIndex(nearestIndex(x + width.value / 2));
  };

  const pan = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetX([-6, 6])
        .onBegin(() => {
          dragStart.value = left.value;
        })
        .onUpdate((event) => {
          left.value = dragStart.value + event.translationX;
        })
        .onEnd(() => {
          runOnJS(finishDrag)(left.value);
        }),
    [items, value, count]
  );

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: left.value }],
    width: Math.max(width.value, 0),
    opacity: width.value > 0 ? 1 : 0,
  }));

  const onItemLayout = (key: string, e: LayoutChangeEvent) => {
    const { x, width: w, height: h } = e.nativeEvent.layout;
    setLayouts((prev) => {
      const prevLayout = prev[key];
      if (
        prevLayout &&
        prevLayout.x === x &&
        prevLayout.width === w &&
        prevLayout.height === h
      ) {
        return prev;
      }
      return { ...prev, [key]: { x, width: w, height: h } };
    });
  };

  return (
    <GestureDetector gesture={pan}>
      <Animated.View>
        <GlassTrack radius={radius} style={[styles.wrap, style]}>
          <View style={[styles.row, { minHeight: itemHeight }]}>
            <Animated.View
              pointerEvents="none"
              style={[
                styles.indicator,
                {
                  height: itemHeight,
                  backgroundColor: indicatorFill(theme.isDark),
                  borderColor: indicatorBorder(theme.isDark),
                  shadowColor: theme.isDark ? '#000' : '#64748b',
                },
                indicatorStyle,
              ]}
            />

            {items.map((item, itemIndex) => {
              const active = item.key === value;
              const color = active ? GlassTabColors.active : palette.inactive;
              const isIcon = Boolean(item.iconOnly);
              return (
                <Pressable
                  key={item.key}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={item.label || item.key}
                  onLayout={(e) => onItemLayout(item.key, e)}
                  onPress={() => selectIndex(itemIndex)}
                  style={({ pressed }) => [
                    styles.item,
                    {
                      minHeight: itemHeight,
                      width: isIcon && distribution === 'split' ? ICON_SLOT : undefined,
                      flex: isIcon && distribution === 'split' ? 0 : 1,
                    },
                    pressed && { opacity: 0.88 },
                  ]}>
                  {item.icon ? (
                    <Ionicons name={item.icon} size={isIcon ? 18 : 16} color={color} />
                  ) : null}
                  {!isIcon && item.label ? (
                    <Text style={[styles.label, { color }]} numberOfLines={1}>
                      {item.label}
                    </Text>
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

/**
 * Horizontal glass chip strip — nested-scroll safe, snaps selection to center.
 * Optional crests for fixture chips (Table / GW strip).
 */
export type GlassChipItem = {
  key: string;
  label: string;
  leadingUri?: string | null;
  trailingUri?: string | null;
};

export function GlassChipStrip({
  items,
  value,
  onChange,
  style,
}: {
  items: GlassChipItem[];
  value: string;
  onChange: (key: string) => void;
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useTheme();
  const palette = glassTabPalette(theme.isDark);
  const scrollRef = useRef<ScrollView>(null);
  const [trackWidth, setTrackWidth] = useState(0);
  const [layouts, setLayouts] = useState<Record<string, Layout>>({});
  const layoutsRef = useRef(layouts);
  layoutsRef.current = layouts;
  const draggingRef = useRef(false);
  const scrollXRef = useRef(0);
  const ignoreSettleUntilRef = useRef(0);

  const left = useSharedValue(0);
  const width = useSharedValue(0);

  /** Side padding so first/last chips can sit in the true center. */
  const sidePad = Math.max(0, trackWidth / 2);
  const hasValueLayout = Boolean(layouts[value]);

  const centerChip = (key: string, animated = true) => {
    const layout = layoutsRef.current[key];
    if (!layout || trackWidth <= 0) return;
    const chipCenterInContent = sidePad + layout.x + layout.width / 2;
    const target = Math.max(0, chipCenterInContent - trackWidth / 2);
    scrollRef.current?.scrollTo({ x: target, animated });
    scrollXRef.current = target;
  };

  const snapPill = (key: string, animated = true) => {
    const layout = layoutsRef.current[key];
    if (!layout) return;
    if (animated) {
      left.value = withSpring(layout.x, SPRING);
      width.value = withSpring(layout.width, SPRING);
    } else {
      left.value = layout.x;
      width.value = layout.width;
    }
  };

  // Move the glass pill whenever the selected chip's layout is known.
  useEffect(() => {
    if (!hasValueLayout) return;
    snapPill(value, true);
  }, [value, hasValueLayout, layouts[value]?.x, layouts[value]?.width]);

  // Center selected chip when value/track size changes — not while the user is dragging.
  useEffect(() => {
    if (!hasValueLayout || trackWidth <= 0 || draggingRef.current) return;
    const frame = requestAnimationFrame(() => centerChip(value, true));
    return () => cancelAnimationFrame(frame);
  }, [value, hasValueLayout, trackWidth, sidePad]);

  const nearestKeyAtOffset = (scrollX: number) => {
    const viewportCenter = scrollX + trackWidth / 2;
    let best = items[0]?.key;
    let bestDist = Number.POSITIVE_INFINITY;
    for (const item of items) {
      const layout = layoutsRef.current[item.key];
      if (!layout) continue;
      const mid = sidePad + layout.x + layout.width / 2;
      const dist = Math.abs(mid - viewportCenter);
      if (dist < bestDist) {
        bestDist = dist;
        best = item.key;
      }
    }
    return best;
  };

  const selectKey = (key: string) => {
    if (!key) return;
    draggingRef.current = false;
    // Don't let a following scroll-end settle overwrite the tapped chip.
    ignoreSettleUntilRef.current = Date.now() + 400;
    snapPill(key, true);
    centerChip(key, true);
    if (key !== value) onChange(key);
  };

  const settleScroll = (scrollX: number) => {
    draggingRef.current = false;
    if (Date.now() < ignoreSettleUntilRef.current) return;
    const key = nearestKeyAtOffset(scrollX);
    if (!key) return;
    snapPill(key, true);
    centerChip(key, true);
    if (key !== value) onChange(key);
  };

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: left.value }],
    width: Math.max(width.value, 0),
    opacity: width.value > 0 ? 1 : 0,
  }));

  return (
    <GlassTrack interactive={false} radius={18} style={[styles.chipTrack, style]}>
      <View
        style={styles.chipViewport}
        onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}>
        <ScrollView
          ref={scrollRef}
          horizontal
          nestedScrollEnabled
          directionalLockEnabled
          showsHorizontalScrollIndicator={false}
          decelerationRate="fast"
          keyboardShouldPersistTaps="always"
          scrollEventThrottle={16}
          onScroll={(e) => {
            scrollXRef.current = e.nativeEvent.contentOffset.x;
          }}
          onScrollBeginDrag={() => {
            draggingRef.current = true;
          }}
          onMomentumScrollEnd={(e) => {
            settleScroll(e.nativeEvent.contentOffset.x);
          }}
          onScrollEndDrag={(e) => {
            const vx = e.nativeEvent.velocity?.x ?? 0;
            // Momentum will fire settle; only settle now if the drag stopped cold.
            if (Math.abs(vx) > 0.08) return;
            settleScroll(e.nativeEvent.contentOffset.x);
          }}
          contentContainerStyle={[styles.chipContent, { paddingHorizontal: sidePad }]}>
          <View style={styles.chipRow}>
            <Animated.View
              pointerEvents="none"
              style={[
                styles.chipIndicator,
                {
                  backgroundColor: indicatorFill(theme.isDark),
                  borderColor: indicatorBorder(theme.isDark),
                  shadowColor: theme.isDark ? '#000' : '#64748b',
                },
                indicatorStyle,
              ]}
            />
            {items.map((item) => {
              const active = item.key === value;
              const color = active ? GlassTabColors.active : palette.inactive;
              return (
                <RectButton
                  key={item.key}
                  rippleColor="transparent"
                  underlayColor="transparent"
                  onLayout={(e) => {
                    const { x, width: w, height: h } = e.nativeEvent.layout;
                    setLayouts((prev) => {
                      const prevLayout = prev[item.key];
                      if (
                        prevLayout &&
                        prevLayout.x === x &&
                        prevLayout.width === w &&
                        prevLayout.height === h
                      ) {
                        return prev;
                      }
                      return {
                        ...prev,
                        [item.key]: { x, width: w, height: h },
                      };
                    });
                  }}
                  onPress={() => selectKey(item.key)}
                  style={styles.chip}>
                  <View style={styles.chipInner} pointerEvents="none">
                    {item.leadingUri ? (
                      <Image source={{ uri: item.leadingUri }} style={styles.chipCrest} />
                    ) : null}
                    <Text
                      style={[
                        styles.chipLabel,
                        { color, fontWeight: active ? '700' : '600' },
                      ]}>
                      {item.label}
                    </Text>
                    {item.trailingUri ? (
                      <Image source={{ uri: item.trailingUri }} style={styles.chipCrest} />
                    ) : null}
                  </View>
                </RectButton>
              );
            })}
          </View>
        </ScrollView>
      </View>
    </GlassTrack>
  );
}

const styles = StyleSheet.create({
  track: {
    borderWidth: StyleSheet.hairlineWidth,
  },
  specular: {
    ...StyleSheet.absoluteFill,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  wrap: {
    padding: PAD,
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
    shadowOpacity: 0.28,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
    zIndex: 0,
  },
  item: {
    zIndex: 1,
    borderRadius: 999,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  label: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.35,
    textAlign: 'center',
  },
  chipTrack: {
    padding: PAD,
    overflow: 'hidden',
  },
  chipViewport: {
    width: '100%',
  },
  chipContent: {
    alignItems: 'center',
  },
  chipRow: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  chipIndicator: {
    position: 'absolute',
    left: 0,
    top: 0,
    height: 40,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
    zIndex: 0,
  },
  chip: {
    zIndex: 1,
    minHeight: 40,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    justifyContent: 'center',
  },
  chipInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  chipCrest: {
    width: 16,
    height: 16,
  },
  chipLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
