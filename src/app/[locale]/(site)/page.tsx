import Image from 'next/image';
import Link from 'next/link';
import { HomeBannerCarousel } from '@/components/home/home-banner-carousel';
import { HeroSection } from '@/components/home/hero-section';
import { RichText } from '@/components/ui/rich-text';
import { ContentCard } from '@/components/ui/content-card';
import { Section } from '@/components/ui/section';
import { getHomeBanners } from '@/features/home-banners/api';
import { buildLocalizedProductDetailPath, getFeaturedProducts } from '@/features/products/api';
import { getIndustries } from '@/features/industries/api';
import { getCaseList } from '@/features/cases/api';
import { getBlogPosts } from '@/features/blog/api';
import { getCertifications } from '@/features/certifications/api';
import { getDownloads } from '@/features/downloads/api';
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
          cases: '案例',
          certifications: '认证',
          downloads: '下载',
          insights: '内容',
        }
      : {
          kpis: 'KPIs',
          products: 'Products',
          solutions: 'Solutions',
          cases: 'Cases',
          certifications: 'Certifications',
          downloads: 'Downloads',
          insights: 'Insights',
        };
  const settings = await getSiteSettings(locale);
  const [products, industries, cases, posts, stats, certifications, downloads, homePage, homeBanners] = await Promise.all([
    getFeaturedProducts(locale),
    getIndustries(locale),
    getCaseList(locale),
    getBlogPosts(locale),
    getHomepageStats(locale),
    getCertifications(locale),
    getDownloads(locale),
    getPageContent(locale, 'home'),
    getHomeBanners(locale),
  ]);

  return (
    <>
      <HomeBannerCarousel items={homeBanners} locale={locale} />
      <HeroSection locale={locale} page={homePage} />

      {homePage?.content ? (
        <Section
          eyebrow={locale === 'zh' ? '品牌概览' : 'Company Snapshot'}
          title={locale === 'zh' ? '公司与网站概览' : 'Company & Website Overview'}
          description={locale === 'zh' ? '这个区域适合呈现品牌定位、主营方向和基础联系信息。' : 'Use this area to present positioning, core business scope, and base contact information.'}
        >
          <div className="summary-grid">
            <div className="card">
              <RichText content={homePage.content} />
            </div>
            <div className="card stack-md">
              {settings.logoUrl ? (
                <div className="company-logo-panel">
                  <Image src={settings.logoUrl} alt={settings.siteName} fill sizes="160px" />
                </div>
              ) : null}
              <h3 className="h3">{settings.companyName || settings.siteName}</h3>
              {settings.address ? <p className="text-muted">{settings.address}</p> : null}
              {settings.email ? <p className="text-muted">Email: {settings.email}</p> : null}
              {settings.phone ? <p className="text-muted">{locale === 'zh' ? '电话' : 'Phone'}: {settings.phone}</p> : null}
              {settings.whatsapp ? <p className="text-muted">WhatsApp: {settings.whatsapp}</p> : null}
              <div className="page-hero__actions">
                <Link className="button button--primary" href={`/${locale}/quote`}>
                  {locale === 'zh' ? '立即询价' : 'Get Quote'}
                </Link>
                <Link className="button button--ghost" href={`/${locale}/contact`}>
                  {locale === 'zh' ? '联系销售' : 'Talk to Sales'}
                </Link>
              </div>
            </div>
          </div>
        </Section>
      ) : null}

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

      <Section eyebrow={labels.products} title={dict.common.featuredProducts}>
        <div className="grid grid--3">
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

      <Section eyebrow={labels.cases} title={locale === 'zh' ? '项目案例' : 'Case Studies'}>
        <div className="grid grid--2">
          {cases.map((item) => (
            <article className="card" key={item.slug}>
              <div className="eyebrow">{item.country}</div>
              <h3 className="h3">{item.title}</h3>
              <p className="text-muted">{item.summary}</p>
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

      <Section eyebrow={labels.downloads} title={locale === 'zh' ? '下载资料' : 'Downloads'}>
        <div className="grid grid--2">
          {downloads.slice(0, 2).map((item) => (
            <ContentCard
              key={item.id}
              eyebrow={item.fileType}
              title={item.title}
              description={item.description}
              href={item.fileUrl || undefined}
              external
              ctaLabel={item.fileUrl ? (locale === 'zh' ? '下载' : 'Download') : undefined}
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
