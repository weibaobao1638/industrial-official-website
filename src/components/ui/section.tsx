import type { PropsWithChildren, ReactNode } from 'react';
import { Container } from '@/components/ui/container';

type SectionProps = PropsWithChildren<{
  eyebrow?: string;
  title?: string;
  description?: string;
  actions?: ReactNode;
}>;

export function Section({ eyebrow, title, description, actions, children }: SectionProps) {
  return (
    <section className="section">
      <Container>
        {(eyebrow || title || description || actions) && (
          <div className="section__header">
            {eyebrow ? <span className="eyebrow">{eyebrow}</span> : null}
            {title ? <h2 className="h2">{title}</h2> : null}
            {description ? <p className="text-muted">{description}</p> : null}
            {actions}
          </div>
        )}
        {children}
      </Container>
    </section>
  );
}
