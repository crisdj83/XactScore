import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SystemUI from 'expo-system-ui';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useColorScheme as useSystemColorScheme } from 'react-native';

import {
  Colors,
  THEME_STORAGE_KEY,
  type ResolvedTheme,
  type ThemePreference,
} from '@/constants/theme';

type ThemeContextValue = {
  preference: ThemePreference;
  resolved: ResolvedTheme;
  isDark: boolean;
  colors: (typeof Colors)[ResolvedTheme];
  setPreference: (next: ThemePreference) => void;
  toggle: () => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function normalizeStored(value: string | null): ThemePreference {
  if (value === 'light' || value === 'dark' || value === 'system') return value;
  return 'system';
}

export function ThemePreferenceProvider({ children }: { children: ReactNode }) {
  const system = useSystemColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>('system');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem(THEME_STORAGE_KEY)
      .then((value) => {
        if (!mounted) return;
        if (value == null) {
          setPreferenceState('system');
          return;
        }
        setPreferenceState(normalizeStored(value));
      })
      .finally(() => {
        if (mounted) setReady(true);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const resolved: ResolvedTheme =
    preference === 'system' ? (system === 'light' ? 'light' : 'dark') : preference;

  const setPreference = useCallback((next: ThemePreference) => {
    setPreferenceState(next);
    void AsyncStorage.setItem(THEME_STORAGE_KEY, next);
  }, []);

  const toggle = useCallback(() => {
    setPreference(resolved === 'dark' ? 'light' : 'dark');
  }, [resolved, setPreference]);

  useEffect(() => {
    if (!ready) return;
    void SystemUI.setBackgroundColorAsync(Colors[resolved].background);
  }, [ready, resolved]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      preference,
      resolved,
      isDark: resolved === 'dark',
      colors: Colors[resolved],
      setPreference,
      toggle,
    }),
    [preference, resolved, setPreference, toggle]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useThemePreference() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useThemePreference must be used within ThemePreferenceProvider');
  }
  return ctx;
}
