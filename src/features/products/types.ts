export type ProductCard = {
  id: string;
  productCode?: string;
  category: string;
  categoryLabel?: string;
  subcategory?: string;
  subcategoryLabel?: string;
  slug: string;
  name: string;
  summary: string;
  imageUrl?: string | null;
};

export type ProductCategory = {
  id: string;
  slug: string;
  label: string;
  parentId?: string | null;
  parentSlug?: string | null;
  parentLabel?: string | null;
  children: ProductCategory[];
};

export type ProductDetail = ProductCard & {
  description?: string;
  features: string[];
  material?: string;
  specification?: string;
  applications: string[];
};
