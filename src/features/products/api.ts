import { mapProductCard, mapProductDetail } from '@/features/products/mapper';
import type { ProductCard, ProductDetail } from '@/features/products/types';
import type { Locale } from '@/lib/constants/site';
import { getDirectusAssetUrl } from '@/lib/directus/assets';
import { directusItemsRequest } from '@/lib/directus/client';
import { getLocalizedField } from '@/lib/i18n/translated';
import type { DirectusProductItem } from '@/types/directus';

const PRODUCT_FIELDS = [
  'id',
  'product_code',
  'slug_zh',
  'slug_en',
  'name_zh',
  'name_en',
  'summary_zh',
  'summary_en',
  'description_zh',
  'description_en',
  'features_zh',
  'features_en',
  'applications_zh',
  'applications_en',
  'material',
  'specification',
  'cover_image.id',
  'is_featured',
  'status',
  'sort_order',
  'category_level_1.slug_zh',
  'category_level_1.slug_en',
  'category_level_1.name_zh',
  'category_level_1.name_en',
].join(',');

const fallbackProducts: ProductDetail[] = [
  mapProductDetail({
    id: 'pipe-001',
    productCode: 'PIPE-001',
    category: 'pipes',
    categoryLabel: 'Pipes',
    slug: 'stainless-steel-pipe',
    name: 'Stainless Steel Pipe',
    summary: 'Corrosion-resistant industrial piping for multiple export-grade applications.',
    description:
      'Designed for export-grade industrial scenarios where corrosion resistance, stable sizing, and long service life are required.',
    material: 'Stainless Steel',
    specification: 'DN20-DN300 / SCH10-SCH40',
    features: ['Corrosion resistant', 'Stable quality', 'OEM/ODM support'],
    applications: ['Water treatment', 'Construction', 'Industrial manufacturing'],
  }),
  mapProductDetail({
    id: 'valve-001',
    productCode: 'VALVE-001',
    category: 'valves',
    categoryLabel: 'Valves',
    slug: 'industrial-gate-valve',
    name: 'Industrial Gate Valve',
    summary: 'Reliable flow-control valve for industrial pipe systems.',
    description: 'A standard industrial control valve suitable for stable shutoff and flow-control scenarios.',
    material: 'Carbon Steel',
    specification: 'Class 150 / PN16',
  }),
  mapProductDetail({
    id: 'fitting-001',
    productCode: 'FITTING-001',
    category: 'fittings',
    categoryLabel: 'Fittings',
    slug: 'pipe-fitting-elbow',
    name: 'Pipe Fitting Elbow',
    summary: 'Durable elbow fitting for stable industrial piping connections.',
    description: 'Pipe elbow fitting for route changes in pressure-bearing and utility piping systems.',
    material: 'Stainless Steel / Carbon Steel',
    specification: '45° / 90°',
  }),
];

function parseTextList(value: string | string[] | undefined): string[] {
  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }

  if (typeof value === 'string') {
    return value
      .split(/\r?\n|;|\|/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function resolveCategorySlug(item: DirectusProductItem, locale: Locale): string {
  const category = item.category_level_1;

  if (typeof category === 'string') {
    return category;
  }

  return locale === 'zh'
    ? category?.slug_zh || category?.slug_en || 'general'
    : category?.slug_en || category?.slug_zh || 'general';
}

function resolveCategoryLabel(item: DirectusProductItem, locale: Locale): string {
  const category = item.category_level_1;

  if (typeof category === 'string') {
    return category;
  }

  return locale === 'zh'
    ? category?.name_zh || category?.name_en || '分类'
    : category?.name_en || category?.name_zh || 'Category';
}

function resolveProductSlug(item: DirectusProductItem, locale: Locale): string {
  return locale === 'zh' ? item.slug_zh || item.slug_en || String(item.id) : item.slug_en || item.slug_zh || String(item.id);
}

function mapDirectusProductCard(item: DirectusProductItem, locale: Locale): ProductCard {
  const imageUrl =
    typeof item.cover_image === 'string'
      ? getDirectusAssetUrl(item.cover_image)
      : getDirectusAssetUrl(item.cover_image?.id);

  return mapProductCard({
    id: String(item.id),
    productCode: item.product_code,
    category: resolveCategorySlug(item, locale),
    categoryLabel: resolveCategoryLabel(item, locale),
    slug: resolveProductSlug(item, locale),
    name: getLocalizedField(item, locale, 'name'),
    summary: getLocalizedField(item, locale, 'summary'),
    imageUrl,
  });
}

function mapDirectusProductDetail(item: DirectusProductItem, locale: Locale): ProductDetail {
  return mapProductDetail({
    ...mapDirectusProductCard(item, locale),
    description: getLocalizedField(item, locale, 'description'),
    material: item.material,
    specification: item.specification,
    features: parseTextList(locale === 'zh' ? item.features_zh : item.features_en),
    applications: parseTextList(locale === 'zh' ? item.applications_zh : item.applications_en),
  });
}

async function fetchProducts(params?: Record<string, unknown>) {
  try {
    return await directusItemsRequest<DirectusProductItem>({
      path: '/items/products',
      params: {
        fields: PRODUCT_FIELDS,
        sort: 'sort_order,name_en',
        filter: {
          status: { _eq: 'published' },
        },
        ...params,
      },
      tags: ['products'],
    });
  } catch {
    return null;
  }
}

export async function getFeaturedProducts(locale: Locale): Promise<ProductCard[]> {
  const items = await fetchProducts({
    limit: 3,
    filter: {
      status: { _eq: 'published' },
      is_featured: { _eq: true },
    },
  });

  if (items?.length) {
    return items.map((item) => mapDirectusProductCard(item, locale));
  }

  return fallbackProducts.slice(0, 3).map(mapProductCard);
}

export async function getProductList(locale: Locale, category?: string): Promise<ProductCard[]> {
  const filter = category
    ? {
        status: { _eq: 'published' },
        category_level_1: {
          [locale === 'zh' ? 'slug_zh' : 'slug_en']: { _eq: category },
        },
      }
    : {
        status: { _eq: 'published' },
      };

  const items = await fetchProducts({ filter });

  if (items?.length) {
    return items.map((item) => mapDirectusProductCard(item, locale));
  }

  if (!category) return fallbackProducts.map(mapProductCard);
  return fallbackProducts.filter((item) => item.category === category).map(mapProductCard);
}

export async function getProductDetail(locale: Locale, category: string, slug: string): Promise<ProductDetail | null> {
  const items = await fetchProducts({
    limit: 1,
    filter: {
      status: { _eq: 'published' },
      category_level_1: {
        [locale === 'zh' ? 'slug_zh' : 'slug_en']: { _eq: category },
      },
      [locale === 'zh' ? 'slug_zh' : 'slug_en']: { _eq: slug },
    },
  });

  if (items?.[0]) {
    return mapDirectusProductDetail(items[0], locale);
  }

  return fallbackProducts.find((item) => item.category === category && item.slug === slug) ?? null;
}
