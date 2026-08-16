import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { Breadcrumbs } from '@/components/layout/breadcrumbs';
import { ProductCategoryNavigation } from '@/components/products/category-navigation';
import { ContentCard } from '@/components/ui/content-card';
import { PageHero } from '@/components/ui/page-hero';
import { Section } from '@/components/ui/section';
import {
  buildLocalizedProductCategoryPath,
  buildLocalizedProductDetailPath,
  findProductLevel1Category,
  getProductCategoryTrailLabel,
  getProductCategoryTree,
  getProductList,
} from '@/features/products/api';
import { buildMetadata } from '@/lib/seo/metadata';
import { isLocale } from '@/lib/i18n/locale';

function normalizeSegment(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; category: string }> }) {
  const { locale, category } = await params;
  if (!isLocale(locale)) return {};
  const normalizedCategory = normalizeSegment(category);

  const categories = await getProductCategoryTree(locale);
  const currentCategory = findProductLevel1Category(categories, normalizedCategory);
  if (!currentCategory) return {};

  return buildMetadata({
    locale,
    title: locale === 'zh' ? `${currentCategory.label} | 产品中心` : `${currentCategory.label} | Products`,
    description: locale === 'zh' ? `浏览 ${currentCategory.label} 一级类目下的产品。` : `Browse products in the ${currentCategory.label} level-1 category.`,
    path: `/products/${currentCategory.id}`,
  });
}

export default async function ProductCategoryPage({ params }: { params: Promise<{ locale: string; category: string }> }) {
  const { locale, category } = await params;
  if (!isLocale(locale)) notFound();
  const normalizedCategory = normalizeSegment(category);
  const categories = await getProductCategoryTree(locale);
  let currentCategory = findProductLevel1Category(categories, normalizedCategory);

  if (!currentCategory) {
    const fallbackLocale = locale === 'zh' ? 'en' : 'zh';
    const fallbackCategories = await getProductCategoryTree(fallbackLocale);
    const fallbackCategory = findProductLevel1Category(fallbackCategories, normalizedCategory);
    const mappedCategory = fallbackCategory ? findProductLevel1Category(categories, fallbackCategory.id) : null;

    if (mappedCategory) {
      redirect(buildLocalizedProductCategoryPath(locale, mappedCategory.id));
    }

    notFound();
  }

  if (normalizedCategory !== currentCategory.id) {
    redirect(buildLocalizedProductCategoryPath(locale, currentCategory.id));
  }

  const products = await getProductList(locale, currentCategory.id);

  const label = currentCategory.label;
  const t =
    locale === 'zh'
      ? {
          home: '首页',
          products: '产品中心',
          category: '一级类目',
          back: '返回产品中心',
          navTitle: '类目筛选',
          navDescription: '左侧继续选择该一级类目下的二级类目，右侧展示筛选后的产品。',
          all: '全部产品',
          title: '一级类目产品',
          detail: '查看详情',
        }
      : {
          home: 'Home',
          products: 'Products',
          category: 'Level-1 Category',
          back: 'Back to Products',
          navTitle: 'Category Filters',
          navDescription: 'Use the left tree to narrow this level-1 product group into its matching level-2 categories.',
          all: 'All Products',
          title: 'Level-1 Category Products',
          detail: 'View Detail',
        };

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
        <div className="product-catalog-layout">
          <aside className="product-catalog-sidebar">
            <div className="card stack-md">
              <div className="stack-sm">
                <span className="eyebrow">{locale === 'zh' ? '导航' : 'Navigation'}</span>
                <h3 className="h3">{t.navTitle}</h3>
                <p className="text-muted">{t.navDescription}</p>
              </div>
              <ProductCategoryNavigation allLabel={t.all} categories={categories} locale={locale} activeLevel1Id={currentCategory.id} />
              {currentCategory.children.length ? (
                <Link className="button button--ghost" href={buildLocalizedProductCategoryPath(locale, currentCategory.id, currentCategory.children[0].id)}>
                  {locale === 'zh' ? '进入二级类目' : 'Open Level-2 Category'}
                </Link>
              ) : null}
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
