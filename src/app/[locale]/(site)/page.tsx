import Link from 'next/link';
import { AboutImageSlider } from '@/components/home/about-image-slider';
import { HomeBannerCarousel } from '@/components/home/home-banner-carousel';
import { HeroSection } from '@/components/home/hero-section';
import { RichText } from '@/components/ui/rich-text';
import { ContentCard } from '@/components/ui/content-card';
import { Section } from '@/components/ui/section';
import { getHomeBanners } from '@/features/home-banners/api';
import { buildLocalizedProductDetailPath, getFeaturedProducts } from '@/features/products/api';
import { getIndustries } from '@/features/industries/api';
import { getBlogPosts } from '@/features/blog/api';
import { getCertifications } from '@/features/certifications/api';
import { getPageContent } from '@/features/pages/api';
import { getHomepageStats, getSiteSettings } from '@/features/site/api';
import { CtaBanner } from '@/components/ui/cta-banner';
import { buildMetadata } from '@/lib/seo/metadata';
import { getDictionary, isLocale } from '@/lib/i18n/locale';
import { notFound } from 'next/navigation';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const settings = await getSiteSettings(locale);
  const homePage = await getPageContent(locale, 'home');

  return buildMetadata({
    locale,
    title: homePage?.seoTitle || settings.defaultSeoTitle,
    description: homePage?.seoDescription || settings.defaultSeoDescription,
  });
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dict = getDictionary(locale);
  const labels =
    locale === 'zh'
      ? {
          kpis: '核心指标',
          products: '产品',
          solutions: '方案',
          certifications: '认证',
          insights: '内容',
        }
      : {
          kpis: 'KPIs',
          products: 'Products',
          solutions: 'Solutions',
          certifications: 'Certifications',
          insights: 'Insights',
        };
  const settings = await getSiteSettings(locale);
  const [products, industries, posts, stats, certifications, homePage, homeBanners] = await Promise.all([
    getFeaturedProducts(locale, 10),
    getIndustries(locale),
    getBlogPosts(locale),
    getHomepageStats(locale),
    getCertifications(locale),
    getPageContent(locale, 'home'),
    getHomeBanners(locale),
  ]);

  return (
    <>
      <HomeBannerCarousel items={homeBanners} locale={locale} />
      <HeroSection locale={locale} page={homePage} />

      {homePage?.content ? (
        <Section
          eyebrow={locale === 'zh' ? '关于我们' : 'WHO WE ARE'}
          title={homePage.title}
          description={homePage.subtitle}
        >
          <div className={`about-grid${settings.aboutImages.length ? '' : ' about-grid--text-only'}`}>
            <AboutImageSlider images={settings.aboutImages} locale={locale} />
            <div className="about-body stack-md">
              <RichText content={homePage.content} />
              <div className="page-hero__actions">
                <Link className="button button--primary" href={`/${locale}/about`}>
                  {locale === 'zh' ? '了解更多' : 'Read More'}
                </Link>
                <Link className="button button--ghost" href={`/${locale}/contact`}>
                  {locale === 'zh' ? '联系我们' : 'Contact Us'}
                </Link>
              </div>
            </div>
          </div>
        </Section>
      ) : null}

      <Section eyebrow={labels.products} title={dict.common.featuredProducts}>
        <div className="grid grid--5">
          {products.map((product) => (
            <ContentCard
              key={product.id}
              eyebrow={product.categoryLabel}
              title={product.name}
              description={product.summary}
              imageUrl={product.imageUrl}
              imageVariant="product"
              badges={product.productCode ? [product.productCode] : undefined}
              href={buildLocalizedProductDetailPath(locale, product)}
              ctaLabel={dict.common.learnMore}
            />
          ))}
        </div>
      </Section>

      <Section eyebrow={labels.kpis} title={locale === 'zh' ? '核心指标' : 'Key Figures'}>
        <div className="grid grid--3">
          {stats.map((item) => (
            <div className="card" key={item.label}>
              <div className="eyebrow">{item.label}</div>
              <h3 className="h2">{item.value}</h3>
            </div>
          ))}
        </div>
      </Section>

      <Section eyebrow={labels.solutions} title={dict.common.industrySolutions}>
        <div className="grid grid--3">
          {industries.map((industry) => (
            <article className="card" key={industry.slug}>
              <h3 className="h3">{industry.name}</h3>
              <p className="text-muted">{industry.summary}</p>
              <Link href={`/${locale}/industries/${industry.slug}`}>{dict.common.learnMore}</Link>
            </article>
          ))}
        </div>
      </Section>

      <Section eyebrow={labels.certifications} title={locale === 'zh' ? '认证资质' : 'Certifications'}>
        <div className="grid grid--2">
          {certifications.slice(0, 2).map((item) => (
            <ContentCard
              key={item.id}
              eyebrow={item.type}
              title={item.title}
              description={item.description}
              imageUrl={item.imageUrl}
            />
          ))}
        </div>
      </Section>

      <Section eyebrow={labels.insights} title={dict.common.latestInsights}>
        <div className="grid grid--2">
          {posts.map((post) => (
            <ContentCard
              key={post.slug}
              eyebrow={post.category}
              title={post.title}
              description={post.excerpt}
              href={`/${locale}/blog/${post.slug}`}
              ctaLabel={dict.common.learnMore}
            />
          ))}
        </div>
      </Section>

      <CtaBanner locale={locale} />
    </>
  );
}
