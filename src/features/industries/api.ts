import type { Locale } from '@/lib/constants/site';
import { directusItemsRequest } from '@/lib/directus/client';
import { getLocalizedField } from '@/lib/i18n/translated';
import type { DirectusIndustryItem } from '@/types/directus';

export type IndustryCard = {
  slug: string;
  name: string;
  summary: string;
  content?: string;
};

const INDUSTRY_FIELDS = [
  'id',
  'slug_zh',
  'slug_en',
  'name_zh',
  'name_en',
  'summary_zh',
  'summary_en',
  'solution_content_zh',
  'solution_content_en',
  'status',
].join(',');

const fallbackIndustries: IndustryCard[] = [
  {
    slug: 'water-treatment',
    name: 'Water Treatment',
    summary: 'Solutions for piping, valves, and system reliability.',
    content:
      'Water treatment projects require stable material selection, reliable sealing performance, and predictable long-term maintenance.\n\nThis solution page can guide buyers from application needs to product selection and project references.',
  },
  {
    slug: 'construction',
    name: 'Construction',
    summary: 'Materials and components for durable project delivery.',
    content:
      'Construction projects value delivery reliability, structured specifications, and compatibility with project standards.\n\nUse this page to connect core products, specifications, and real project examples.',
  },
  {
    slug: 'manufacturing',
    name: 'Manufacturing',
    summary: 'Industrial components for stable operation and maintenance.',
    content:
      'Manufacturing buyers often compare lifecycle stability, material fit, and replacement efficiency.\n\nThis page can help communicate how your products support uptime and plant maintenance workflows.',
  },
];

function mapIndustry(item: DirectusIndustryItem, locale: Locale): IndustryCard {
  return {
    slug: locale === 'zh' ? item.slug_zh || item.slug_en || String(item.id) : item.slug_en || item.slug_zh || String(item.id),
    name: getLocalizedField(item, locale, 'name'),
    summary: getLocalizedField(item, locale, 'summary'),
    content: getLocalizedField(item, locale, 'solution_content'),
  };
}

async function fetchIndustries(params?: Record<string, unknown>) {
  try {
    return await directusItemsRequest<DirectusIndustryItem>({
      path: '/items/industries',
      params: {
        fields: INDUSTRY_FIELDS,
        sort: 'sort_order,name_en',
        filter: {
          status: { _eq: 'published' },
        },
        ...params,
      },
      tags: ['industries'],
    });
  } catch {
    return null;
  }
}

export async function getIndustries(locale: Locale) {
  const items = await fetchIndustries();
  if (items?.length) return items.map((item) => mapIndustry(item, locale));
  return fallbackIndustries;
}

export async function getIndustryDetail(locale: Locale, slug: string) {
  const items = await fetchIndustries({
    limit: 1,
    filter: {
      status: { _eq: 'published' },
      [locale === 'zh' ? 'slug_zh' : 'slug_en']: { _eq: slug },
    },
  });

  if (items?.[0]) return mapIndustry(items[0], locale);
  return fallbackIndustries.find((item) => item.slug === slug) ?? null;
}
