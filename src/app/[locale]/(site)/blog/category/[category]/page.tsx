import Link from 'next/link';
import { Breadcrumbs } from '@/components/layout/breadcrumbs';
import { ContentCard } from '@/components/ui/content-card';
import { PageHero } from '@/components/ui/page-hero';
import { Section } from '@/components/ui/section';
import { getBlogPosts } from '@/features/blog/api';
import { buildMetadata } from '@/lib/seo/metadata';
import { isLocale } from '@/lib/i18n/locale';
import { formatSlugLabel } from '@/lib/utils/format';
import { notFound } from 'next/navigation';

export async function generateMetadata({ params }: { params: Promise<{ locale: string; category: string }> }) {
  const { locale, category } = await params;
  if (!isLocale(locale)) return {};
  return buildMetadata({
    locale,
    title: locale === 'zh' ? `${category} | 资讯博客` : `${category} | Blog`,
    description: locale === 'zh' ? `${category} 分类文章。` : `Articles in ${category}.`,
    path: `/blog/category/${category}`,
  });
}

export default async function BlogCategoryPage({ params }: { params: Promise<{ locale: string; category: string }> }) {
  const { locale, category } = await params;
  if (!isLocale(locale)) notFound();
  const posts = await getBlogPosts(locale, category);
  const label = formatSlugLabel(category);
  const t =
    locale === 'zh'
      ? { home: '首页', blog: '资讯博客', category: '分类', back: '返回博客', title: '分类文章', read: '阅读全文' }
      : { home: 'Home', blog: 'Blog', category: 'Category', back: 'Back to Blog', title: 'Category Articles', read: 'Read More' };

  return (
    <>
      <PageHero
        eyebrow={t.category}
        title={label}
        description={
          locale === 'zh'
            ? `浏览 ${label} 分类下的文章内容。`
            : `Browse articles under the ${label} category.`
        }
        actions={
          <>
            <Breadcrumbs
              items={[
                { label: t.home, href: `/${locale}` },
                { label: t.blog, href: `/${locale}/blog` },
                { label },
              ]}
            />
            <Link className="button button--ghost" href={`/${locale}/blog`}>{t.back}</Link>
          </>
        }
      />
      <Section eyebrow={t.blog} title={t.title}>
        <div className="grid grid--2">
          {posts.map((post) => (
            <ContentCard
              key={post.slug}
              eyebrow={label}
              title={post.title}
              description={post.excerpt}
              href={`/${locale}/blog/${post.slug}`}
              ctaLabel={t.read}
            />
          ))}
        </div>
      </Section>
    </>
  );
}
