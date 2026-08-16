import Image from 'next/image';
import Link from 'next/link';

type ContentCardProps = {
  eyebrow?: string;
  title: string;
  description: string;
  imageUrl?: string | null;
  imageSizes?: string;
  imageVariant?: 'default' | 'product';
  href?: string;
  ctaLabel?: string;
  meta?: string;
  badges?: string[];
  external?: boolean;
};

export function ContentCard({
  eyebrow,
  title,
  description,
  imageUrl,
  imageSizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  imageVariant = 'default',
  href,
  ctaLabel,
  meta,
  badges,
  external,
}: ContentCardProps) {
  const image = imageUrl ? (
    <div className={`content-card__image${imageVariant === 'product' ? ' content-card__image--product' : ''}`}>
      <Image src={imageUrl} alt={title} fill sizes={imageSizes} />
    </div>
  ) : null;

  return (
    <article className="card content-card">
      {href && image ? (
        external ? (
          <a className="content-card__image-link" href={href} target="_blank" rel="noreferrer" aria-label={title}>
            {image}
          </a>
        ) : (
          <Link className="content-card__image-link" href={href} aria-label={title}>
            {image}
          </Link>
        )
      ) : (
        image
      )}
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
