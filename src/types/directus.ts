export type DirectusAssetRef = {
  id?: string;
};

export type DirectusProductItem = {
  id: string | number;
  product_code?: string;
  category_level_1?: string | { id?: string | number; slug_en?: string; slug_zh?: string; name_en?: string; name_zh?: string };
  slug_en?: string;
  slug_zh?: string;
  name_zh?: string;
  name_en?: string;
  summary_zh?: string;
  summary_en?: string;
  description_zh?: string;
  description_en?: string;
  features_zh?: string | string[];
  features_en?: string | string[];
  applications_zh?: string | string[];
  applications_en?: string | string[];
  material?: string;
  specification?: string;
  cover_image?: string | DirectusAssetRef | null;
  is_featured?: boolean;
  status?: string;
  sort_order?: number;
};

export type DirectusIndustryItem = {
  id: string | number;
  slug_zh?: string;
  slug_en?: string;
  name_zh?: string;
  name_en?: string;
  summary_zh?: string;
  summary_en?: string;
  solution_content_zh?: string;
  solution_content_en?: string;
  status?: string;
};

export type DirectusCaseItem = {
  id: string | number;
  slug_zh?: string;
  slug_en?: string;
  title_zh?: string;
  title_en?: string;
  summary_zh?: string;
  summary_en?: string;
  country_id?: { name_en?: string; name_zh?: string } | string;
  status?: string;
};

export type DirectusBlogItem = {
  id: string | number;
  slug_zh?: string;
  slug_en?: string;
  title_zh?: string;
  title_en?: string;
  excerpt_zh?: string;
  excerpt_en?: string;
  content_zh?: string;
  content_en?: string;
  category_id?: { slug_en?: string; slug_zh?: string; name_en?: string; name_zh?: string } | string;
  status?: string;
};

export type DirectusPageItem = {
  id: string | number;
  page_key?: string;
  title_zh?: string;
  title_en?: string;
  subtitle_zh?: string;
  subtitle_en?: string;
  content_zh?: string;
  content_en?: string;
  seo_title_zh?: string;
  seo_title_en?: string;
  seo_description_zh?: string;
  seo_description_en?: string;
  slug_zh?: string;
  slug_en?: string;
  status?: string;
};

export type DirectusDownloadItem = {
  id: string | number;
  title_zh?: string;
  title_en?: string;
  description_zh?: string;
  description_en?: string;
  file?: { id?: string; filename_download?: string } | string | null;
  file_type?: string;
  download_category?: string;
  status?: string;
};

export type DirectusCertificationItem = {
  id: string | number;
  title_zh?: string;
  title_en?: string;
  description_zh?: string;
  description_en?: string;
  certificate_type?: string;
  issued_by?: string;
  valid_until?: string;
  file?: { id?: string; filename_download?: string } | string | null;
  image?: { id?: string } | string | null;
  status?: string;
};

export type DirectusSiteSettingsItem = {
  id?: string | number;
  site_name_zh?: string;
  site_name_en?: string;
  company_name_zh?: string;
  company_name_en?: string;
  logo?: { id?: string } | string | null;
  favicon?: { id?: string } | string | null;
  email?: string;
  phone?: string;
  whatsapp?: string;
  wechat?: string;
  address_zh?: string;
  address_en?: string;
  default_seo_title_zh?: string;
  default_seo_title_en?: string;
  default_seo_description_zh?: string;
  default_seo_description_en?: string;
};
