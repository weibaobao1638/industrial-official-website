import { DEFAULT_LOCALE, type Locale } from '@/lib/constants/site';

function parseAcceptLanguage(header: string) {
  return header
    .split(',')
    .map((part) => {
      const [tagPart, qPart] = part.trim().split(';q=');
      const tag = tagPart.toLowerCase();
      const quality = qPart ? Number(qPart) : 1;
      return { tag, quality: Number.isFinite(quality) ? quality : 0 };
    })
    .sort((a, b) => b.quality - a.quality);
}

export function detectLocaleFromHeader(acceptLanguage?: string | null): Locale {
  if (!acceptLanguage) {
    return DEFAULT_LOCALE;
  }

  const parsed = parseAcceptLanguage(acceptLanguage);

  for (const item of parsed) {
    if (item.tag.startsWith('zh')) {
      return 'zh';
    }

    if (item.tag.startsWith('en')) {
      return 'en';
    }
  }

  return DEFAULT_LOCALE;
}
