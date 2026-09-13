import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { NativeModules, Platform } from 'react-native';

import {
  LOCALE_STORAGE_KEY,
  defaultLocale,
  isLocale,
  translate,
  type Locale,
} from '@/lib/i18n';

type LocaleContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
};

const LocaleContext = createContext<LocaleContextValue | undefined>(undefined);

function deviceLocale(): Locale {
  try {
    const raw =
      Platform.OS === 'ios'
        ? NativeModules.SettingsManager?.settings?.AppleLocale ||
          NativeModules.SettingsManager?.settings?.AppleLanguages?.[0]
        : NativeModules.I18nManager?.localeIdentifier;
    const code = String(raw || 'en').toLowerCase().slice(0, 2);
    if (isLocale(code)) return code;
  } catch {
    // ignore
  }
  return defaultLocale;
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale);

  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem(LOCALE_STORAGE_KEY).then((value) => {
      if (!mounted) return;
      if (isLocale(value)) {
        setLocaleState(value);
      } else {
        setLocaleState(deviceLocale());
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    void AsyncStorage.setItem(LOCALE_STORAGE_KEY, next);
  }, []);

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      setLocale,
      t: (key: string) => translate(locale, key),
    }),
    [locale, setLocale]
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error('useLocale must be used within LocaleProvider');
  }
  return ctx;
}

export function useTranslations() {
  return useLocale().t;
}
