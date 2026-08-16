import { mapProductCard, mapProductDetail } from '@/features/products/mapper';
import type { ProductCard, ProductCategory, ProductDetail } from '@/features/products/types';
import type { Locale } from '@/lib/constants/site';
import { getDirectusAssetUrl } from '@/lib/directus/assets';
import { directusItemsRequest } from '@/lib/directus/client';
import { getLocalizedField } from '@/lib/i18n/translated';
import { formatSlugLabel } from '@/lib/utils/format';
import type { DirectusProductCategoryItem, DirectusProductCategoryRef, DirectusProductItem } from '@/types/directus';

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
  'category_level_1.id',
  'category_level_1.slug_zh',
  'category_level_1.slug_en',
  'category_level_1.name_zh',
  'category_level_1.name_en',
  'category_level_2.id',
  'category_level_2.slug_zh',
  'category_level_2.slug_en',
  'category_level_2.name_zh',
  'category_level_2.name_en',
].join(',');

const PRODUCT_CATEGORY_FIELDS = [
  'id',
  'name_zh',
  'name_en',
  'slug_zh',
  'slug_en',
  'description_zh',
  'description_en',
  'status',
  'sort_order',
  'parent_id',
].join(',');

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

function resolveCategoryRef(value?: string | DirectusProductCategoryRef | number | null): DirectusProductCategoryRef | null {
  if (!value || typeof value === 'string' || typeof value === 'number') {
    return null;
  }

  return value;
}

function resolveCategoryId(value?: string | DirectusProductCategoryRef | number | null): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === 'string' || typeof value === 'number') {
    const normalized = String(value).trim();
    return normalized || null;
  }

  const normalized = String(value.id ?? '').trim();
  return normalized || null;
}

function resolveLocalizedCategorySlug(
  value: string | DirectusProductCategoryRef | number | null | undefined,
  locale: Locale,
  fallback?: string,
): string | undefined {
  if (typeof value === 'string') {
    return value || fallback;
  }

  if (typeof value === 'number') {
    return String(value);
  }

  const slug =
    locale === 'zh'
      ? value?.slug_zh || value?.slug_en
      : value?.slug_en || value?.slug_zh;

  return slug || fallback;
}

function resolveLocalizedCategoryLabel(
  value: string | DirectusProductCategoryRef | number | null | undefined,
  locale: Locale,
  fallback?: string,
): string | undefined {
  if (typeof value === 'string') {
    return value || fallback;
  }

  if (typeof value === 'number') {
    return String(value);
  }

  const label =
    locale === 'zh'
      ? value?.name_zh || value?.name_en
      : value?.name_en || value?.name_zh;

  return label || fallback;
}

function resolveCategorySlug(item: DirectusProductItem, locale: Locale): string {
  return locale === 'zh'
    ? resolveLocalizedCategorySlug(item.category_level_1, locale, 'general') || 'general'
    : resolveLocalizedCategorySlug(item.category_level_1, locale, 'general') || 'general';
}

function resolveCategoryLabel(item: DirectusProductItem, locale: Locale): string {
  return resolveLocalizedCategoryLabel(item.category_level_1, locale, locale === 'zh' ? '分类' : 'Category')
    || (locale === 'zh' ? '分类' : 'Category');
}

function resolveSubcategorySlug(item: DirectusProductItem, locale: Locale): string | undefined {
  return resolveLocalizedCategorySlug(item.category_level_2, locale);
}

function resolveSubcategoryLabel(item: DirectusProductItem, locale: Locale): string | undefined {
  return resolveLocalizedCategoryLabel(item.category_level_2, locale);
}

function resolveProductSlug(item: DirectusProductItem, locale: Locale): string {
  return locale === 'zh' ? item.slug_zh || item.slug_en || String(item.id) : item.slug_en || item.slug_zh || String(item.id);
}

function resolveRouteCategoryId(item: DirectusProductItem): string {
  return resolveCategoryId(item.category_level_1) || resolveCategorySlug(item, 'en');
}

function resolveRouteSubcategoryId(item: DirectusProductItem): string | undefined {
  return resolveCategoryId(item.category_level_2) || resolveSubcategorySlug(item, 'en');
}

type ProductPathInput = Pick<ProductCard, 'id' | 'category'>;

export function buildProductDetailPath(product: ProductPathInput): string {
  return `/product/${product.category}/${product.id}`;
}

export function buildLocalizedProductDetailPath(locale: Locale, product: ProductPathInput): string {
  return `/${locale}${buildProductDetailPath(product)}`;
}

export function buildProductCategoryPath(level1Id: string, level2Id?: string): string {
  return level2Id ? `/products/${level1Id}/${level2Id}` : `/products/${level1Id}`;
}

export function buildLocalizedProductCategoryPath(locale: Locale, level1Id: string, level2Id?: string): string {
  return `/${locale}${buildProductCategoryPath(level1Id, level2Id)}`;
}

function mapDirectusProductCard(item: DirectusProductItem, locale: Locale): ProductCard {
  const imageUrl =
    typeof item.cover_image === 'string'
      ? getDirectusAssetUrl(item.cover_image)
      : getDirectusAssetUrl(item.cover_image?.id);

  return mapProductCard({
    id: String(item.id),
    productCode: item.product_code,
    category: resolveRouteCategoryId(item),
    categoryLabel: resolveCategoryLabel(item, locale),
    subcategory: resolveRouteSubcategoryId(item),
    subcategoryLabel: resolveSubcategoryLabel(item, locale),
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

function mapDirectusProductCategory(item: DirectusProductCategoryItem, locale: Locale): ProductCategory {
  const slug = resolveLocalizedCategorySlug(item, locale, String(item.id)) || String(item.id);
  const parent = resolveCategoryRef(item.parent_id);

  return {
    id: String(item.id),
    slug,
    label: resolveLocalizedCategoryLabel(item, locale, formatSlugLabel(slug)) || formatSlugLabel(slug),
    parentId: resolveCategoryId(item.parent_id),
    parentSlug: resolveLocalizedCategorySlug(parent, locale),
    parentLabel: resolveLocalizedCategoryLabel(parent, locale),
    children: [],
  };
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
      revalidate: 60,
    });
  } catch {
    return null;
  }
}

async function fetchProductCategories(params?: Record<string, unknown>) {
  try {
    return await directusItemsRequest<DirectusProductCategoryItem>({
      path: '/items/product_categories',
      params: {
        fields: PRODUCT_CATEGORY_FIELDS,
        sort: 'sort_order,name_en',
        ...params,
      },
      tags: ['product_categories'],
      revalidate: 60,
    });
  } catch {
    return null;
  }
}

function getCategorySlugField(locale: Locale) {
  return locale === 'zh' ? 'slug_zh' : 'slug_en';
}

export function getProductCategoryTrailLabel(product: Pick<ProductCard, 'category' | 'categoryLabel' | 'subcategoryLabel'>): string {
  const level1 = product.categoryLabel || formatSlugLabel(product.category);
  return product.subcategoryLabel ? `${level1} / ${product.subcategoryLabel}` : level1;
}

export function findProductLevel1Category(categories: ProductCategory[], identifier: string): ProductCategory | null {
  return categories.find((item) => item.id === identifier || item.slug === identifier) || null;
}

export function findProductLevel2Category(level1: ProductCategory | null, identifier: string): ProductCategory | null {
  if (!level1) return null;
  return level1.children.find((item) => item.id === identifier || item.slug === identifier) || null;
}

export async function getProductCategoryTree(locale: Locale): Promise<ProductCategory[]> {
  const items = await fetchProductCategories();
  if (!items?.length) return [];

  const byId = new Map<string, ProductCategory>();
  const selfParentIds = new Set<string>();
  const promotedPlaceholderIds = new Set<string>();
  const roots: ProductCategory[] = [];

  for (const item of items) {
    const mapped = mapDirectusProductCategory(item, locale);
    byId.set(mapped.id, mapped);

    if (mapped.parentId && mapped.parentId === mapped.id) {
      selfParentIds.add(mapped.id);
    }
  }

  for (const item of items) {
    const mapped = byId.get(String(item.id));
    if (!mapped?.parentId || mapped.parentId === mapped.id) continue;

    if (selfParentIds.has(mapped.parentId)) {
      promotedPlaceholderIds.add(mapped.parentId);
    }
  }

  for (const item of items) {
    const mapped = byId.get(String(item.id));
    if (!mapped) continue;

    // Some CMS data uses a self-referencing placeholder root. In that case,
    // promote its direct children to visible level-1 categories for the site.
    if (mapped.parentId && mapped.parentId !== mapped.id && byId.has(mapped.parentId) && !selfParentIds.has(mapped.parentId)) {
      byId.get(mapped.parentId)?.children.push(mapped);
      continue;
    }

    if (selfParentIds.has(mapped.id) && promotedPlaceholderIds.has(mapped.id)) {
      continue;
    }

    roots.push(mapped);
  }

  return roots;
}

export async function getFeaturedProducts(locale: Locale): Promise<ProductCard[]> {
  const featuredItems = await fetchProducts({
    limit: 3,
    filter: {
      status: { _eq: 'published' },
      is_featured: { _eq: true },
    },
  });

  if (featuredItems?.length) {
    return featuredItems.map((item) => mapDirectusProductCard(item, locale));
  }

  const items = await fetchProducts({ limit: 3 });
  return items?.map((item) => mapDirectusProductCard(item, locale)) ?? [];
}

function isNumericIdentifier(value: string) {
  return /^\d+$/.test(value);
}

export async function getProductList(locale: Locale, level1Identifier?: string, level2Identifier?: string): Promise<ProductCard[]> {
  const filter: Record<string, unknown> = {
    status: { _eq: 'published' },
  };

  if (level1Identifier) {
    filter.category_level_1 = {
      ...(isNumericIdentifier(level1Identifier)
        ? { id: { _eq: Number(level1Identifier) } }
        : { [getCategorySlugField(locale)]: { _eq: level1Identifier } }),
    };
  }

  if (level2Identifier) {
    filter.category_level_2 = {
      ...(isNumericIdentifier(level2Identifier)
        ? { id: { _eq: Number(level2Identifier) } }
        : { [getCategorySlugField(locale)]: { _eq: level2Identifier } }),
    };
  }

  const items = await fetchProducts({ filter });

  if (items?.length) {
    return items.map((item) => mapDirectusProductCard(item, locale));
  }

  return [];
}

export async function getProductDetail(locale: Locale, productId: string): Promise<ProductDetail | null> {
  const normalizedId = /^\d+$/.test(productId) ? Number(productId) : productId;

  const items = await fetchProducts({
    limit: 1,
    filter: {
      status: { _eq: 'published' },
      id: { _eq: normalizedId },
    },
  });

  if (items?.[0]) {
    return mapDirectusProductDetail(items[0], locale);
  }

  return null;
}
