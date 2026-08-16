const BASE_URL = process.env.DIRECTUS_URL || 'http://127.0.0.1:8055';
const TOKEN = process.env.ADMIN_TOKEN || process.env.DIRECTUS_ADMIN_TOKEN || '';

async function api(method, endpoint, body) {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`${method} ${endpoint} failed: ${response.status} ${text}`);
  }

  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

async function patchCollection(collection, meta) {
  await api('PATCH', `/collections/${collection}`, { meta });
  console.log(`patched collection: ${collection}`);
}

async function patchField(collection, field, meta) {
  await api('PATCH', `/fields/${collection}/${field}`, { meta });
  console.log(`  patched field: ${collection}.${field}`);
}

const collectionMetas = {
  pages: { icon: 'article', note: '单页内容管理', display_template: '{{ page_key }} | {{ title_zh }}', translations: [{ language: 'zh-CN', translation: '页面', singular: '页面', plural: '页面' }, { language: 'en-US', translation: 'Pages', singular: 'Page', plural: 'Pages' }] },
  home_banners: { icon: 'view_carousel', note: '首页 Banner 轮播管理', display_template: '{{ id }}', translations: [{ language: 'zh-CN', translation: '首页 Banner', singular: '首页 Banner', plural: '首页 Banner' }, { language: 'en-US', translation: 'Home Banners', singular: 'Home Banner', plural: 'Home Banners' }] },
  products: { icon: 'inventory_2', note: '产品内容管理', display_template: '{{ name_zh }}', translations: [{ language: 'zh-CN', translation: '产品', singular: '产品', plural: '产品' }, { language: 'en-US', translation: 'Products', singular: 'Product', plural: 'Products' }] },
  product_categories: { icon: 'category', note: '产品分类管理', display_template: '{{ name_zh }}', translations: [{ language: 'zh-CN', translation: '产品分类', singular: '产品分类', plural: '产品分类' }, { language: 'en-US', translation: 'Product Categories', singular: 'Product Category', plural: 'Product Categories' }] },
  industries: { icon: 'apartment', note: '行业方案管理', display_template: '{{ name_zh }}', translations: [{ language: 'zh-CN', translation: '行业方案', singular: '行业方案', plural: '行业方案' }, { language: 'en-US', translation: 'Industries', singular: 'Industry', plural: 'Industries' }] },
  case_studies: { icon: 'fact_check', note: '案例内容管理', display_template: '{{ title_zh }}', translations: [{ language: 'zh-CN', translation: '案例', singular: '案例', plural: '案例' }, { language: 'en-US', translation: 'Case Studies', singular: 'Case Study', plural: 'Case Studies' }] },
  blog_posts: { icon: 'edit_note', note: '博客文章管理', display_template: '{{ title_zh }}', translations: [{ language: 'zh-CN', translation: '博客文章', singular: '博客文章', plural: '博客文章' }, { language: 'en-US', translation: 'Blog Posts', singular: 'Blog Post', plural: 'Blog Posts' }] },
  blog_categories: { icon: 'label', note: '博客分类管理', display_template: '{{ name_zh }}', translations: [{ language: 'zh-CN', translation: '博客分类', singular: '博客分类', plural: '博客分类' }, { language: 'en-US', translation: 'Blog Categories', singular: 'Blog Category', plural: 'Blog Categories' }] },
  downloads: { icon: 'download', note: '下载资料管理', display_template: '{{ title_zh }}', translations: [{ language: 'zh-CN', translation: '下载资料', singular: '下载资料', plural: '下载资料' }, { language: 'en-US', translation: 'Downloads', singular: 'Download', plural: 'Downloads' }] },
  certifications: { icon: 'verified', note: '认证资质管理', display_template: '{{ title_zh }}', translations: [{ language: 'zh-CN', translation: '认证资质', singular: '认证资质', plural: '认证资质' }, { language: 'en-US', translation: 'Certifications', singular: 'Certification', plural: 'Certifications' }] },
  inquiries: { icon: 'mail', note: '询盘线索管理', display_template: '{{ name }} | {{ email }}', translations: [{ language: 'zh-CN', translation: '询盘', singular: '询盘', plural: '询盘' }, { language: 'en-US', translation: 'Inquiries', singular: 'Inquiry', plural: 'Inquiries' }] },
  site_settings: { icon: 'settings', note: '网站基础设置', translations: [{ language: 'zh-CN', translation: '网站设置', singular: '网站设置', plural: '网站设置' }, { language: 'en-US', translation: 'Site Settings', singular: 'Site Setting', plural: 'Site Settings' }] },
};

const fieldMetas = {
  pages: {
    page_key: { note: '页面唯一标识', width: 'half', translations: [{ language: 'zh-CN', translation: '页面标识' }] },
    title_zh: { note: '页面中文标题', width: 'half', translations: [{ language: 'zh-CN', translation: '中文标题' }] },
    title_en: { note: '页面英文标题', width: 'half', translations: [{ language: 'zh-CN', translation: '英文标题' }] },
    subtitle_zh: { interface: 'input-multiline', width: 'full', translations: [{ language: 'zh-CN', translation: '中文副标题' }] },
    subtitle_en: { interface: 'input-multiline', width: 'full', translations: [{ language: 'zh-CN', translation: '英文副标题' }] },
    content_zh: { interface: 'input-multiline', width: 'full', translations: [{ language: 'zh-CN', translation: '中文正文' }] },
    content_en: { interface: 'input-multiline', width: 'full', translations: [{ language: 'zh-CN', translation: '英文正文' }] },
    seo_title_zh: { width: 'half', translations: [{ language: 'zh-CN', translation: '中文SEO标题' }] },
    seo_title_en: { width: 'half', translations: [{ language: 'zh-CN', translation: '英文SEO标题' }] },
    seo_description_zh: { interface: 'input-multiline', width: 'half', translations: [{ language: 'zh-CN', translation: '中文SEO描述' }] },
    seo_description_en: { interface: 'input-multiline', width: 'half', translations: [{ language: 'zh-CN', translation: '英文SEO描述' }] },
    slug_zh: { width: 'half', translations: [{ language: 'zh-CN', translation: '中文链接标识' }] },
    slug_en: { width: 'half', translations: [{ language: 'zh-CN', translation: '英文链接标识' }] },
    status: { width: 'half', translations: [{ language: 'zh-CN', translation: '发布状态' }] }
  },
  home_banners: {
    image: { interface: 'file', display: 'image', width: 'full', note: '首页 Banner 图片上传字段', translations: [{ language: 'zh-CN', translation: 'Banner 图片' }] },
    status: { width: 'half', translations: [{ language: 'zh-CN', translation: '发布状态' }] },
    sort_order: { width: 'half', translations: [{ language: 'zh-CN', translation: '排序值' }] }
  },
  products: {
    product_code: { width: 'half', note: '内部产品编号', translations: [{ language: 'zh-CN', translation: '产品编号' }] },
    name_zh: { width: 'half', translations: [{ language: 'zh-CN', translation: '中文产品名称' }] },
    name_en: { width: 'half', translations: [{ language: 'zh-CN', translation: '英文产品名称' }] },
    summary_zh: { interface: 'input-multiline', width: 'full', translations: [{ language: 'zh-CN', translation: '中文简介' }] },
    summary_en: { interface: 'input-multiline', width: 'full', translations: [{ language: 'zh-CN', translation: '英文简介' }] },
    description_zh: { interface: 'input-multiline', width: 'full', translations: [{ language: 'zh-CN', translation: '中文详情' }] },
    description_en: { interface: 'input-multiline', width: 'full', translations: [{ language: 'zh-CN', translation: '英文详情' }] },
    features_zh: { interface: 'input-multiline', width: 'half', note: '每行一个特点', translations: [{ language: 'zh-CN', translation: '中文特点' }] },
    features_en: { interface: 'input-multiline', width: 'half', note: '每行一个特点', translations: [{ language: 'zh-CN', translation: '英文特点' }] },
    applications_zh: { interface: 'input-multiline', width: 'half', note: '每行一个应用场景', translations: [{ language: 'zh-CN', translation: '中文应用场景' }] },
    applications_en: { interface: 'input-multiline', width: 'half', note: '每行一个应用场景', translations: [{ language: 'zh-CN', translation: '英文应用场景' }] },
    material: { width: 'half', translations: [{ language: 'zh-CN', translation: '材质' }] },
    specification: { width: 'half', translations: [{ language: 'zh-CN', translation: '规格' }] },
    cover_image: { interface: 'file', display: 'image', width: 'half', note: '产品主图上传字段', translations: [{ language: 'zh-CN', translation: '产品主图' }] },
    gallery: { interface: 'input-multiline', width: 'full', note: '如后续需要多图，可进一步改成附件/多图方案', translations: [{ language: 'zh-CN', translation: '产品相册' }] },
    category_level_1: { width: 'half', translations: [{ language: 'zh-CN', translation: '主分类' }] },
    category_level_2: { width: 'half', translations: [{ language: 'zh-CN', translation: '二级分类' }] },
    industries: { width: 'full', translations: [{ language: 'zh-CN', translation: '关联行业方案' }] },
    related_cases: { width: 'full', translations: [{ language: 'zh-CN', translation: '关联案例' }] },
    related_products: { width: 'full', translations: [{ language: 'zh-CN', translation: '关联产品' }] },
    downloads: { width: 'full', translations: [{ language: 'zh-CN', translation: '关联下载资料' }] },
    certifications: { width: 'full', translations: [{ language: 'zh-CN', translation: '关联认证资质' }] },
    is_featured: { interface: 'boolean', width: 'half', translations: [{ language: 'zh-CN', translation: '首页推荐' }] },
    is_new: { interface: 'boolean', width: 'half', translations: [{ language: 'zh-CN', translation: '新品' }] },
    is_hot: { interface: 'boolean', width: 'half', translations: [{ language: 'zh-CN', translation: '热门' }] },
    status: { width: 'half', translations: [{ language: 'zh-CN', translation: '发布状态' }] },
    sort_order: { width: 'half', translations: [{ language: 'zh-CN', translation: '排序值' }] }
  },
  product_categories: { name_zh: { translations: [{ language: 'zh-CN', translation: '中文分类名' }] }, name_en: { translations: [{ language: 'zh-CN', translation: '英文分类名' }] }, description_zh: { interface: 'input-multiline', translations: [{ language: 'zh-CN', translation: '中文说明' }] }, description_en: { interface: 'input-multiline', translations: [{ language: 'zh-CN', translation: '英文说明' }] }, parent_id: { translations: [{ language: 'zh-CN', translation: '上级分类' }] }, slug_zh: { translations: [{ language: 'zh-CN', translation: '中文链接标识' }] }, slug_en: { translations: [{ language: 'zh-CN', translation: '英文链接标识' }] }, status: { translations: [{ language: 'zh-CN', translation: '发布状态' }] } },
  industries: { name_zh: { translations: [{ language: 'zh-CN', translation: '中文行业名称' }] }, name_en: { translations: [{ language: 'zh-CN', translation: '英文行业名称' }] }, summary_zh: { interface: 'input-multiline', translations: [{ language: 'zh-CN', translation: '中文简介' }] }, summary_en: { interface: 'input-multiline', translations: [{ language: 'zh-CN', translation: '英文简介' }] }, pain_points_zh: { interface: 'input-multiline', translations: [{ language: 'zh-CN', translation: '中文痛点' }] }, pain_points_en: { interface: 'input-multiline', translations: [{ language: 'zh-CN', translation: '英文痛点' }] }, solution_content_zh: { interface: 'input-multiline', translations: [{ language: 'zh-CN', translation: '中文方案内容' }] }, solution_content_en: { interface: 'input-multiline', translations: [{ language: 'zh-CN', translation: '英文方案内容' }] }, slug_zh: { translations: [{ language: 'zh-CN', translation: '中文链接标识' }] }, slug_en: { translations: [{ language: 'zh-CN', translation: '英文链接标识' }] }, status: { translations: [{ language: 'zh-CN', translation: '发布状态' }] } },
  case_studies: { title_zh: { translations: [{ language: 'zh-CN', translation: '中文案例标题' }] }, title_en: { translations: [{ language: 'zh-CN', translation: '英文案例标题' }] }, summary_zh: { interface: 'input-multiline', translations: [{ language: 'zh-CN', translation: '中文简介' }] }, summary_en: { interface: 'input-multiline', translations: [{ language: 'zh-CN', translation: '英文简介' }] }, background_zh: { interface: 'input-multiline', translations: [{ language: 'zh-CN', translation: '中文项目背景' }] }, background_en: { interface: 'input-multiline', translations: [{ language: 'zh-CN', translation: '英文项目背景' }] }, solution_zh: { interface: 'input-multiline', translations: [{ language: 'zh-CN', translation: '中文解决方案' }] }, solution_en: { interface: 'input-multiline', translations: [{ language: 'zh-CN', translation: '英文解决方案' }] }, result_zh: { interface: 'input-multiline', translations: [{ language: 'zh-CN', translation: '中文项目成果' }] }, result_en: { interface: 'input-multiline', translations: [{ language: 'zh-CN', translation: '英文项目成果' }] }, country_id: { translations: [{ language: 'zh-CN', translation: '国家/地区' }] }, industry_id: { translations: [{ language: 'zh-CN', translation: '所属行业' }] }, products: { translations: [{ language: 'zh-CN', translation: '关联产品' }] }, slug_zh: { translations: [{ language: 'zh-CN', translation: '中文链接标识' }] }, slug_en: { translations: [{ language: 'zh-CN', translation: '英文链接标识' }] }, status: { translations: [{ language: 'zh-CN', translation: '发布状态' }] } },
  blog_categories: { name_zh: { translations: [{ language: 'zh-CN', translation: '中文分类名' }] }, name_en: { translations: [{ language: 'zh-CN', translation: '英文分类名' }] }, slug_zh: { translations: [{ language: 'zh-CN', translation: '中文链接标识' }] }, slug_en: { translations: [{ language: 'zh-CN', translation: '英文链接标识' }] }, status: { translations: [{ language: 'zh-CN', translation: '发布状态' }] } },
  blog_posts: { title_zh: { translations: [{ language: 'zh-CN', translation: '中文文章标题' }] }, title_en: { translations: [{ language: 'zh-CN', translation: '英文文章标题' }] }, excerpt_zh: { interface: 'input-multiline', translations: [{ language: 'zh-CN', translation: '中文摘要' }] }, excerpt_en: { interface: 'input-multiline', translations: [{ language: 'zh-CN', translation: '英文摘要' }] }, content_zh: { interface: 'input-multiline', translations: [{ language: 'zh-CN', translation: '中文正文' }] }, content_en: { interface: 'input-multiline', translations: [{ language: 'zh-CN', translation: '英文正文' }] }, category_id: { translations: [{ language: 'zh-CN', translation: '文章分类' }] }, slug_zh: { translations: [{ language: 'zh-CN', translation: '中文链接标识' }] }, slug_en: { translations: [{ language: 'zh-CN', translation: '英文链接标识' }] }, published_at: { translations: [{ language: 'zh-CN', translation: '发布时间' }] }, status: { translations: [{ language: 'zh-CN', translation: '发布状态' }] }, is_featured: { interface: 'boolean', translations: [{ language: 'zh-CN', translation: '推荐文章' }] } },
  downloads: { title_zh: { translations: [{ language: 'zh-CN', translation: '中文标题' }] }, title_en: { translations: [{ language: 'zh-CN', translation: '英文标题' }] }, description_zh: { interface: 'input-multiline', translations: [{ language: 'zh-CN', translation: '中文说明' }] }, description_en: { interface: 'input-multiline', translations: [{ language: 'zh-CN', translation: '英文说明' }] }, file: { interface: 'file', width: 'half', note: '上传 PDF 或其他文件', translations: [{ language: 'zh-CN', translation: '上传文件' }] }, file_type: { width: 'half', translations: [{ language: 'zh-CN', translation: '文件类型' }] }, download_category: { width: 'half', translations: [{ language: 'zh-CN', translation: '下载分类' }] }, status: { width: 'half', translations: [{ language: 'zh-CN', translation: '发布状态' }] } },
  certifications: { title_zh: { translations: [{ language: 'zh-CN', translation: '中文标题' }] }, title_en: { translations: [{ language: 'zh-CN', translation: '英文标题' }] }, description_zh: { interface: 'input-multiline', translations: [{ language: 'zh-CN', translation: '中文说明' }] }, description_en: { interface: 'input-multiline', translations: [{ language: 'zh-CN', translation: '英文说明' }] }, certificate_type: { translations: [{ language: 'zh-CN', translation: '证书类型' }] }, issued_by: { translations: [{ language: 'zh-CN', translation: '签发机构' }] }, valid_until: { translations: [{ language: 'zh-CN', translation: '有效期' }] }, file: { interface: 'file', width: 'half', translations: [{ language: 'zh-CN', translation: '证书文件' }] }, image: { interface: 'file', display: 'image', width: 'half', translations: [{ language: 'zh-CN', translation: '证书图片' }] }, status: { translations: [{ language: 'zh-CN', translation: '发布状态' }] } },
  inquiries: { name: { translations: [{ language: 'zh-CN', translation: '联系人姓名' }] }, company_name: { translations: [{ language: 'zh-CN', translation: '公司名称' }] }, country: { translations: [{ language: 'zh-CN', translation: '国家/地区' }] }, email: { translations: [{ language: 'zh-CN', translation: '邮箱' }] }, phone: { translations: [{ language: 'zh-CN', translation: '电话' }] }, whatsapp: { translations: [{ language: 'zh-CN', translation: 'WhatsApp' }] }, product_name: { translations: [{ language: 'zh-CN', translation: '产品名称' }] }, quantity: { translations: [{ language: 'zh-CN', translation: '数量' }] }, spec_requirements: { interface: 'input-multiline', translations: [{ language: 'zh-CN', translation: '规格要求' }] }, message: { interface: 'input-multiline', translations: [{ language: 'zh-CN', translation: '留言内容' }] }, attachment: { interface: 'file', translations: [{ language: 'zh-CN', translation: '附件' }] }, source_page: { translations: [{ language: 'zh-CN', translation: '来源页面' }] }, source_language: { translations: [{ language: 'zh-CN', translation: '来源语言' }] }, status: { translations: [{ language: 'zh-CN', translation: '跟进状态' }] }, assigned_to: { translations: [{ language: 'zh-CN', translation: '分配给' }] }, created_at: { translations: [{ language: 'zh-CN', translation: '创建时间' }] } },
  site_settings: { site_name_zh: { translations: [{ language: 'zh-CN', translation: '站点中文名称' }] }, site_name_en: { translations: [{ language: 'zh-CN', translation: '站点英文名称' }] }, company_name_zh: { translations: [{ language: 'zh-CN', translation: '公司中文名称' }] }, company_name_en: { translations: [{ language: 'zh-CN', translation: '公司英文名称' }] }, logo: { interface: 'file', display: 'image', width: 'half', translations: [{ language: 'zh-CN', translation: '网站 Logo' }] }, favicon: { interface: 'file', display: 'image', width: 'half', translations: [{ language: 'zh-CN', translation: '网站图标' }] }, email: { translations: [{ language: 'zh-CN', translation: '联系邮箱' }] }, phone: { translations: [{ language: 'zh-CN', translation: '联系电话' }] }, whatsapp: { translations: [{ language: 'zh-CN', translation: 'WhatsApp' }] }, wechat: { translations: [{ language: 'zh-CN', translation: '微信' }] }, address_zh: { interface: 'input-multiline', translations: [{ language: 'zh-CN', translation: '中文地址' }] }, address_en: { interface: 'input-multiline', translations: [{ language: 'zh-CN', translation: '英文地址' }] }, default_seo_title_zh: { translations: [{ language: 'zh-CN', translation: '默认中文SEO标题' }] }, default_seo_title_en: { translations: [{ language: 'zh-CN', translation: '默认英文SEO标题' }] }, default_seo_description_zh: { interface: 'input-multiline', translations: [{ language: 'zh-CN', translation: '默认中文SEO描述' }] }, default_seo_description_en: { interface: 'input-multiline', translations: [{ language: 'zh-CN', translation: '默认英文SEO描述' }] }, social_links: { interface: 'input-multiline', translations: [{ language: 'zh-CN', translation: '社交链接' }] } }
};

for (const [collection, meta] of Object.entries(collectionMetas)) {
  await patchCollection(collection, meta);
}
for (const [collection, fields] of Object.entries(fieldMetas)) {
  for (const [field, meta] of Object.entries(fields)) {
    await patchField(collection, field, meta);
  }
}
