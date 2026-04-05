import Link from 'next/link';
import { ContentCard } from '@/components/ui/content-card';
import { PageHero } from '@/components/ui/page-hero';
import { Section } from '@/components/ui/section';
import { getCaseList } from '@/features/cases/api';
import { buildMetadata } from '@/lib/seo/metadata';
import { isLocale } from '@/lib/i18n/locale';
import { notFound } from 'next/navigation';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return buildMetadata({
    locale,
    title: locale === 'zh' ? '案例中心' : 'Case Studies',
    description: locale === 'zh' ? '项目与出口案例展示。' : 'Project and export case studies.',
    path: '/cases',
  });
}

export default async function CasesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const cases = await getCaseList(locale);

  return (
    <>
      <PageHero
        eyebrow="Cases"
        title={locale === 'zh' ? '案例中心' : 'Case Studies'}
        description={
          locale === 'zh'
            ? '展示海外项目、行业场景与交付成果，帮助客户建立信任。'
            : 'Present overseas projects, industry scenarios, and delivery outcomes to build buyer confidence.'
        }
        actions={<Link className="button button--ghost" href={`/${locale}/contact`}>{locale === 'zh' ? '联系销售' : 'Talk to Sales'}</Link>}
      />
      <Section eyebrow="Projects" title={locale === 'zh' ? '项目案例' : 'Project References'}>
        <div className="grid grid--2">
          {cases.map((item) => (
            <ContentCard
              key={item.slug}
              eyebrow={item.country}
              title={item.title}
              description={item.summary}
              href={`/${locale}/cases/${item.slug}`}
              ctaLabel={locale === 'zh' ? '查看案例' : 'View Detail'}
            />
          ))}
        </div>
      </Section>
    </>
  );
}
