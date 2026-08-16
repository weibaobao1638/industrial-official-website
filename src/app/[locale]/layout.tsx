import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';
import { getProductCategoryTree } from '@/features/products/api';
import { getSiteSettings } from '@/features/site/api';
import { isLocale } from '@/lib/i18n/locale';

export function generateStaticParams() {
  return [{ locale: 'zh' }, { locale: 'en' }];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  if (!isLocale(locale)) {
    return {};
  }

  const settings = await getSiteSettings(locale);

  return {
    title: {
      default: settings.defaultSeoTitle || settings.siteName,
      template: `%s | ${settings.siteName}`,
    },
    description: settings.defaultSeoDescription,
    icons: settings.faviconUrl
      ? {
          icon: settings.faviconUrl,
          shortcut: settings.faviconUrl,
        }
      : undefined,
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const [settings, productCategories] = await Promise.all([getSiteSettings(locale), getProductCategoryTree(locale)]);

  return (
    <>
      <SiteHeader locale={locale} settings={settings} productCategories={productCategories} />
      <main>{children}</main>
      <SiteFooter locale={locale} settings={settings} />
    </>
  );
}
