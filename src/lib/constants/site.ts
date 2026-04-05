export const SUPPORTED_LOCALES = ['zh', 'en'] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'en';

export const SITE_NAME = {
  zh: '工业企业官网',
  en: 'Industrial Official Website',
} as const;
