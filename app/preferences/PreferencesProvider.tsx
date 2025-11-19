import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { useColorScheme } from 'react-native';
import { ThemeMode } from '../theme/types';
import { languageOptions } from '../i18n/locales';
import { LanguageCode } from '../i18n/types';

type ThemePreference = ThemeMode | 'system';

type PreferencesContextValue = {
  themePreference: ThemePreference;
  resolvedThemeMode: ThemeMode;
  setThemePreference: (pref: ThemePreference) => Promise<void>;
  toggleTheme: () => Promise<void>;
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => Promise<void>;
  availableLanguages: typeof languageOptions;
};

const THEME_KEY = 'pref.theme';
const LANGUAGE_KEY = 'pref.language';

const PreferencesContext = createContext<PreferencesContextValue | undefined>(undefined);

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [themePreference, setThemePreferenceState] = useState<ThemePreference>('system');
  const [language, setLanguageState] = useState<LanguageCode>('en');

  useEffect(() => {
    (async () => {
      try {
        const storedTheme = await SecureStore.getItemAsync(THEME_KEY);
        if (storedTheme === 'light' || storedTheme === 'dark' || storedTheme === 'system') {
          setThemePreferenceState(storedTheme);
        }
      } catch (error) {
        // Non-blocking: ignore read errors
      }
      try {
        const storedLanguage = await SecureStore.getItemAsync(LANGUAGE_KEY);
        if (storedLanguage === 'en' || storedLanguage === 'de') {
          setLanguageState(storedLanguage);
        }
      } catch (error) {
        // Ignore read errors
      }
    })();
  }, []);

  const resolvedThemeMode: ThemeMode = useMemo(() => {
    if (themePreference === 'system') {
      return systemScheme === 'dark' ? 'dark' : 'light';
    }
    return themePreference;
  }, [themePreference, systemScheme]);

  const updateThemePreference = useCallback(async (pref: ThemePreference) => {
    setThemePreferenceState(pref);
    try {
      if (pref === 'system') {
        await SecureStore.deleteItemAsync(THEME_KEY);
      } else {
        await SecureStore.setItemAsync(THEME_KEY, pref);
      }
    } catch (error) {
      // Preference persistence is best-effort; ignore storage failures
    }
  }, []);

  const toggleTheme = useCallback(async () => {
    const next: ThemePreference = resolvedThemeMode === 'dark' ? 'light' : 'dark';
    await updateThemePreference(next);
  }, [resolvedThemeMode, updateThemePreference]);

  const updateLanguage = useCallback(async (lang: LanguageCode) => {
    setLanguageState(lang);
    try {
      await SecureStore.setItemAsync(LANGUAGE_KEY, lang);
    } catch (error) {
      // Ignore persistence errors
    }
  }, []);

  const value = useMemo(
    () => ({
      themePreference,
      resolvedThemeMode,
      setThemePreference: updateThemePreference,
      toggleTheme,
      language,
      setLanguage: updateLanguage,
      availableLanguages: languageOptions,
    }),
    [themePreference, resolvedThemeMode, updateThemePreference, toggleTheme, language, updateLanguage]
  );

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences() {
  const ctx = useContext(PreferencesContext);
  if (!ctx) {
    throw new Error('usePreferences must be used within PreferencesProvider');
  }
  return ctx;
}

export type { ThemePreference };
