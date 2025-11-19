import { useCallback } from 'react';
import { translations, languageOptions } from './locales';
import { LanguageCode } from './types';
import { usePreferences } from '../preferences/PreferencesProvider';

export function useTranslations() {
  const { language } = usePreferences();

  const t = useCallback(
    (key: string) => {
      return translations[language]?.[key] ?? translations.en[key] ?? key;
    },
    [language]
  );

  return { t, language };
}

export { languageOptions };
export type { LanguageCode };
