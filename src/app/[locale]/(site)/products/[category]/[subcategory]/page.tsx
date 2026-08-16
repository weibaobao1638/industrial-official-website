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
  findProductLevel2Category,
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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; category: string; subcategory: string }>;
}) {
  const { locale, category, subcategory } = await params;
  if (!isLocale(locale)) return {};
  const normalizedCategory = normalizeSegment(category);
  const normalizedSubcategory = normalizeSegment(subcategory);

  const categories = await getProductCategoryTree(locale);
  const level1 = findProductLevel1Category(categories, normalizedCategory);
  const level2 = findProductLevel2Category(level1, normalizedSubcategory);
  if (!level1 || !level2) return {};

  return buildMetadata({
    locale,
    title: locale === 'zh' ? `${level2.label} | 产品中心` : `${level2.label} | Products`,
    description: locale === 'zh' ? `浏览 ${level1.label} / ${level2.label} 类目下的产品。` : `Browse products in the ${level1.label} / ${level2.label} category path.`,
    path: `/products/${level1.id}/${level2.id}`,
  });
}

export default async function ProductSubcategoryPage({
  params,
}: {
  params: Promise<{ locale: string; category: string; subcategory: string }>;
}) {
  const { locale, category, subcategory } = await params;
  if (!isLocale(locale)) notFound();
  const normalizedCategory = normalizeSegment(category);
  const normalizedSubcategory = normalizeSegment(subcategory);
  const categories = await getProductCategoryTree(locale);

  let level1 = findProductLevel1Category(categories, normalizedCategory);
  let level2 = findProductLevel2Category(level1, normalizedSubcategory);

  if (!level1 || !level2) {
    const fallbackLocale = locale === 'zh' ? 'en' : 'zh';
    const fallbackCategories = await getProductCategoryTree(fallbackLocale);
    const fallbackLevel1 = findProductLevel1Category(fallbackCategories, normalizedCategory);
    const fallbackLevel2 = findProductLevel2Category(fallbackLevel1, normalizedSubcategory);
    const mappedLevel1 = fallbackLevel1 ? findProductLevel1Category(categories, fallbackLevel1.id) : null;
    const mappedLevel2 = fallbackLevel2 ? findProductLevel2Category(mappedLevel1, fallbackLevel2.id) : null;

    if (mappedLevel1 && mappedLevel2) {
      redirect(buildLocalizedProductCategoryPath(locale, mappedLevel1.id, mappedLevel2.id));
    }

    notFound();
  }

  if (normalizedCategory !== level1.id || normalizedSubcategory !== level2.id) {
    redirect(buildLocalizedProductCategoryPath(locale, level1.id, level2.id));
  }

  const products = await getProductList(locale, level1.id, level2.id);

  const t =
    locale === 'zh'
      ? {
          home: '首页',
          products: '产品中心',
          level1: '一级类目',
          level2: '二级类目',
          back: '返回一级类目',
          navTitle: '类目筛选',
          navDescription: '左侧类目树保持当前二级类目高亮，右侧展示筛选后的产品。',
          all: '全部产品',
          title: '二级类目产品',
          detail: '查看详情',
        }
      : {
          home: 'Home',
          products: 'Products',
          level1: 'Level-1 Category',
          level2: 'Level-2 Category',
          back: 'Back to Level-1 Category',
          navTitle: 'Category Filters',
          navDescription: 'The left tree keeps the current level-2 category highlighted while the right panel shows the filtered products.',
          all: 'All Products',
          title: 'Level-2 Category Products',
          detail: 'View Detail',
        };

  return (
    <>
      <PageHero
        eyebrow={t.level2}
        title={level2.label}
        description={
          locale === 'zh'
            ? `浏览 ${level1.label} / ${level2.label} 二级类目下的产品与规格说明。`
            : `Browse products and specification-focused detail pages in ${level1.label} / ${level2.label}.`
        }
        actions={
          <>
            <Breadcrumbs
              items={[
                { label: t.home, href: `/${locale}` },
                { label: t.products, href: `/${locale}/products` },
                { label: level1.label, href: `/${locale}/products/${level1.id}` },
                { label: level2.label },
              ]}
            />
            <Link className="button button--ghost" href={`/${locale}/products/${level1.id}`}>{t.back}</Link>
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
              <ProductCategoryNavigation
                allLabel={t.all}
                categories={categories}
                locale={locale}
                activeLevel1Id={level1.id}
                activeLevel2Id={level2.id}
              />
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
