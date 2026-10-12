import type { Locale } from '@/lib/constants/site';
import { getDirectusAssetUrl } from '@/lib/directus/assets';
import { directusRequest } from '@/lib/directus/client';
import { getLocalizedField } from '@/lib/i18n/translated';
import type { DirectusSiteSettingsItem } from '@/types/directus';

export type SiteSettings = {
  siteName: string;
  companyName: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  aboutImages: string[];
  email: string;
  phone: string;
  whatsapp: string;
  wechat: string;
  address: string;
  defaultSeoTitle: string;
  defaultSeoDescription: string;
};

const SITE_SETTINGS_FIELDS = [
  'id',
  'site_name_zh',
  'site_name_en',
  'company_name_zh',
  'company_name_en',
  'logo.id',
  'favicon.id',
  'about_image_1.id',
  'about_image_2.id',
  'about_image_3.id',
  'email',
  'phone',
  'whatsapp',
  'wechat',
  'address_zh',
  'address_en',
  'default_seo_title_zh',
  'default_seo_title_en',
  'default_seo_description_zh',
  'default_seo_description_en',
].join(',');

const fallbackSettings: Record<Locale, SiteSettings> = {
  zh: {
    siteName: '工业企业官网',
    companyName: '工业企业有限公司',
    logoUrl: null,
    faviconUrl: null,
    aboutImages: [],
    email: 'sales@example.com',
    phone: '+86-000-0000-0000',
    whatsapp: '+86-000-0000-0000',
    wechat: 'company-wechat',
    address: '中国 · 工业园区示例地址',
    defaultSeoTitle: '工业企业官网',
    defaultSeoDescription: '面向海内外客户的工业企业官网前台骨架。',
  },
  en: {
    siteName: 'Industrial Official Website',
    companyName: 'Industrial Company Ltd.',
    logoUrl: null,
    faviconUrl: null,
    aboutImages: [],
    email: 'sales@example.com',
    phone: '+86-000-0000-0000',
    whatsapp: '+86-000-0000-0000',
    wechat: 'company-wechat',
    address: 'Industrial Park, Example Address, China',
    defaultSeoTitle: 'Industrial Official Website',
    defaultSeoDescription: 'Bilingual industrial company website frontend skeleton.',
  },
};

function mapSiteSettings(item: DirectusSiteSettingsItem, locale: Locale): SiteSettings {
  const logoUrl =
    typeof item.logo === 'string' ? getDirectusAssetUrl(item.logo) : getDirectusAssetUrl(item.logo?.id);
  const faviconUrl =
    typeof item.favicon === 'string' ? getDirectusAssetUrl(item.favicon) : getDirectusAssetUrl(item.favicon?.id);
  const aboutImages = [item.about_image_1, item.about_image_2, item.about_image_3]
    .map((field) => getDirectusAssetUrl(typeof field === 'string' ? field : field?.id))
    .filter((url): url is string => Boolean(url));

  return {
    siteName: getLocalizedField(item, locale, 'site_name'),
    companyName: getLocalizedField(item, locale, 'company_name'),
    logoUrl,
    faviconUrl,
    aboutImages,
    email: item.email || '',
    phone: item.phone || '',
    whatsapp: item.whatsapp || '',
    wechat: item.wechat || '',
    address: getLocalizedField(item, locale, 'address'),
    defaultSeoTitle: getLocalizedField(item, locale, 'default_seo_title'),
    defaultSeoDescription: getLocalizedField(item, locale, 'default_seo_description'),
  };
}

export async function getSiteSettings(locale: Locale): Promise<SiteSettings> {
  try {
    const response = await directusRequest<{ data: DirectusSiteSettingsItem | DirectusSiteSettingsItem[] }>({
      path: '/items/site_settings',
      params: {
        fields: SITE_SETTINGS_FIELDS,
        limit: 1,
      },
      tags: ['site_settings'],
    });

    const item = Array.isArray(response?.data) ? response?.data[0] : response?.data;

    if (item) {
      return mapSiteSettings(item, locale);
    }
  } catch {
    // graceful fallback below
  }

  return fallbackSettings[locale];
}

export async function getHomepageStats(locale: Locale) {
  if (locale === 'zh') {
    return [
      { label: '出口市场', value: '30+' },
      { label: '核心产品线', value: '6' },
      { label: '年产能', value: '100K+' },
    ];
  }

  return [
    { label: 'Export Markets', value: '30+' },
    { label: 'Core Product Lines', value: '6' },
    { label: 'Annual Capacity', value: '100K+' },
  ];
}
