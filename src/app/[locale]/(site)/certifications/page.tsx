import { Breadcrumbs } from '@/components/layout/breadcrumbs';
import { ContentCard } from '@/components/ui/content-card';
import { PageHero } from '@/components/ui/page-hero';
import { Section } from '@/components/ui/section';
import { getCertifications } from '@/features/certifications/api';
import { getPageContent } from '@/features/pages/api';
import { buildMetadata } from '@/lib/seo/metadata';
import { isLocale } from '@/lib/i18n/locale';
import { notFound } from 'next/navigation';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const page = await getPageContent(locale, 'certifications');
  return buildMetadata({
    locale,
    title: page?.seoTitle || (locale === 'zh' ? '认证资质' : 'Certifications'),
    description: page?.seoDescription || (locale === 'zh' ? '企业认证和检测资料。' : 'Company certifications and testing materials.'),
    path: '/certifications',
  });
}

export default async function CertificationsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const [items, page] = await Promise.all([getCertifications(locale), getPageContent(locale, 'certifications')]);
  const t =
    locale === 'zh'
      ? { home: '首页', certifications: '认证资质', list: '证书列表', issuedBy: '签发机构', view: '查看文件' }
      : { home: 'Home', certifications: 'Certifications', list: 'Certificates', issuedBy: 'Issued By', view: 'View File' };

  return (
    <>
      <PageHero
        eyebrow={t.certifications}
        title={page?.title || t.certifications}
        description={page?.subtitle || (locale === 'zh' ? '企业认证、检测资料和合规证明展示。' : 'Company certifications, test reports, and compliance materials.')}
        actions={
          <Breadcrumbs
            items={[
              { label: t.home, href: `/${locale}` },
              { label: t.certifications },
            ]}
          />
        }
      />
      <Section eyebrow={t.certifications} title={t.list}>
        {page?.content ? <p className="text-muted" style={{ marginTop: 0, marginBottom: 20, whiteSpace: 'pre-line' }}>{page.content}</p> : null}
        <div className="grid grid--2">
          {items.map((item) => (
            <ContentCard
              key={item.id}
              eyebrow={item.type}
              title={item.title}
              description={`${item.description}${item.issuedBy ? ` ${t.issuedBy}: ${item.issuedBy}` : ''}${item.validUntil ? ` / ${item.validUntil}` : ''}`}
              imageUrl={item.imageUrl}
              href={item.fileUrl || undefined}
              external
              ctaLabel={item.fileUrl ? t.view : undefined}
              meta={item.fileName}
            />
          ))}
        </div>
      </Section>
    </>
  );
}
