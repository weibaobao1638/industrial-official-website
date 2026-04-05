import { notFound } from 'next/navigation';
import { InquiryForm } from '@/components/forms/inquiry-form';
import { Breadcrumbs } from '@/components/layout/breadcrumbs';
import { RichText } from '@/components/ui/rich-text';
import { Section } from '@/components/ui/section';
import { getProductDetail } from '@/features/products/api';
import { buildMetadata } from '@/lib/seo/metadata';
import { isLocale } from '@/lib/i18n/locale';
import { formatSlugLabel } from '@/lib/utils/format';

export async function generateMetadata({ params }: { params: Promise<{ locale: string; category: string; slug: string }> }) {
  const { locale, category, slug } = await params;
  if (!isLocale(locale)) return {};

  const product = await getProductDetail(locale, category, slug);
  if (!product) return {};

  return buildMetadata({
    locale,
    title: product.name,
    description: product.summary,
    path: `/products/${category}/${slug}`,
  });
}

export default async function ProductDetailPage({ params }: { params: Promise<{ locale: string; category: string; slug: string }> }) {
  const { locale, category, slug } = await params;
  if (!isLocale(locale)) notFound();

  const product = await getProductDetail(locale, category, slug);
  if (!product) notFound();
  const categoryLabel = product.categoryLabel || formatSlugLabel(category);
  const t =
    locale === 'zh'
      ? {
          home: '首页',
          products: '产品中心',
          categoryLabel: '分类',
          productCode: '产品编号',
          description: '产品介绍',
          specs: '规格信息',
          material: '材质',
          specification: '规格',
          features: '产品特点',
          applications: '应用场景',
          tbd: '可联系获取',
        }
      : {
          home: 'Home',
          products: 'Products',
          categoryLabel: 'Category',
          productCode: 'Product Code',
          description: 'Description',
          specs: 'Specifications',
          material: 'Material',
          specification: 'Specification',
          features: 'Features',
          applications: 'Applications',
          tbd: 'Available on request',
        };

  return (
    <>
      <Section
        eyebrow={t.categoryLabel}
        title={product.name}
        description={product.summary}
        actions={
          <Breadcrumbs
            items={[
              { label: t.home, href: `/${locale}` },
              { label: t.products, href: `/${locale}/products` },
              { label: categoryLabel, href: `/${locale}/products/${category}` },
              { label: product.name },
            ]}
          />
        }
      >
        <div className="grid grid--2">
          <div className="card">
            {product.imageUrl ? (
              <div className="product-hero-image">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={product.imageUrl} alt={product.name} />
              </div>
            ) : null}
            <div className="chip-list" style={{ marginBottom: 16 }}>
              {product.productCode ? <span className="chip">{t.productCode}: {product.productCode}</span> : null}
              <span className="chip">{categoryLabel}</span>
            </div>
            {product.description ? (
              <>
                <h3 className="h3">{t.description}</h3>
                <RichText content={product.description} />
              </>
            ) : null}
            <div className="spec-grid">
              <div className="spec-card">
                <span className="eyebrow">{t.material}</span>
                <strong>{product.material ?? t.tbd}</strong>
              </div>
              <div className="spec-card">
                <span className="eyebrow">{t.specification}</span>
                <strong>{product.specification ?? t.tbd}</strong>
              </div>
            </div>
            <h3 className="h3" style={{ marginTop: 24 }}>{t.specs}</h3>
            <h3 className="h3" style={{ marginTop: 24 }}>{t.features}</h3>
            <ul>
              {product.features.map((item) => <li key={item}>{item}</li>)}
            </ul>
            <h3 className="h3" style={{ marginTop: 24 }}>{t.applications}</h3>
            <ul>
              {product.applications.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </div>
          <InquiryForm locale={locale} sourcePage={`/${locale}/products/${category}/${slug}`} />
        </div>
      </Section>
    </>
  );
}
