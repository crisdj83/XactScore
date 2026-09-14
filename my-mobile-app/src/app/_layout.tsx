import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AppChrome } from '@/components/app-chrome';
import { BrandSplash } from '@/components/brand-splash';
import { LoginScreen } from '@/components/login-screen';
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
      SplashScreen.hideAsync().catch(() => undefined);
    }
  }, [loading]);

  if (loading) {
    return (
      <>
        <StatusBar style="light" />
        <BrandSplash />
      </>
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
      <AppChrome>
        <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="contest/[id]" />
          <Stack.Screen name="help" />
          <Stack.Screen name="admin" />
        </Stack>
      </AppChrome>
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <ThemePreferenceProvider>
        <LocaleProvider>
          <AuthProvider>
            <RootNavigator />
          </AuthProvider>
        </LocaleProvider>
      </ThemePreferenceProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
