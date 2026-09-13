import { ActivityIndicator, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

import { LoginScreen } from '@/components/login-screen';
import { ThemedView } from '@/components/themed-view';
import { AuthProvider, useAuth } from '@/contexts/auth';
import { LocaleProvider } from '@/contexts/locale';
import { ThemePreferenceProvider } from '@/contexts/theme';
import { useTheme } from '@/hooks/use-theme';

SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const theme = useTheme();
  const { session, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      SplashScreen.hideAsync();
    }
  }, [loading]);

  if (loading) {
    return (
      <ThemedView style={styles.loading}>
        <ActivityIndicator size="large" color={theme.accent} />
      </ThemedView>
    );
  }

  if (!session) {
    return (
      <>
        <StatusBar style={theme.isDark ? 'light' : 'dark'} />
        <LoginScreen />
      </>
    );
  }

  return (
    <>
      <StatusBar style={theme.isDark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="contest/[id]" />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <ThemePreferenceProvider>
      <LocaleProvider>
        <AuthProvider>
          <RootNavigator />
        </AuthProvider>
      </LocaleProvider>
    </ThemePreferenceProvider>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
