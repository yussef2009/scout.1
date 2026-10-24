'use client';

import { create } from 'zustand';
import en from '../i18n/en.json';
import ar from '../i18n/ar.json';

type Locale = 'en' | 'ar';

interface LocaleState {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (keyPath: string) => string;
}

const dictionaries: Record<Locale, any> = { en, ar };

export const useLocale = create<LocaleState>((set, get) => ({
  locale: 'en',
  setLocale: (locale: Locale) => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = locale;
      document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
    }
    set({ locale });
  },
  t: (keyPath: string) => {
    const { locale } = get();
    const dict = dictionaries[locale] || dictionaries.en;
    const parts = keyPath.split('.');
    let current = dict;
    for (const part of parts) {
      if (current && typeof current === 'object' && part in current) {
        current = current[part];
      } else {
        return keyPath;
      }
    }
    return typeof current === 'string' ? current : keyPath;
  },
}));
