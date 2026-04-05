import Link from 'next/link';
import type { Locale } from '@/lib/constants/site';
import { getDictionary } from '@/lib/i18n/locale';
import { Container } from '@/components/ui/container';
import type { SitePageContent } from '@/features/pages/api';

export function HeroSection({ locale, page }: { locale: Locale; page?: SitePageContent | null }) {
  const dict = getDictionary(locale);
  const panel =
    locale === 'zh'
      ? {
          title: '官网交付范围',
          products: '产品分类、参数、下载资料与 SEO',
          industries: '行业方案页与案例关联',
          leads: '询盘表单与销售承接流程',
        }
      : {
          title: 'Website delivery scope',
          products: 'Categories, specs, downloads, and SEO',
          industries: 'Solution pages and case links',
          leads: 'Inquiry forms and sales handoff',
        };

  return (
    <section className="hero">
      <Container>
        <div className="hero__wrap">
          <div>
            <span className="eyebrow">B2B Industrial Website</span>
            <h1 className="h1">{page?.title || dict.common.tagline}</h1>
            <p className="text-muted">
              {page?.subtitle ||
                'Build trust with structured product pages, industry solutions, case studies, and a conversion-ready inquiry flow.'}
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 24 }}>
              <Link className="button button--primary" href={`/${locale}/quote`}>{dict.common.getQuote}</Link>
              <Link className="button button--ghost" href={`/${locale}/products`}>{dict.nav.products}</Link>
            </div>
          </div>
          <div className="hero__panel">
            <h2 className="h2">{panel.title}</h2>
            <div className="kpi-list" style={{ marginTop: 20 }}>
              <div className="kpi-item"><strong>{dict.nav.products}</strong><p>{panel.products}</p></div>
              <div className="kpi-item"><strong>{dict.nav.industries}</strong><p>{panel.industries}</p></div>
              <div className="kpi-item"><strong>{locale === 'zh' ? '线索转化' : 'Leads'}</strong><p>{panel.leads}</p></div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
