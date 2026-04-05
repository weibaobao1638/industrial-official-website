import { InquiryForm } from '@/components/forms/inquiry-form';
import { Breadcrumbs } from '@/components/layout/breadcrumbs';
import { PageHero } from '@/components/ui/page-hero';
import { RichText } from '@/components/ui/rich-text';
import { Section } from '@/components/ui/section';
import { getPageContent } from '@/features/pages/api';
import { getSiteSettings } from '@/features/site/api';
import { buildMetadata } from '@/lib/seo/metadata';
import { isLocale } from '@/lib/i18n/locale';
import { notFound } from 'next/navigation';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const page = await getPageContent(locale, 'contact');
  return buildMetadata({
    locale,
    title: page?.seoTitle || (locale === 'zh' ? '联系我们' : 'Contact Us'),
    description: page?.seoDescription || (locale === 'zh' ? '通过询价表单与我们联系。' : 'Contact us through the inquiry form.'),
    path: '/contact',
  });
}

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const [page, settings] = await Promise.all([getPageContent(locale, 'contact'), getSiteSettings(locale)]);
  if (!page) notFound();
  const t = locale === 'zh' ? { home: '首页', contact: '联系我们', details: '联系方式' } : { home: 'Home', contact: 'Contact Us', details: 'Contact Details' };

  return (
    <>
      <PageHero
        eyebrow={t.contact}
        title={page.title}
        description={page.subtitle}
        actions={
          <Breadcrumbs
            items={[
              { label: t.home, href: `/${locale}` },
              { label: t.contact },
            ]}
          />
        }
      />
      <Section eyebrow={t.contact} title={t.details}>
        <div className="grid grid--2">
          <div className="card">
            <h3 className="h3">{t.details}</h3>
            <RichText content={page.content} />
            <p className="text-muted">Email: {settings.email}</p>
            <p className="text-muted">Phone: {settings.phone}</p>
            <p className="text-muted">WhatsApp: {settings.whatsapp}</p>
            <p className="text-muted">{locale === 'zh' ? '地址' : 'Address'}: {settings.address}</p>
          </div>
          <InquiryForm locale={locale} sourcePage={`/${locale}/contact`} />
        </div>
      </Section>
    </>
  );
}
