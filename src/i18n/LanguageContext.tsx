// ============================================================
// PingFold AI – Language Context & i18n Hook
// Manages active language state, persistence, and dictionaries
// ============================================================
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { AnalysisLanguage } from '../types';
import { LANGUAGES, translations, type LanguageMeta, type TranslationDictionary } from './translations';

interface LanguageContextValue {
  language: AnalysisLanguage;
  setLanguage: (lang: AnalysisLanguage) => void;
  t: TranslationDictionary;
  languages: LanguageMeta[];
  currentMeta: LanguageMeta;
}

const STORAGE_KEY = 'pingfold_app_language';

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<AnalysisLanguage>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY) as AnalysisLanguage | null;
      if (saved && (saved === 'en' || saved === 'bem' || saved === 'nya')) {
        return saved;
      }
    }
    return 'en';
  });

  const setLanguage = useCallback((lang: AnalysisLanguage) => {
    setLanguageState(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, lang);
    }
  }, []);

  // Update HTML lang attribute for accessibility & styling
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = language;
    }
  }, [language]);

  const currentMeta = useMemo(() => {
    return LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];
  }, [language]);

  const t = useMemo(() => {
    return (translations[language] || translations.en) as TranslationDictionary;
  }, [language]);

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t,
      languages: LANGUAGES,
      currentMeta,
    }),
    [language, setLanguage, t, currentMeta]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useTranslation() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return ctx;
}
