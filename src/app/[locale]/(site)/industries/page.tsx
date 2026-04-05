import Link from 'next/link';
import { ContentCard } from '@/components/ui/content-card';
import { PageHero } from '@/components/ui/page-hero';
import { Section } from '@/components/ui/section';
import { getIndustries } from '@/features/industries/api';
import { buildMetadata } from '@/lib/seo/metadata';
import { isLocale } from '@/lib/i18n/locale';
import { notFound } from 'next/navigation';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return buildMetadata({
    locale,
    title: locale === 'zh' ? '行业方案' : 'Industries',
    description: locale === 'zh' ? '行业解决方案页面。' : 'Industry solution pages.',
    path: '/industries',
  });
}

export default async function IndustriesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const industries = await getIndustries(locale);

  return (
    <>
      <PageHero
        eyebrow="Industries"
        title={locale === 'zh' ? '行业方案' : 'Industries'}
        description={
          locale === 'zh'
            ? '面向不同工业场景输出应用理解、推荐产品与解决方案。'
            : 'Show solution understanding, recommended products, and value propositions by industry.'
        }
        actions={<Link className="button button--primary" href={`/${locale}/quote`}>{locale === 'zh' ? '提交需求' : 'Request a Quote'}</Link>}
      />
      <Section eyebrow="Solutions" title={locale === 'zh' ? '行业列表' : 'Industry Solutions'}>
        <div className="grid grid--3">
          {industries.map((industry) => (
            <ContentCard
              key={industry.slug}
              eyebrow={locale === 'zh' ? '行业方案' : 'Industry'}
              title={industry.name}
              description={industry.summary}
              href={`/${locale}/industries/${industry.slug}`}
              ctaLabel={locale === 'zh' ? '查看方案' : 'View Detail'}
            />
          ))}
        </div>
      </Section>
    </>
  );
}
