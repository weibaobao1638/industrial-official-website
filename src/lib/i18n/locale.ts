import { DEFAULT_LOCALE, SUPPORTED_LOCALES, type Locale } from '@/lib/constants/site';
import { dictionaries } from '@/lib/i18n/dictionaries';

export function isLocale(value: string): value is Locale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

export function normalizeLocale(value?: string): Locale {
  return value && isLocale(value) ? value : DEFAULT_LOCALE;
}

export function getDictionary(locale: Locale) {
  return dictionaries[locale];
}
