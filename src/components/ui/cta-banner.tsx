import Link from 'next/link';
import type { Locale } from '@/lib/constants/site';
import { Container } from '@/components/ui/container';

export function CtaBanner({ locale }: { locale: Locale }) {
  const copy =
    locale === 'zh'
      ? {
          eyebrow: '立即沟通',
          title: '把产品清单、规格和采购需求发给我们',
          description: '我们已经把官网结构搭好，后续只需要继续接真实内容和正式设计即可进入交付状态。',
          primary: '在线询价',
          secondary: '联系我们',
        }
      : {
          eyebrow: 'Get Started',
          title: 'Send us your product list, specifications, and purchasing requirements',
          description: 'The website is ready for final CMS content, visual refinement, and production delivery.',
          primary: 'Request a Quote',
          secondary: 'Contact Us',
        };

  return (
    <section className="section">
      <Container>
        <div className="cta-banner">
          <div>
            <span className="eyebrow">{copy.eyebrow}</span>
            <h2 className="h2">{copy.title}</h2>
            <p className="text-muted">{copy.description}</p>
          </div>
          <div className="page-hero__actions">
            <Link className="button button--primary" href={`/${locale}/quote`}>
              {copy.primary}
            </Link>
            <Link className="button button--ghost" href={`/${locale}/contact`}>
              {copy.secondary}
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}
