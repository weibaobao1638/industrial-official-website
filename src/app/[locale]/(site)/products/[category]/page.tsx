import Link from 'next/link';
import { Breadcrumbs } from '@/components/layout/breadcrumbs';
import { ContentCard } from '@/components/ui/content-card';
import { PageHero } from '@/components/ui/page-hero';
import { Section } from '@/components/ui/section';
import { getProductList } from '@/features/products/api';
import { buildMetadata } from '@/lib/seo/metadata';
import { isLocale } from '@/lib/i18n/locale';
import { formatSlugLabel } from '@/lib/utils/format';
import { notFound } from 'next/navigation';

export async function generateMetadata({ params }: { params: Promise<{ locale: string; category: string }> }) {
  const { locale, category } = await params;
  if (!isLocale(locale)) return {};
  return buildMetadata({
    locale,
    title: locale === 'zh' ? `${category} | 产品中心` : `${category} | Products`,
    description: locale === 'zh' ? `浏览 ${category} 分类产品。` : `Browse ${category} products.`,
    path: `/products/${category}`,
  });
}

export default async function ProductCategoryPage({ params }: { params: Promise<{ locale: string; category: string }> }) {
  const { locale, category } = await params;
  if (!isLocale(locale)) notFound();

  const products = await getProductList(locale, category);
  const label = formatSlugLabel(category);
  const t =
    locale === 'zh'
      ? { home: '首页', products: '产品中心', category: '分类', back: '返回产品中心', title: '分类产品', detail: '查看详情' }
      : { home: 'Home', products: 'Products', category: 'Category', back: 'Back to Products', title: 'Category Products', detail: 'View Detail' };

  return (
    <>
      <PageHero
        eyebrow={t.category}
        title={label}
        description={
          locale === 'zh'
            ? `浏览 ${label} 分类下的产品与规格说明。`
            : `Browse products and specification-focused detail pages in the ${label} category.`
        }
        actions={
          <>
            <Breadcrumbs
              items={[
                { label: t.home, href: `/${locale}` },
                { label: t.products, href: `/${locale}/products` },
                { label },
              ]}
            />
            <Link className="button button--ghost" href={`/${locale}/products`}>{t.back}</Link>
          </>
        }
      />
      <Section eyebrow={t.products} title={t.title}>
        <div className="grid grid--3">
          {products.map((product) => (
            <ContentCard
              key={product.id}
              eyebrow={product.categoryLabel || label}
              title={product.name}
              description={product.summary}
              imageUrl={product.imageUrl}
              badges={product.productCode ? [product.productCode] : undefined}
              href={`/${locale}/products/${product.category}/${product.slug}`}
              ctaLabel={t.detail}
            />
          ))}
        </div>
      </Section>
    </>
  );
}
