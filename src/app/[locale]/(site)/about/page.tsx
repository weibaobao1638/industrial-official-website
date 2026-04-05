import { Breadcrumbs } from '@/components/layout/breadcrumbs';
import { PageHero } from '@/components/ui/page-hero';
import { RichText } from '@/components/ui/rich-text';
import { Section } from '@/components/ui/section';
import { getPageContent } from '@/features/pages/api';
import { buildMetadata } from '@/lib/seo/metadata';
import { isLocale } from '@/lib/i18n/locale';
import { notFound } from 'next/navigation';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const page = await getPageContent(locale, 'about');

  return buildMetadata({
    locale,
    title: page?.seoTitle || (locale === 'zh' ? '关于我们' : 'About Us'),
    description:
      page?.seoDescription ||
      (locale === 'zh' ? '公司实力、工厂能力与质量体系介绍。' : 'Company profile, factory capability, and quality system overview.'),
    path: '/about',
  });
}

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const page = await getPageContent(locale, 'about');
  if (!page) notFound();
  const t = locale === 'zh' ? { home: '首页', about: '关于我们', overview: '公司介绍', capability: '能力说明' } : { home: 'Home', about: 'About Us', overview: 'Company Overview', capability: 'Capability' };

  return (
    <>
      <PageHero
        eyebrow={t.about}
        title={page.title}
        description={page.subtitle}
        actions={
          <Breadcrumbs
            items={[
              { label: t.home, href: `/${locale}` },
              { label: t.about },
            ]}
          />
        }
      />
      <Section eyebrow={t.about} title={t.overview}>
        <div className="grid grid--2">
          <div className="card">
            <h3 className="h3">{t.overview}</h3>
            <RichText content={page.content} />
          </div>
          <div className="card">
            <h3 className="h3">{t.capability}</h3>
            <p className="text-muted">
              {locale === 'zh'
                ? '该区域可继续补充工厂、设备、研发、品质与交付能力模块，用于强化企业信任度。'
                : 'This block can be expanded with factory, equipment, R&D, quality, and delivery capability content to strengthen buyer trust.'}
            </p>
          </div>
        </div>
      </Section>
    </>
  );
}
