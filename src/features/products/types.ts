export type ProductCard = {
  id: string;
  productCode?: string;
  category: string;
  categoryLabel?: string;
  slug: string;
  name: string;
  summary: string;
  imageUrl?: string | null;
};

export type ProductDetail = ProductCard & {
  description?: string;
  features: string[];
  material?: string;
  specification?: string;
  applications: string[];
};
