import Link from 'next/link';

type BreadcrumbItem = {
  label: string;
  href?: string;
};

export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="breadcrumb list-reset">
        {items.map((item, index) => (
          <li className="breadcrumb__item" key={`${item.label}-${index}`}>
            {item.href ? <Link href={item.href}>{item.label}</Link> : <span>{item.label}</span>}
            {index < items.length - 1 ? <span className="breadcrumb__separator">/</span> : null}
          </li>
        ))}
      </ol>
    </nav>
  );
}
