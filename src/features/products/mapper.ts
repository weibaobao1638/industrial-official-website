import type { ProductCard, ProductDetail } from '@/features/products/types';

export function mapProductCard(input: Partial<ProductCard>): ProductCard {
  return {
    id: input.id ?? 'product-temp',
    productCode: input.productCode,
    category: input.category ?? 'general',
    categoryLabel: input.categoryLabel,
    slug: input.slug ?? 'product-detail',
    name: input.name ?? 'Industrial Product',
    summary: input.summary ?? 'Structured product summary for industrial applications.',
    imageUrl: input.imageUrl ?? null,
  };
}

export function mapProductDetail(input: Partial<ProductDetail>): ProductDetail {
  return {
    ...mapProductCard(input),
    description: input.description,
    features: input.features ?? ['Stable supply', 'Structured specs', 'Export-ready packaging'],
    material: input.material,
    specification: input.specification,
    applications: input.applications ?? ['Water treatment', 'Industrial piping', 'Machinery systems'],
  };
}
