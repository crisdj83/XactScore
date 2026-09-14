import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { AppTopBar } from '@/components/app-top-bar';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
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
  const onAccentText = theme.isDark ? '#0f0f10' : '#ffffff';
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

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

  return (
    <ThemedView style={styles.root}>
      <AppTopBar includeSafeArea />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.formWrap}>
        <View style={styles.brand}>
          <ThemedText type="title" style={styles.logo}>
            XactScore
          </ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.tagline}>
            {t('Exact scores with friends — no ads, always free.')}
          </ThemedText>
        </View>

          <View
            style={[
              styles.modeSwitch,
              {
                backgroundColor: theme.isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9',
                borderColor: theme.border,
              },
            ]}>
            <Pressable
              onPress={() => setMode('signin')}
              style={[
                styles.modeBtn,
                mode === 'signin' && { backgroundColor: theme.accent },
              ]}>
              <ThemedText
                type="smallBold"
                style={{ color: mode === 'signin' ? onAccentText : theme.textSecondary }}>
                {t('Sign In')}
              </ThemedText>
            </Pressable>
            <Pressable
              onPress={() => setMode('signup')}
              style={[
                styles.modeBtn,
                mode === 'signup' && { backgroundColor: theme.accent },
              ]}>
              <ThemedText
                type="smallBold"
                style={{ color: mode === 'signup' ? onAccentText : theme.textSecondary }}>
                {t('Sign Up')}
              </ThemedText>
            </Pressable>
          </View>

          <View
            style={[
              styles.card,
              {
                backgroundColor: theme.backgroundElement,
                borderColor: theme.border,
              },
            ]}>
            <ThemedText type="smallBold" style={styles.label}>
              {t('Email')}
            </ThemedText>
            <TextInput
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              placeholder="you@example.com"
              placeholderTextColor={theme.textSecondary}
              value={email}
              onChangeText={setEmail}
              style={[styles.input, { color: theme.text, borderColor: theme.borderStrong }]}
            />

            <ThemedText type="smallBold" style={styles.label}>
              {t('Password')}
            </ThemedText>
            <TextInput
              secureTextEntry
              autoComplete={mode === 'signin' ? 'password' : 'new-password'}
              placeholder="••••••••"
              placeholderTextColor={theme.textSecondary}
              value={password}
              onChangeText={setPassword}
              style={[styles.input, { color: theme.text, borderColor: theme.borderStrong }]}
            />
            <ThemedText type="small" themeColor="textSecondary">
              {t('Password must be at least 6 characters.')}
            </ThemedText>

            {message ? (
              <View
                style={[
                  styles.banner,
                  {
                    backgroundColor: isError ? `${theme.danger}22` : `${theme.success}22`,
                    borderColor: isError ? theme.danger : theme.success,
                  },
                ]}>
                <ThemedText type="small" style={{ color: isError ? theme.danger : theme.success }}>
                  {message}
                </ThemedText>
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
                },
              ]}>
              {busy ? (
                <ActivityIndicator color={onAccentText} />
              ) : (
                <ThemedText type="smallBold" style={[styles.submitText, { color: onAccentText }]}>
                  {mode === 'signin' ? t('Sign In') : t('Sign Up')}
                </ThemedText>
              )}
            </Pressable>

            <ThemedText type="small" themeColor="textSecondary" style={styles.legal}>
              {mode === 'signup'
                ? t('By signing up you agree to our')
                : t('See our')}{' '}
              <ThemedText
                type="smallBold"
                style={{ color: theme.accent }}
                onPress={() => void Linking.openURL(`${legalBase()}/privacy`)}>
                {t('Privacy Policy')}
              </ThemedText>
              {' · '}
              <ThemedText
                type="smallBold"
                style={{ color: theme.accent }}
                onPress={() => void Linking.openURL(`${legalBase()}/terms`)}>
                {t('Terms of Use')}
              </ThemedText>
            </ThemedText>
          </View>
        </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  formWrap: {
    flex: 1,
    justifyContent: 'center',
    gap: Spacing.four,
    paddingHorizontal: Spacing.four,
  },
  brand: { alignItems: 'center', gap: Spacing.two },
  logo: { fontSize: 40, lineHeight: 44, fontWeight: '800' },
  tagline: { textAlign: 'center', maxWidth: 280 },
  modeSwitch: {
    flexDirection: 'row',
    borderRadius: 999,
    borderWidth: 1,
    padding: 4,
    gap: 4,
  },
  modeBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    borderRadius: 999,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: Spacing.four,
    gap: Spacing.two,
  },
  label: { marginTop: Spacing.one },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: Platform.select({ ios: 14, default: 10 }),
    fontSize: 16,
  },
  banner: {
    borderWidth: 1,
    borderRadius: 12,
    padding: Spacing.three,
    marginTop: Spacing.two,
  },
  submit: {
    marginTop: Spacing.three,
    minHeight: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitText: { textTransform: 'uppercase', letterSpacing: 1 },
  legal: { marginTop: Spacing.three, textAlign: 'center', lineHeight: 18 },
});
