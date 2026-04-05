import type { Locale } from '@/lib/constants/site';

export function getLocalizedField<T extends Record<string, unknown>>(
  item: T,
  locale: Locale,
  baseName: string,
): string {
  const localizedKey = `${baseName}_${locale}` as keyof T;
  const fallbackKey = `${baseName}_${locale === 'zh' ? 'en' : 'zh'}` as keyof T;
  const localizedValue = item[localizedKey];
  const fallbackValue = item[fallbackKey];

  if (typeof localizedValue === 'string' && localizedValue.trim()) {
    return localizedValue;
  }

  if (typeof fallbackValue === 'string' && fallbackValue.trim()) {
    return fallbackValue;
  }

  return '';
}
