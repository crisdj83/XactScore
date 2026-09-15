import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import * as SplashScreen from 'expo-splash-screen';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { XactScoreLogo } from '@/components/xactscore-logo';

/**
 * Branded splash aligned with app chrome: dark field, soft neon-green glow,
 * pulse mark + wordmark. Used while auth bootstraps after the native splash.
 */
export function BrandSplash({ message }: { message?: string }) {
  const insets = useSafeAreaInsets();
  const markOpacity = useSharedValue(0);
  const markY = useSharedValue(18);
  const wordOpacity = useSharedValue(0);
  const glowPulse = useSharedValue(0.55);

  useEffect(() => {
    SplashScreen.hideAsync().catch(() => undefined);

    markOpacity.value = withTiming(1, { duration: 520, easing: Easing.out(Easing.cubic) });
    markY.value = withTiming(0, { duration: 620, easing: Easing.out(Easing.cubic) });
    wordOpacity.value = withDelay(160, withTiming(1, { duration: 480 }));
    glowPulse.value = withRepeat(
      withSequence(
        withTiming(0.85, { duration: 1400, easing: Easing.inOut(Easing.quad) }),
        withTiming(0.5, { duration: 1400, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      false,
    );
  }, [glowPulse, markOpacity, markY, wordOpacity]);

  const markStyle = useAnimatedStyle(() => ({
    opacity: markOpacity.value,
    transform: [{ translateY: markY.value }],
  }));

  const wordStyle = useAnimatedStyle(() => ({
    opacity: wordOpacity.value,
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowPulse.value,
  }));

  return (
    <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <Image
        source={require('@/assets/images/brand/xactscore-splash-bg.png')}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
      />
      <LinearGradient
        colors={['rgba(10,10,10,0.35)', 'rgba(10,10,10,0.55)', 'rgba(10,10,10,0.82)']}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.center}>
        <Animated.View style={[styles.glow, glowStyle]} />
        <Animated.View style={[styles.markWrap, markStyle]}>
          <XactScoreLogo compact={false} />
        </Animated.View>
        <Animated.View style={wordStyle}>
          <Text style={styles.wordmark}>XactScore</Text>
          <Text style={styles.tagline}>Exact scores with friends</Text>
        </Animated.View>
      </View>

      <View style={styles.footer}>
        <ActivityIndicator color="#12ff80" />
        {message ? <Text style={styles.message}>{message}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#050a07',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 22,
    paddingHorizontal: 28,
  },
  glow: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(18,255,128,0.18)',
    shadowColor: '#12ff80',
    shadowOpacity: 0.9,
    shadowRadius: 48,
    shadowOffset: { width: 0, height: 0 },
  },
  markWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  wordmark: {
    color: '#f7f7f8',
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: -1.4,
    textAlign: 'center',
  },
  tagline: {
    marginTop: 8,
    color: 'rgba(154,154,163,0.95)',
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  footer: {
    alignItems: 'center',
    gap: 10,
    paddingBottom: 28,
  },
  message: {
    color: 'rgba(154,154,163,0.9)',
    fontSize: 13,
    fontWeight: '500',
  },
});
