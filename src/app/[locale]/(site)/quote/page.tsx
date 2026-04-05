import { InquiryForm } from '@/components/forms/inquiry-form';
import { Breadcrumbs } from '@/components/layout/breadcrumbs';
import { PageHero } from '@/components/ui/page-hero';
import { Section } from '@/components/ui/section';
import { getPageContent } from '@/features/pages/api';
import { getSiteSettings } from '@/features/site/api';
import { buildMetadata } from '@/lib/seo/metadata';
import { isLocale } from '@/lib/i18n/locale';
import { notFound } from 'next/navigation';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const page = await getPageContent(locale, 'quote');
  return buildMetadata({
    locale,
    title: page?.seoTitle || (locale === 'zh' ? '在线询价' : 'Get Quote'),
    description: page?.seoDescription || (locale === 'zh' ? '提交产品需求和规格信息。' : 'Submit your product requirements and specifications.'),
    path: '/quote',
  });
}

export default async function QuotePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const [settings, page] = await Promise.all([getSiteSettings(locale), getPageContent(locale, 'quote')]);
  const t =
    locale === 'zh'
      ? { home: '首页', quote: '在线询价', title: '提交询价', helper: '也可以直接通过以下方式联系销售团队。' }
      : { home: 'Home', quote: 'Get Quote', title: 'Request for Quote', helper: 'You can also reach the sales team directly using the contacts below.' };

  return (
    <>
      <PageHero
        eyebrow="RFQ"
        title={page?.title || t.title}
        description={page?.subtitle || (locale === 'zh' ? '提交产品需求、规格和采购信息。' : 'Submit product requirements, specifications, and purchasing details.')}
        actions={
          <Breadcrumbs
            items={[
              { label: t.home, href: `/${locale}` },
              { label: t.quote },
            ]}
          />
        }
      />
      <Section eyebrow="RFQ" title={t.quote}>
        <div className="grid grid--2">
          <InquiryForm locale={locale} sourcePage={`/${locale}/quote`} />
          <div className="card stack-md">
            <h3 className="h3">{t.helper}</h3>
            {page?.content ? <p className="text-muted" style={{ whiteSpace: 'pre-line' }}>{page.content}</p> : null}
            <p className="text-muted">Email: {settings.email}</p>
            <p className="text-muted">Phone: {settings.phone}</p>
            <p className="text-muted">WhatsApp: {settings.whatsapp}</p>
            <p className="text-muted">{locale === 'zh' ? '地址' : 'Address'}: {settings.address}</p>
          </div>
        </div>
      </Section>
    </>
  );
}
