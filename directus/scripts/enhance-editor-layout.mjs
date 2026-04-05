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

async function getFields(collection) {
  const result = await api('GET', `/fields/${collection}`);
  return result?.data || [];
}

async function ensureDivider(collection, field, title, sort, icon = 'segment') {
  const fields = await getFields(collection);
  const exists = fields.find((item) => item.field === field);

  const payload = {
    type: 'alias',
    meta: {
      special: ['alias', 'no-data'],
      interface: 'presentation-divider',
      options: { title, icon },
      width: 'full',
      sort,
      hidden: false,
      readonly: false,
    },
  };

  if (exists) {
    await api('PATCH', `/fields/${collection}/${field}`, payload);
    console.log(`patched divider: ${collection}.${field}`);
  } else {
    await api('POST', `/fields/${collection}`, { field, ...payload });
    console.log(`created divider: ${collection}.${field}`);
  }
}

async function patchFieldMeta(collection, field, meta) {
  await api('PATCH', `/fields/${collection}/${field}`, { meta });
  console.log(`patched sort/meta: ${collection}.${field}`);
}

const layouts = {
  products: {
    dividers: [
      ['basic_divider', '基础信息', 1, 'inventory_2'],
      ['zh_content_divider', '中文内容', 9, 'translate'],
      ['en_content_divider', '英文内容', 14, 'translate'],
      ['media_relation_divider', '图片/关联/下载', 19, 'perm_media'],
      ['publish_divider', '发布设置', 28, 'publish'],
    ],
    fields: {
      product_code: 2,
      name_zh: 3,
      name_en: 4,
      material: 5,
      specification: 6,
      category_level_1: 7,
      category_level_2: 8,
      summary_zh: 10,
      description_zh: 11,
      features_zh: 12,
      applications_zh: 13,
      summary_en: 15,
      description_en: 16,
      features_en: 17,
      applications_en: 18,
      cover_image: 20,
      gallery: 21,
      industries: 22,
      related_cases: 23,
      related_products: 24,
      downloads: 25,
      certifications: 26,
      slug_zh: 29,
      slug_en: 30,
      is_featured: 31,
      is_new: 32,
      is_hot: 33,
      status: 34,
      sort_order: 35,
    },
  },
  pages: {
    dividers: [
      ['basic_divider', '基础信息', 1, 'article'],
      ['zh_content_divider', '中文内容', 5, 'translate'],
      ['en_content_divider', '英文内容', 8, 'translate'],
      ['seo_divider', 'SEO 设置', 11, 'search'],
    ],
    fields: {
      page_key: 2,
      slug_zh: 3,
      slug_en: 4,
      title_zh: 6,
      subtitle_zh: 7,
      content_zh: 8,
      title_en: 9,
      subtitle_en: 10,
      content_en: 11,
      seo_title_zh: 12,
      seo_description_zh: 13,
      seo_title_en: 14,
      seo_description_en: 15,
      status: 16,
      sort_order: 17,
    },
  },
  site_settings: {
    dividers: [
      ['brand_divider', '品牌信息', 1, 'branding_watermark'],
      ['contact_divider', '联系信息', 6, 'call'],
      ['seo_divider', '默认 SEO', 12, 'search'],
    ],
    fields: {
      site_name_zh: 2,
      site_name_en: 3,
      company_name_zh: 4,
      company_name_en: 5,
      logo: 6,
      favicon: 7,
      email: 8,
      phone: 9,
      whatsapp: 10,
      wechat: 11,
      address_zh: 12,
      address_en: 13,
      default_seo_title_zh: 14,
      default_seo_description_zh: 15,
      default_seo_title_en: 16,
      default_seo_description_en: 17,
      social_links: 18,
    },
  },
  downloads: {
    dividers: [
      ['basic_divider', '基础信息', 1, 'download'],
      ['file_divider', '文件上传', 6, 'attach_file'],
      ['publish_divider', '发布设置', 9, 'publish'],
    ],
    fields: {
      title_zh: 2,
      title_en: 3,
      description_zh: 4,
      description_en: 5,
      file: 7,
      file_type: 8,
      download_category: 9,
      status: 10,
      sort_order: 11,
    },
  },
  certifications: {
    dividers: [
      ['basic_divider', '基础信息', 1, 'verified'],
      ['file_divider', '证书文件与图片', 6, 'image'],
      ['publish_divider', '发布设置', 10, 'publish'],
    ],
    fields: {
      title_zh: 2,
      title_en: 3,
      description_zh: 4,
      description_en: 5,
      certificate_type: 6,
      issued_by: 7,
      valid_until: 8,
      file: 9,
      image: 10,
      status: 11,
      sort_order: 12,
    },
  },
  blog_posts: {
    dividers: [
      ['basic_divider', '基础信息', 1, 'edit_note'],
      ['zh_content_divider', '中文内容', 5, 'translate'],
      ['en_content_divider', '英文内容', 8, 'translate'],
      ['publish_divider', '发布设置', 11, 'publish'],
    ],
    fields: {
      category_id: 2,
      slug_zh: 3,
      slug_en: 4,
      title_zh: 6,
      excerpt_zh: 7,
      content_zh: 8,
      title_en: 9,
      excerpt_en: 10,
      content_en: 11,
      published_at: 12,
      is_featured: 13,
      status: 14,
    },
  },
  case_studies: {
    dividers: [
      ['basic_divider', '基础信息', 1, 'fact_check'],
      ['zh_content_divider', '中文内容', 6, 'translate'],
      ['en_content_divider', '英文内容', 10, 'translate'],
      ['relation_divider', '关联信息', 14, 'hub'],
      ['publish_divider', '发布设置', 18, 'publish'],
    ],
    fields: {
      title_zh: 2,
      title_en: 3,
      country_id: 4,
      industry_id: 5,
      summary_zh: 7,
      background_zh: 8,
      solution_zh: 9,
      result_zh: 10,
      summary_en: 11,
      background_en: 12,
      solution_en: 13,
      result_en: 14,
      products: 15,
      slug_zh: 16,
      slug_en: 17,
      status: 19,
      sort_order: 20,
    },
  },
  industries: {
    dividers: [
      ['basic_divider', '基础信息', 1, 'apartment'],
      ['zh_content_divider', '中文内容', 5, 'translate'],
      ['en_content_divider', '英文内容', 8, 'translate'],
      ['publish_divider', '发布设置', 11, 'publish'],
    ],
    fields: {
      name_zh: 2,
      name_en: 3,
      slug_zh: 4,
      slug_en: 5,
      summary_zh: 6,
      pain_points_zh: 7,
      solution_content_zh: 8,
      summary_en: 9,
      pain_points_en: 10,
      solution_content_en: 11,
      status: 12,
      sort_order: 13,
    },
  },
  inquiries: {
    dividers: [
      ['contact_divider', '客户信息', 1, 'person'],
      ['request_divider', '询盘内容', 7, 'request_quote'],
      ['followup_divider', '跟进信息', 14, 'manage_accounts'],
    ],
    fields: {
      name: 2,
      company_name: 3,
      country: 4,
      email: 5,
      phone: 6,
      whatsapp: 7,
      product_name: 8,
      quantity: 9,
      spec_requirements: 10,
      message: 11,
      attachment: 12,
      source_page: 13,
      source_language: 14,
      status: 15,
      assigned_to: 16,
      created_at: 17,
    },
  },
};

for (const [collection, layout] of Object.entries(layouts)) {
  for (const divider of layout.dividers) {
    await ensureDivider(collection, ...divider);
  }
  for (const [field, sort] of Object.entries(layout.fields)) {
    await patchFieldMeta(collection, field, { sort });
  }
}
