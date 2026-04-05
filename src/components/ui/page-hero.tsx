import type { ReactNode } from 'react';
import { Container } from '@/components/ui/container';

type PageHeroProps = {
  eyebrow: string;
  title: string;
  description?: string;
  actions?: ReactNode;
};

export function PageHero({ eyebrow, title, description, actions }: PageHeroProps) {
  return (
    <section className="page-hero">
      <Container>
        <div className="page-hero__panel">
          <span className="eyebrow">{eyebrow}</span>
          <h1 className="h2">{title}</h1>
          {description ? <p className="text-muted page-hero__description">{description}</p> : null}
          {actions ? <div className="page-hero__actions">{actions}</div> : null}
        </div>
      </Container>
    </section>
  );
}
