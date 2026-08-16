'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import type { ProductCategory } from '@/features/products/types';
import type { Locale } from '@/lib/constants/site';
import { buildLocalizedProductCategoryPath } from '@/features/products/api';

type ProductCategoryNavigationProps = {
  locale: Locale;
  categories: ProductCategory[];
  activeLevel1Id?: string;
  activeLevel2Id?: string;
  allLabel: string;
};

export function ProductCategoryNavigation({
  locale,
  categories,
  activeLevel1Id,
  activeLevel2Id,
  allLabel,
}: ProductCategoryNavigationProps) {
  const [openLevel1Id, setOpenLevel1Id] = useState<string | null>(activeLevel1Id ?? null);

  useEffect(() => {
    setOpenLevel1Id(activeLevel1Id ?? null);
  }, [activeLevel1Id]);

  const labels = useMemo(
    () =>
      locale === 'zh'
        ? {
            allInCategory: (label: string) => `${label} 全部产品`,
            expand: '展开二级类目',
            collapse: '收拢二级类目',
          }
        : {
            allInCategory: (label: string) => `All in ${label}`,
            expand: 'Expand subcategories',
            collapse: 'Collapse subcategories',
          },
    [locale],
  );

  return (
    <nav aria-label="Product categories" className="product-category-tree">
      <Link
        className={`product-category-tree__link product-category-tree__link--level1${!activeLevel1Id ? ' product-category-tree__link--active' : ''}`}
        href={`/${locale}/products`}
      >
        {allLabel}
      </Link>

      {categories.map((category) => {
        const hasChildren = category.children.length > 0;
        const isOpen = openLevel1Id === category.id;

        return (
          <div className="product-category-tree__group" key={category.id}>
            {hasChildren ? (
              <button
                aria-expanded={isOpen}
                aria-label={isOpen ? labels.collapse : labels.expand}
                className={`product-category-tree__button product-category-tree__link product-category-tree__link--level1${
                  activeLevel1Id === category.id ? ' product-category-tree__link--active' : ''
                }`}
                onClick={() => setOpenLevel1Id((current) => (current === category.id ? null : category.id))}
                type="button"
              >
                <span>{category.label}</span>
                <span className={`product-category-tree__chevron${isOpen ? ' product-category-tree__chevron--open' : ''}`}>▾</span>
              </button>
            ) : (
              <Link
                className={`product-category-tree__link product-category-tree__link--level1${activeLevel1Id === category.id ? ' product-category-tree__link--active' : ''}`}
                href={buildLocalizedProductCategoryPath(locale, category.id)}
              >
                {category.label}
              </Link>
            )}

            {isOpen && hasChildren ? (
              <div className="product-category-tree__children">
                <Link
                  className={`product-category-tree__link product-category-tree__link--level2${
                    activeLevel1Id === category.id && !activeLevel2Id ? ' product-category-tree__link--active' : ''
                  }`}
                  href={buildLocalizedProductCategoryPath(locale, category.id)}
                >
                  {labels.allInCategory(category.label)}
                </Link>
                {category.children.map((child) => (
                  <Link
                    className={`product-category-tree__link product-category-tree__link--level2${
                      activeLevel1Id === category.id && activeLevel2Id === child.id ? ' product-category-tree__link--active' : ''
                    }`}
                    href={buildLocalizedProductCategoryPath(locale, category.id, child.id)}
                    key={child.id}
                  >
                    {child.label}
                  </Link>
                ))}
              </div>
            ) : null}
          </div>
        );
      })}
    </nav>
  );
}
