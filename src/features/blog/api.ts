import type { Locale } from '@/lib/constants/site';
import { directusItemsRequest } from '@/lib/directus/client';
import { getLocalizedField } from '@/lib/i18n/translated';
import type { DirectusBlogItem } from '@/types/directus';

export type BlogPostCard = {
  slug: string;
  category: string;
  title: string;
  excerpt: string;
  content?: string;
};

const BLOG_FIELDS = [
  'id',
  'slug_zh',
  'slug_en',
  'title_zh',
  'title_en',
  'excerpt_zh',
  'excerpt_en',
  'content_zh',
  'content_en',
  'category_id.slug_zh',
  'category_id.slug_en',
  'category_id.name_zh',
  'category_id.name_en',
  'status',
].join(',');

const fallbackPosts: BlogPostCard[] = [
  {
    slug: 'how-to-choose-industrial-pipes',
    category: 'product-knowledge',
    title: 'How to Choose Industrial Pipes',
    excerpt: 'A practical framework for selecting pipes by material, pressure, and application.',
    content:
      'Start with the application, then narrow the choice by material, pressure class, temperature range, and compliance requirements.\n\nA good industrial content page should help buyers understand where the product fits, what standards matter, and which specification fields need to be confirmed before quotation.',
  },
  {
    slug: 'stainless-steel-vs-carbon-steel',
    category: 'buying-guide',
    title: 'Stainless Steel vs Carbon Steel',
    excerpt: 'Understand the tradeoffs before choosing materials for export projects.',
    content:
      'Stainless steel offers stronger corrosion resistance, while carbon steel may fit cost-sensitive environments.\n\nThe right choice depends on operating conditions, lifecycle expectations, compliance requirements, and whether the buyer values lower upfront cost or lower long-term maintenance risk.',
  },
];

function mapBlog(item: DirectusBlogItem, locale: Locale): BlogPostCard {
  const category = typeof item.category_id === 'string'
    ? item.category_id
    : locale === 'zh'
      ? item.category_id?.slug_zh || item.category_id?.slug_en || 'general'
      : item.category_id?.slug_en || item.category_id?.slug_zh || 'general';

  return {
    slug: locale === 'zh' ? item.slug_zh || item.slug_en || String(item.id) : item.slug_en || item.slug_zh || String(item.id),
    category,
    title: getLocalizedField(item, locale, 'title'),
    excerpt: getLocalizedField(item, locale, 'excerpt'),
    content: getLocalizedField(item, locale, 'content'),
  };
}

async function fetchPosts(params?: Record<string, unknown>) {
  try {
    return await directusItemsRequest<DirectusBlogItem>({
      path: '/items/blog_posts',
      params: {
        fields: BLOG_FIELDS,
        sort: '-published_at',
        filter: {
          status: { _eq: 'published' },
        },
        ...params,
      },
      tags: ['blog_posts'],
    });
  } catch {
    return null;
  }
}

export async function getBlogPosts(locale: Locale, category?: string) {
  const filter = category
    ? {
        status: { _eq: 'published' },
        category_id: {
          [locale === 'zh' ? 'slug_zh' : 'slug_en']: { _eq: category },
        },
      }
    : {
        status: { _eq: 'published' },
      };

  const items = await fetchPosts({ filter });
  if (items?.length) return items.map((item) => mapBlog(item, locale));
  if (!category) return fallbackPosts;
  return fallbackPosts.filter((item) => item.category === category);
}

export async function getBlogPost(locale: Locale, slug: string) {
  const items = await fetchPosts({
    limit: 1,
    filter: {
      status: { _eq: 'published' },
      [locale === 'zh' ? 'slug_zh' : 'slug_en']: { _eq: slug },
    },
  });

  if (items?.[0]) return mapBlog(items[0], locale);
  return fallbackPosts.find((item) => item.slug === slug) ?? null;
}
