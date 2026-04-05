import type { Locale } from '@/lib/constants/site';
import { directusItemsRequest } from '@/lib/directus/client';
import { getLocalizedField } from '@/lib/i18n/translated';
import type { DirectusCaseItem } from '@/types/directus';

export type CaseCard = {
  slug: string;
  title: string;
  summary: string;
  country: string;
  background?: string;
  solution?: string;
  result?: string;
};

const CASE_FIELDS = [
  'id',
  'slug_zh',
  'slug_en',
  'title_zh',
  'title_en',
  'summary_zh',
  'summary_en',
  'background_zh',
  'background_en',
  'solution_zh',
  'solution_en',
  'result_zh',
  'result_en',
  'country_id.name_zh',
  'country_id.name_en',
  'status',
].join(',');

const fallbackCases: CaseCard[] = [
  {
    slug: 'water-system-project-uae',
    title: 'Water System Project in UAE',
    summary: 'Industrial pipe and fitting supply for a water treatment project.',
    country: 'UAE',
    background:
      'The client required stable industrial pipe supply for a new water treatment system with tight delivery coordination and clear technical matching.',
    solution:
      'We prepared product sets aligned with the installation plan, export schedule, and documentation requirements so the project team could review and procure faster.',
    result:
      'The delivered solution met project timing needs and reduced friction during on-site implementation and handover.',
  },
  {
    slug: 'factory-upgrade-thailand',
    title: 'Factory Upgrade in Thailand',
    summary: 'Mechanical components and valves for production line upgrades.',
    country: 'Thailand',
    background:
      'The factory required upgraded components to improve production-line reliability and simplify maintenance planning.',
    solution:
      'Valves and mechanical parts were matched to the plant operating environment with a clearer product package for technical review.',
    result:
      'The upgrade reduced downtime pressure and gave the site team a cleaner maintenance replacement path.',
  },
];

function mapCase(item: DirectusCaseItem, locale: Locale): CaseCard {
  const country = typeof item.country_id === 'string'
    ? item.country_id
    : locale === 'zh'
      ? item.country_id?.name_zh || item.country_id?.name_en || ''
      : item.country_id?.name_en || item.country_id?.name_zh || '';

  return {
    slug: locale === 'zh' ? item.slug_zh || item.slug_en || String(item.id) : item.slug_en || item.slug_zh || String(item.id),
    title: getLocalizedField(item, locale, 'title'),
    summary: getLocalizedField(item, locale, 'summary'),
    country,
    background: getLocalizedField(item, locale, 'background'),
    solution: getLocalizedField(item, locale, 'solution'),
    result: getLocalizedField(item, locale, 'result'),
  };
}

async function fetchCases(params?: Record<string, unknown>) {
  try {
    return await directusItemsRequest<DirectusCaseItem>({
      path: '/items/case_studies',
      params: {
        fields: CASE_FIELDS,
        sort: 'sort_order,title_en',
        filter: {
          status: { _eq: 'published' },
        },
        ...params,
      },
      tags: ['case_studies'],
    });
  } catch {
    return null;
  }
}

export async function getCaseList(locale: Locale) {
  const items = await fetchCases();
  if (items?.length) return items.map((item) => mapCase(item, locale));
  return fallbackCases;
}

export async function getCaseDetail(locale: Locale, slug: string) {
  const items = await fetchCases({
    limit: 1,
    filter: {
      status: { _eq: 'published' },
      [locale === 'zh' ? 'slug_zh' : 'slug_en']: { _eq: slug },
    },
  });

  if (items?.[0]) return mapCase(items[0], locale);
  return fallbackCases.find((item) => item.slug === slug) ?? null;
}
