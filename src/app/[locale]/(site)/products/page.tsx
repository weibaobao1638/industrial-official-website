import Link from 'next/link';
import { ContentCard } from '@/components/ui/content-card';
import { PageHero } from '@/components/ui/page-hero';
import { Section } from '@/components/ui/section';
import { getProductList } from '@/features/products/api';
import { buildMetadata } from '@/lib/seo/metadata';
import { isLocale } from '@/lib/i18n/locale';
import { formatSlugLabel } from '@/lib/utils/format';
import { notFound } from 'next/navigation';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return buildMetadata({
    locale,
    title: locale === 'zh' ? '产品中心' : 'Products',
    description: locale === 'zh' ? '浏览产品分类与详情。' : 'Browse product categories and details.',
    path: '/products',
  });
}

export default async function ProductsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const products = await getProductList(locale);
  const categories = [...new Set(products.map((product) => product.category))];

  return (
    <>
      <PageHero
        eyebrow="Products"
        title={locale === 'zh' ? '产品中心' : 'Products'}
        description={
          locale === 'zh'
            ? '以结构化方式展示产品分类、参数说明、应用场景与询价入口。'
            : 'Structured product listings with specifications, applications, and conversion-ready inquiry paths.'
        }
        actions={
          <div className="chip-list">
            {categories.map((category) => (
              <Link className="chip" key={category} href={`/${locale}/products/${category}`}>
                {formatSlugLabel(category)}
              </Link>
            ))}
          </div>
        }
      />

      <Section eyebrow="Catalog" title={locale === 'zh' ? '全部产品' : 'All Products'}>
        <div className="grid grid--3">
          {products.map((product) => (
            <ContentCard
              key={product.id}
              eyebrow={product.categoryLabel || formatSlugLabel(product.category)}
              title={product.name}
              description={product.summary}
              imageUrl={product.imageUrl}
              badges={product.productCode ? [product.productCode] : undefined}
              href={`/${locale}/products/${product.category}/${product.slug}`}
              ctaLabel={locale === 'zh' ? '查看详情' : 'View Detail'}
            />
          ))}
        </div>
      </Section>
    </>
  );
}
