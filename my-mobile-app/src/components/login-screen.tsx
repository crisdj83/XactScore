import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LanguageSwitcher } from '@/components/language-switcher';
import { ScoreHeroArt } from '@/components/home/score-hero-art';
import { ThemeModeControl } from '@/components/theme-mode-control';
import { XactScoreLogo } from '@/components/xactscore-logo';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/auth';
import { useTranslations } from '@/contexts/locale';
import { useTheme } from '@/hooks/use-theme';
import { siteUrl } from '@/lib/supabase';

function legalBase() {
  return siteUrl.replace(/\/$/, '').replace('://xactscore.app', '://www.xactscore.app');
}

export function LoginScreen() {
  const theme = useTheme();
  const t = useTranslations();
  const insets = useSafeAreaInsets();
  const onAccentText = theme.isDark ? '#0f0f10' : '#ffffff';
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  const brandOpacity = useSharedValue(0);
  const brandY = useSharedValue(22);
  const artOpacity = useSharedValue(0);
  const artScale = useSharedValue(0.92);
  const formOpacity = useSharedValue(0);
  const formY = useSharedValue(28);
  const glowPulse = useSharedValue(0.45);

  useEffect(() => {
    brandOpacity.value = withTiming(1, { duration: 520, easing: Easing.out(Easing.cubic) });
    brandY.value = withTiming(0, { duration: 620, easing: Easing.out(Easing.cubic) });
    artOpacity.value = withDelay(120, withTiming(1, { duration: 560 }));
    artScale.value = withDelay(
      120,
      withTiming(1, { duration: 680, easing: Easing.out(Easing.cubic) }),
    );
    formOpacity.value = withDelay(220, withTiming(1, { duration: 520 }));
    formY.value = withDelay(220, withTiming(0, { duration: 620, easing: Easing.out(Easing.cubic) }));
    glowPulse.value = withTiming(0.75, { duration: 1600, easing: Easing.inOut(Easing.quad) });
  }, [artOpacity, artScale, brandOpacity, brandY, formOpacity, formY, glowPulse]);

  const brandStyle = useAnimatedStyle(() => ({
    opacity: brandOpacity.value,
    transform: [{ translateY: brandY.value }],
  }));
  const artStyle = useAnimatedStyle(() => ({
    opacity: artOpacity.value,
    transform: [{ scale: artScale.value }],
  }));
  const formStyle = useAnimatedStyle(() => ({
    opacity: formOpacity.value,
    transform: [{ translateY: formY.value }],
  }));
  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowPulse.value,
  }));

  async function onSubmit() {
    setBusy(true);
    setMessage(null);
    setIsError(false);

    if (mode === 'signin') {
      const { error } = await signIn(email.trim(), password);
      if (error) {
        setIsError(true);
        setMessage(error);
      }
    } else {
      const { error, needsEmailConfirm } = await signUp(email.trim(), password);
      if (error) {
        setIsError(true);
        setMessage(error);
      } else if (needsEmailConfirm) {
        setMessage('Check your email to confirm your account, then sign in.');
      }
    }

    setBusy(false);
  }

  const gradientColors = theme.isDark
    ? (['#0a0a0c', '#141218', '#1a120c'] as const)
    : (['#e8edf5', '#dde5f0', '#f3e8de'] as const);

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <LinearGradient colors={[...gradientColors]} style={StyleSheet.absoluteFill} />
      <Animated.View
        pointerEvents="none"
        style={[
          styles.glow,
          glowStyle,
          { backgroundColor: theme.isDark ? 'rgba(255,122,24,0.22)' : 'rgba(249,115,22,0.16)' },
        ]}
      />

      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <XactScoreLogo compact />
        <View style={styles.topActions}>
          <ThemeModeControl />
          <LanguageSwitcher />
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}>
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingBottom: Math.max(insets.bottom, 20) + 16 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <Animated.View style={[styles.hero, brandStyle]}>
            <Text style={[styles.wordmark, { color: theme.text }]}>XactScore</Text>
            <Text style={[styles.headline, { color: theme.text }]}>
              {t('Call the scores.')}
              {'\n'}
              <Text style={{ color: theme.isDark ? theme.accent : '#ea580c' }}>
                {t('Own the table.')}
              </Text>
            </Text>
            <Text style={[styles.tagline, { color: theme.textSecondary }]}>
              {t('Call every Premier League score. Compete in your league. Climb the table.')}
            </Text>
          </Animated.View>

          <Animated.View style={[styles.artWrap, artStyle]}>
            <ScoreHeroArt />
          </Animated.View>

          <Animated.View style={formStyle}>
            <View
              style={[
                styles.modeSwitch,
                {
                  backgroundColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.72)',
                  borderColor: theme.border,
                },
              ]}>
              <Pressable
                onPress={() => setMode('signin')}
                style={[
                  styles.modeBtn,
                  mode === 'signin' && { backgroundColor: theme.accent },
                ]}>
                <Text
                  style={[
                    styles.modeText,
                    { color: mode === 'signin' ? onAccentText : theme.textSecondary },
                  ]}>
                  {t('Sign In')}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setMode('signup')}
                style={[
                  styles.modeBtn,
                  mode === 'signup' && { backgroundColor: theme.accent },
                ]}>
                <Text
                  style={[
                    styles.modeText,
                    { color: mode === 'signup' ? onAccentText : theme.textSecondary },
                  ]}>
                  {t('Sign Up')}
                </Text>
              </Pressable>
            </View>

            <View
              style={[
                styles.card,
                {
                  backgroundColor: theme.isDark ? 'rgba(24,24,27,0.92)' : 'rgba(255,255,255,0.92)',
                  borderColor: theme.isDark ? 'rgba(255,255,255,0.10)' : 'rgba(15,23,42,0.08)',
                },
              ]}>
              <Text style={[styles.label, { color: theme.text }]}>{t('Email')}</Text>
              <TextInput
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                placeholder="you@example.com"
                placeholderTextColor={theme.textSecondary}
                value={email}
                onChangeText={setEmail}
                style={[
                  styles.input,
                  {
                    color: theme.text,
                    borderColor: theme.borderStrong,
                    backgroundColor: theme.isDark ? 'rgba(0,0,0,0.28)' : '#f8fafc',
                  },
                ]}
              />

              <Text style={[styles.label, { color: theme.text }]}>{t('Password')}</Text>
              <TextInput
                secureTextEntry
                autoComplete={mode === 'signin' ? 'password' : 'new-password'}
                placeholder="••••••••"
                placeholderTextColor={theme.textSecondary}
                value={password}
                onChangeText={setPassword}
                style={[
                  styles.input,
                  {
                    color: theme.text,
                    borderColor: theme.borderStrong,
                    backgroundColor: theme.isDark ? 'rgba(0,0,0,0.28)' : '#f8fafc',
                  },
                ]}
              />
              <Text style={[styles.hint, { color: theme.textSecondary }]}>
                {t('Password must be at least 6 characters.')}
              </Text>

              {message ? (
                <View
                  style={[
                    styles.banner,
                    {
                      backgroundColor: isError ? `${theme.danger}22` : `${theme.success}22`,
                      borderColor: isError ? theme.danger : theme.success,
                    },
                  ]}>
                  <Text style={{ color: isError ? theme.danger : theme.success, fontSize: 13 }}>
                    {message}
                  </Text>
                </View>
              ) : null}

              <Pressable
                disabled={busy || !email || password.length < 6}
                onPress={onSubmit}
                style={[
                  styles.submit,
                  {
                    backgroundColor: theme.accent,
                    opacity: busy || !email || password.length < 6 ? 0.5 : 1,
                    shadowColor: theme.accent,
                  },
                ]}>
                {busy ? (
                  <ActivityIndicator color={onAccentText} />
                ) : (
                  <Text style={[styles.submitText, { color: onAccentText }]}>
                    {mode === 'signin' ? t('Sign In') : t('Sign Up')}
                  </Text>
                )}
              </Pressable>

              <Text style={[styles.legal, { color: theme.textSecondary }]}>
                {mode === 'signup' ? t('By signing up you agree to our') : t('See our')}{' '}
                <Text
                  style={{ color: theme.accent, fontWeight: '700' }}
                  onPress={() => void Linking.openURL(`${legalBase()}/privacy`)}>
                  {t('Privacy Policy')}
                </Text>
                {' · '}
                <Text
                  style={{ color: theme.accent, fontWeight: '700' }}
                  onPress={() => void Linking.openURL(`${legalBase()}/terms`)}>
                  {t('Terms of Use')}
                </Text>
              </Text>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  glow: {
    position: 'absolute',
    top: '12%',
    alignSelf: 'center',
    width: 280,
    height: 280,
    borderRadius: 140,
  },
  topBar: {
    paddingHorizontal: 14,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  scroll: {
    paddingHorizontal: Spacing.four,
    gap: 18,
    paddingTop: 8,
  },
  hero: {
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 8,
  },
  wordmark: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 3.2,
    textTransform: 'uppercase',
    opacity: 0.9,
  },
  headline: {
    textAlign: 'center',
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '900',
    letterSpacing: -1.1,
  },
  tagline: {
    textAlign: 'center',
    maxWidth: 320,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500',
  },
  artWrap: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: 340,
    borderRadius: 24,
    overflow: 'hidden',
    transform: [{ scale: 0.92 }],
  },
  modeSwitch: {
    flexDirection: 'row',
    borderRadius: 999,
    borderWidth: 1,
    padding: 4,
    gap: 4,
    marginBottom: 12,
  },
  modeBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    borderRadius: 999,
  },
  modeText: { fontSize: 14, fontWeight: '800' },
  card: {
    borderRadius: 22,
    borderWidth: 1,
    padding: Spacing.four,
    gap: 8,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 6,
  },
  label: { marginTop: 6, fontSize: 13, fontWeight: '700' },
  input: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: Platform.select({ ios: 14, default: 10 }),
    fontSize: 16,
  },
  hint: { fontSize: 12, marginTop: 2 },
  banner: {
    borderWidth: 1,
    borderRadius: 12,
    padding: Spacing.three,
    marginTop: Spacing.two,
  },
  submit: {
    marginTop: Spacing.three,
    minHeight: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.35,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  submitText: {
    fontSize: 15,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  legal: { marginTop: Spacing.three, textAlign: 'center', lineHeight: 18, fontSize: 12 },
});
