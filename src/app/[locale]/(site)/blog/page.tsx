import Link from 'next/link';
import { ContentCard } from '@/components/ui/content-card';
import { PageHero } from '@/components/ui/page-hero';
import { Section } from '@/components/ui/section';
import { getBlogPosts } from '@/features/blog/api';
import { buildMetadata } from '@/lib/seo/metadata';
import { isLocale } from '@/lib/i18n/locale';
import { formatSlugLabel } from '@/lib/utils/format';
import { notFound } from 'next/navigation';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return buildMetadata({
    locale,
    title: locale === 'zh' ? '资讯博客' : 'Blog',
    description: locale === 'zh' ? '文章与行业内容。' : 'Articles and insights.',
    path: '/blog',
  });
}

export default async function BlogPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const posts = await getBlogPosts(locale);
  const categories = [...new Set(posts.map((post) => post.category))];

  return (
    <>
      <PageHero
        eyebrow="Blog"
        title={locale === 'zh' ? '资讯博客' : 'Blog'}
        description={
          locale === 'zh'
            ? '通过知识内容、采购指南和行业文章提升搜索流量与专业度。'
            : 'Use knowledge articles, buying guides, and industry content to improve SEO reach and authority.'
        }
        actions={
          <div className="chip-list">
            {categories.map((category) => (
              <Link className="chip" key={category} href={`/${locale}/blog/category/${category}`}>
                {formatSlugLabel(category)}
              </Link>
            ))}
          </div>
        }
      />
      <Section eyebrow="Articles" title={locale === 'zh' ? '最新文章' : 'Latest Articles'}>
        <div className="grid grid--2">
          {posts.map((post) => (
            <ContentCard
              key={post.slug}
              eyebrow={formatSlugLabel(post.category)}
              title={post.title}
              description={post.excerpt}
              href={`/${locale}/blog/${post.slug}`}
              ctaLabel={locale === 'zh' ? '阅读全文' : 'Read More'}
            />
          ))}
        </div>
      </Section>
    </>
  );
}
