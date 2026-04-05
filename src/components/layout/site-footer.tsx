import type { Locale } from '@/lib/constants/site';
import { getDictionary } from '@/lib/i18n/locale';
import { Container } from '@/components/ui/container';
import type { SiteSettings } from '@/features/site/api';
import Link from 'next/link';

export function SiteFooter({ locale, settings }: { locale: Locale; settings: SiteSettings }) {
  const dict = getDictionary(locale);
  const nav = [
    { href: `/${locale}`, label: dict.nav.home },
    { href: `/${locale}/products`, label: dict.nav.products },
    { href: `/${locale}/industries`, label: dict.nav.industries },
    { href: `/${locale}/blog`, label: dict.nav.blog },
    { href: `/${locale}/contact`, label: dict.nav.contact },
  ];

  return (
    <footer className="site-footer">
      <Container>
        <div className="site-footer__inner">
          <div className="stack-md">
            <strong>{settings.companyName || dict.common.tagline}</strong>
            <p className="text-muted">{settings.address || 'Bilingual industrial website frontend powered by Next.js and Directus.'}</p>
            <div className="stack-sm text-muted">
              {settings.email ? <span>Email: {settings.email}</span> : null}
              {settings.phone ? <span>{locale === 'zh' ? '电话' : 'Phone'}: {settings.phone}</span> : null}
              {settings.whatsapp ? <span>WhatsApp: {settings.whatsapp}</span> : null}
            </div>
          </div>
          <div className="stack-md">
            <strong>{locale === 'zh' ? '快速导航' : 'Quick Links'}</strong>
            <div className="footer-links">
              {nav.map((item) => (
                <Link key={item.href} href={item.href}>
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </Container>
    </footer>
  );
}
