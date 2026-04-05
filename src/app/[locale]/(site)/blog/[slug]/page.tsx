import { notFound } from 'next/navigation';
import { Breadcrumbs } from '@/components/layout/breadcrumbs';
import { RichText } from '@/components/ui/rich-text';
import { Section } from '@/components/ui/section';
import { getBlogPost } from '@/features/blog/api';
import { buildMetadata } from '@/lib/seo/metadata';
import { isLocale } from '@/lib/i18n/locale';

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const post = await getBlogPost(locale, slug);
  if (!post) return {};
  return buildMetadata({ locale, title: post.title, description: post.excerpt, path: `/blog/${slug}` });
}

export default async function BlogDetailPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const post = await getBlogPost(locale, slug);
  if (!post) notFound();
  const t = locale === 'zh' ? { home: '首页', blog: '资讯博客' } : { home: 'Home', blog: 'Blog' };

  return (
    <Section
      eyebrow={post.category}
      title={post.title}
      description={post.excerpt}
      actions={
        <Breadcrumbs
          items={[
            { label: t.home, href: `/${locale}` },
            { label: t.blog, href: `/${locale}/blog` },
            { label: post.title },
          ]}
        />
      }
    >
      <div className="card">
        <RichText
          content={
            post.content ||
            (locale === 'zh'
              ? '这里可以展示完整文章正文、采购建议、材料对比或行业知识内容。'
              : 'This section can present the full article body, buying guidance, material comparisons, or industry knowledge.')
          }
        />
      </div>
    </Section>
  );
}
