import { Breadcrumbs } from '@/components/layout/breadcrumbs';
import { ContentCard } from '@/components/ui/content-card';
import { PageHero } from '@/components/ui/page-hero';
import { Section } from '@/components/ui/section';
import { getDownloads } from '@/features/downloads/api';
import { getPageContent } from '@/features/pages/api';
import { buildMetadata } from '@/lib/seo/metadata';
import { isLocale } from '@/lib/i18n/locale';
import { notFound } from 'next/navigation';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const page = await getPageContent(locale, 'downloads');
  return buildMetadata({
    locale,
    title: page?.seoTitle || (locale === 'zh' ? '下载中心' : 'Downloads'),
    description: page?.seoDescription || (locale === 'zh' ? '目录、数据表和公司资料下载。' : 'Catalogs, datasheets, and company materials.'),
    path: '/downloads',
  });
}

export default async function DownloadsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const [items, page] = await Promise.all([getDownloads(locale), getPageContent(locale, 'downloads')]);
  const t =
    locale === 'zh'
      ? { home: '首页', downloads: '下载中心', files: '资料文件', download: '下载文件', pending: '可联系销售获取' }
      : { home: 'Home', downloads: 'Downloads', files: 'Files', download: 'Download File', pending: 'Available on request' };

  return (
    <>
      <PageHero
        eyebrow={t.downloads}
        title={page?.title || t.downloads}
        description={page?.subtitle || (locale === 'zh' ? '目录、数据表与公司资料下载入口。' : 'Catalogs, datasheets, and company material downloads.')}
        actions={
          <Breadcrumbs
            items={[
              { label: t.home, href: `/${locale}` },
              { label: t.downloads },
            ]}
          />
        }
      />
      <Section eyebrow={t.downloads} title={t.files}>
        {page?.content ? <p className="text-muted" style={{ marginTop: 0, marginBottom: 20, whiteSpace: 'pre-line' }}>{page.content}</p> : null}
        <div className="grid grid--2">
          {items.map((item) => (
            <ContentCard
              key={item.id}
              eyebrow={item.category}
              title={item.title}
              description={item.description}
              href={item.fileUrl || undefined}
              external
              ctaLabel={item.fileUrl ? t.download : undefined}
              meta={item.fileUrl ? item.fileType : t.pending}
            />
          ))}
        </div>
      </Section>
    </>
  );
}
