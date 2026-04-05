import type { Metadata } from 'next';
import { DEFAULT_LOCALE, SITE_NAME, type Locale } from '@/lib/constants/site';

function getSiteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
}

type BuildMetadataInput = {
  locale: Locale;
  title: string;
  description: string;
  path?: string;
};

export function buildMetadata({ locale, title, description, path = '' }: BuildMetadataInput): Metadata {
  const siteUrl = getSiteUrl();
  const localizedPath = `/${locale}${path}`;
  const canonical = new URL(localizedPath, siteUrl).toString();

  return {
    title,
    description,
    alternates: {
      canonical,
      languages: {
        'zh-CN': new URL(`/zh${path}`, siteUrl).toString(),
        en: new URL(`/en${path}`, siteUrl).toString(),
        'x-default': new URL(`/${DEFAULT_LOCALE}${path}`, siteUrl).toString(),
      },
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: SITE_NAME[locale],
      locale: locale === 'zh' ? 'zh_CN' : 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}
