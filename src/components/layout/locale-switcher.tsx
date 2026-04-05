'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { Locale } from '@/lib/constants/site';

function swapLocale(pathname: string, locale: Locale) {
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length === 0) return `/${locale}`;
  segments[0] = locale;
  return `/${segments.join('/')}`;
}

export function LocaleSwitcher({ locale }: { locale: Locale }) {
  const pathname = usePathname() || `/${locale}`;
  const otherLocale = locale === 'zh' ? 'en' : 'zh';

  return (
    <Link className="button button--ghost" href={swapLocale(pathname, otherLocale)}>
      {otherLocale.toUpperCase()}
    </Link>
  );
}
