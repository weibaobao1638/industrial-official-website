import { notFound } from 'next/navigation';
import { Breadcrumbs } from '@/components/layout/breadcrumbs';
import { RichText } from '@/components/ui/rich-text';
import { Section } from '@/components/ui/section';
import { getCaseDetail } from '@/features/cases/api';
import { buildMetadata } from '@/lib/seo/metadata';
import { isLocale } from '@/lib/i18n/locale';

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const item = await getCaseDetail(locale, slug);
  if (!item) return {};
  return buildMetadata({ locale, title: item.title, description: item.summary, path: `/cases/${slug}` });
}

export default async function CaseDetailPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const item = await getCaseDetail(locale, slug);
  if (!item) notFound();
  const t =
    locale === 'zh'
      ? { home: '首页', cases: '案例中心', background: '项目背景', solution: '解决方案', result: '项目成果' }
      : { home: 'Home', cases: 'Case Studies', background: 'Background', solution: 'Solution', result: 'Result' };

  return (
    <Section
      eyebrow={item.country}
      title={item.title}
      description={item.summary}
      actions={
        <Breadcrumbs
          items={[
            { label: t.home, href: `/${locale}` },
            { label: t.cases, href: `/${locale}/cases` },
            { label: item.title },
          ]}
        />
      }
    >
      <div className="grid grid--3">
        <article className="card">
          <h3 className="h3">{t.background}</h3>
          <RichText content={item.background || (locale === 'zh' ? '这里可补充客户背景、项目场景与采购动机。' : 'Use this section for client background, project context, and buying motivation.')} />
        </article>
        <article className="card">
          <h3 className="h3">{t.solution}</h3>
          <RichText content={item.solution || (locale === 'zh' ? '这里可补充产品组合、技术匹配与交付方案。' : 'Use this section for product combination, technical matching, and delivery approach.')} />
        </article>
        <article className="card">
          <h3 className="h3">{t.result}</h3>
          <RichText content={item.result || (locale === 'zh' ? '这里可补充交付成果、效率提升或项目反馈。' : 'Use this section for delivery results, efficiency gains, or project feedback.')} />
        </article>
      </div>
    </Section>
  );
}
