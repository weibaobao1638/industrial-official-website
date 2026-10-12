import Image from 'next/image';
import Link from 'next/link';
import type { Locale } from '@/lib/constants/site';
import type { ProductCategory } from '@/features/products/types';
import { buildLocalizedProductCategoryPath } from '@/features/products/api';
import { getDictionary } from '@/lib/i18n/locale';
import { Container } from '@/components/ui/container';
import { LocaleSwitcher } from '@/components/layout/locale-switcher';
import type { SiteSettings } from '@/features/site/api';

export function SiteHeader({
  locale,
  settings,
  productCategories = [],
}: {
  locale: Locale;
  settings: SiteSettings;
  productCategories?: ProductCategory[];
}) {
  const dict = getDictionary(locale);

  const nav = [
    { href: `/${locale}`, label: dict.nav.home },
    { href: `/${locale}/products`, label: dict.nav.products, type: 'products' as const },
    { href: `/${locale}/about`, label: dict.nav.about },
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
                <Image
                  src={settings.logoUrl}
                  alt={settings.siteName}
                  width={settings.logoWidth ?? 120}
                  height={settings.logoHeight ?? 42}
                />
              </span>
            ) : null}
            <strong>{settings.siteName || dict.common.tagline}</strong>
          </Link>
          <nav className="site-nav" aria-label="Main navigation">
            {nav.map((item) => (
              item.type === 'products' ? (
                <div className="site-nav__group" key={item.href}>
                  <Link href={item.href}>{item.label}</Link>
                  {productCategories.length ? (
                    <div className="site-nav__dropdown">
                      <div className="site-nav__dropdown-panel">
                        {productCategories.map((category) => (
                          <Link
                            className="site-nav__dropdown-link"
                            href={buildLocalizedProductCategoryPath(locale, category.id)}
                            key={category.id}
                          >
                            {category.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : (
                <Link key={item.href} href={item.href}>{item.label}</Link>
              )
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
