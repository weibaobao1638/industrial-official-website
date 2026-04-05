import { notFound } from 'next/navigation';
import { Breadcrumbs } from '@/components/layout/breadcrumbs';
import { RichText } from '@/components/ui/rich-text';
import { Section } from '@/components/ui/section';
import { getIndustryDetail } from '@/features/industries/api';
import { buildMetadata } from '@/lib/seo/metadata';
import { isLocale } from '@/lib/i18n/locale';

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const industry = await getIndustryDetail(locale, slug);
  if (!industry) return {};
  return buildMetadata({ locale, title: industry.name, description: industry.summary, path: `/industries/${slug}` });
}

export default async function IndustryDetailPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const industry = await getIndustryDetail(locale, slug);
  if (!industry) notFound();
  const t = locale === 'zh' ? { home: '首页', industries: '行业方案', label: '行业' } : { home: 'Home', industries: 'Industries', label: 'Industry' };

  return (
    <Section
      eyebrow={t.label}
      title={industry.name}
      description={industry.summary}
      actions={
        <Breadcrumbs
          items={[
            { label: t.home, href: `/${locale}` },
            { label: t.industries, href: `/${locale}/industries` },
            { label: industry.name },
          ]}
        />
      }
    >
      <div className="card">
        <RichText
          content={
            industry.content ||
            (locale === 'zh'
              ? '该行业页可展示行业痛点、解决方案说明、推荐产品和项目案例，帮助客户快速理解你们的应用能力。'
              : 'This industry page can explain pain points, solution logic, recommended products, and project references to help buyers understand your application capability.')
          }
        />
      </div>
    </Section>
  );
}
