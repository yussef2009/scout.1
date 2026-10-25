'use client';

import { create } from 'zustand';
import en from '../i18n/en.json';
import ar from '../i18n/ar.json';

export type Locale = 'en' | 'ar';

interface LocaleState {
  locale: Locale;
  isRtl: boolean;
  setLocale: (l: Locale) => void;
  t: (keyPath: string) => string;
}

const dictionaries: Record<Locale, Record<string, unknown>> = { en, ar };

const getInitialLocale = (): Locale => {
  if (typeof window === 'undefined') return 'en';
  const saved = localStorage.getItem('scoutai_locale');
  if (saved === 'ar' || saved === 'en') return saved;
  return 'en';
};

export const useLocale = create<LocaleState>((set, get) => {
  const initial = getInitialLocale();

  if (typeof document !== 'undefined') {
    document.documentElement.lang = initial;
    document.documentElement.dir = initial === 'ar' ? 'rtl' : 'ltr';
  }

  return {
    locale: initial,
    isRtl: initial === 'ar',
    setLocale: (locale: Locale) => {
      if (typeof window !== 'undefined') {
        localStorage.setItem('scoutai_locale', locale);
        document.documentElement.lang = locale;
        document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
      }
      set({ locale, isRtl: locale === 'ar' });
    },
    t: (keyPath: string) => {
      const { locale } = get();
      const dict = dictionaries[locale] || dictionaries.en;
      const parts = keyPath.split('.');
      let current: unknown = dict;
      for (const part of parts) {
        if (current && typeof current === 'object' && part in (current as Record<string, unknown>)) {
          current = (current as Record<string, unknown>)[part];
        } else {
          return keyPath;
        }
      }
      return typeof current === 'string' ? current : keyPath;
    },
  };
});
