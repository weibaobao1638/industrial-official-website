import Link from 'next/link';
import type { Locale } from '@/lib/constants/site';
import { getDictionary } from '@/lib/i18n/locale';
import { Container } from '@/components/ui/container';
import { LocaleSwitcher } from '@/components/layout/locale-switcher';
import type { SiteSettings } from '@/features/site/api';

export function SiteHeader({ locale, settings }: { locale: Locale; settings: SiteSettings }) {
  const dict = getDictionary(locale);

  const nav = [
    { href: `/${locale}`, label: dict.nav.home },
    { href: `/${locale}/about`, label: dict.nav.about },
    { href: `/${locale}/products`, label: dict.nav.products },
    { href: `/${locale}/industries`, label: dict.nav.industries },
    { href: `/${locale}/cases`, label: dict.nav.cases },
    { href: `/${locale}/blog`, label: dict.nav.blog },
    { href: `/${locale}/contact`, label: dict.nav.contact },
  ];

  return (
    <header className="site-header">
      <Container>
        <div className="site-header__inner">
          <Link href={`/${locale}`} className="site-brand">
            {settings.logoUrl ? (
              <span className="site-brand__logo">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={settings.logoUrl} alt={settings.siteName} />
              </span>
            ) : null}
            <strong>{settings.siteName || dict.common.tagline}</strong>
          </Link>
          <nav className="site-nav" aria-label="Main navigation">
            {nav.map((item) => (
              <Link key={item.href} href={item.href}>{item.label}</Link>
            ))}
            <Link className="button button--primary" href={`/${locale}/quote`}>
              {dict.common.getQuote}
            </Link>
            <LocaleSwitcher locale={locale} />
          </nav>
        </div>
      </Container>
    </header>
  );
}
