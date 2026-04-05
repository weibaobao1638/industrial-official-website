import Link from 'next/link';

type ContentCardProps = {
  eyebrow?: string;
  title: string;
  description: string;
  imageUrl?: string | null;
  href?: string;
  ctaLabel?: string;
  meta?: string;
  badges?: string[];
  external?: boolean;
};

export function ContentCard({ eyebrow, title, description, imageUrl, href, ctaLabel, meta, badges, external }: ContentCardProps) {
  return (
    <article className="card content-card">
      {imageUrl ? (
        <div className="content-card__image">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageUrl} alt={title} />
        </div>
      ) : null}
      {eyebrow ? <div className="eyebrow">{eyebrow}</div> : null}
      <h3 className="h3">{title}</h3>
      {badges?.length ? (
        <div className="chip-list">
          {badges.map((badge) => (
            <span className="chip" key={badge}>{badge}</span>
          ))}
        </div>
      ) : null}
      <p className="text-muted content-card__description">{description}</p>
      <div className="content-card__footer">
        {meta ? <span className="text-muted">{meta}</span> : <span />}
        {href && ctaLabel ? (
          external ? (
            <a href={href} target="_blank" rel="noreferrer">
              {ctaLabel}
            </a>
          ) : (
            <Link href={href}>{ctaLabel}</Link>
          )
        ) : null}
      </div>
    </article>
  );
}
