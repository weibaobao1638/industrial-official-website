import Link from 'next/link';
import { ProductCategoryNavigation } from '@/components/products/category-navigation';
import { ContentCard } from '@/components/ui/content-card';
import { PageHero } from '@/components/ui/page-hero';
import { Section } from '@/components/ui/section';
import {
  buildLocalizedProductDetailPath,
  getProductCategoryTrailLabel,
  getProductCategoryTree,
  getProductList,
} from '@/features/products/api';
import { buildMetadata } from '@/lib/seo/metadata';
import { isLocale } from '@/lib/i18n/locale';
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

  const [products, categories] = await Promise.all([getProductList(locale), getProductCategoryTree(locale)]);
  const t =
    locale === 'zh'
      ? {
          navTitle: '产品类目',
          navDescription: '左侧按一级类目和二级类目筛选，右侧展示对应产品。',
          all: '全部产品',
          catalog: '产品目录',
          allProducts: '全部产品',
          detail: '查看详情',
        }
      : {
          navTitle: 'Product Categories',
          navDescription: 'Use the category tree on the left to switch between level-1 and level-2 product groups.',
          all: 'All Products',
          catalog: 'Catalog',
          allProducts: 'All Products',
          detail: 'View Detail',
        };

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
        actions={<Link className="button button--ghost" href={`/${locale}/quote`}>{locale === 'zh' ? '获取报价' : 'Get Quote'}</Link>}
      />

      <Section eyebrow={t.catalog} title={t.allProducts}>
        <div className="product-catalog-layout">
          <aside className="product-catalog-sidebar">
            <div className="card stack-md">
              <div className="stack-sm">
                <span className="eyebrow">{locale === 'zh' ? '导航' : 'Navigation'}</span>
                <h3 className="h3">{t.navTitle}</h3>
                <p className="text-muted">{t.navDescription}</p>
              </div>
              <ProductCategoryNavigation allLabel={t.all} categories={categories} locale={locale} />
            </div>
          </aside>
          <div className="product-catalog-main">
            <div className="grid grid--3">
              {products.map((product) => (
                <ContentCard
                  key={product.id}
                  eyebrow={getProductCategoryTrailLabel(product)}
                  title={product.name}
                  description={product.summary}
                  imageUrl={product.imageUrl}
                  imageVariant="product"
                  badges={product.productCode ? [product.productCode] : undefined}
                  href={buildLocalizedProductDetailPath(locale, product)}
                  ctaLabel={t.detail}
                />
              ))}
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}
