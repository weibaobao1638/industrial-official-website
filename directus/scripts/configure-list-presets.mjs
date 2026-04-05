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

async function getAdminUserId() {
  const presets = await api('GET', '/presets');
  const presetUser = presets?.data?.find((item) => item.user)?.user;
  if (presetUser) return presetUser;
  throw new Error('Unable to determine admin user id from presets');
}

async function patchCollection(collection, meta) {
  await api('PATCH', `/collections/${collection}`, { meta });
  console.log(`patched collection meta: ${collection}`);
}

async function upsertPreset(user, collection, preset) {
  const existing = await api('GET', `/presets?filter[user][_eq]=${user}&filter[collection][_eq]=${collection}`);
  const item = existing?.data?.find((entry) => entry.bookmark === null) || null;

  const payload = {
    bookmark: null,
    user,
    role: null,
    collection,
    search: null,
    filters: [],
    ...preset,
  };

  if (item) {
    await api('PATCH', `/presets/${item.id}`, payload);
    console.log(`updated preset: ${collection}`);
  } else {
    await api('POST', '/presets', payload);
    console.log(`created preset: ${collection}`);
  }
}

const collectionMetaUpdates = {
  products: { sort_field: 'sort_order', archive_field: 'status', archive_value: 'archived', unarchive_value: 'draft' },
  product_categories: { sort_field: 'sort_order', archive_field: 'status', archive_value: 'archived', unarchive_value: 'draft' },
  industries: { sort_field: 'sort_order', archive_field: 'status', archive_value: 'archived', unarchive_value: 'draft' },
  case_studies: { sort_field: 'sort_order', archive_field: 'status', archive_value: 'archived', unarchive_value: 'draft' },
  blog_categories: { sort_field: 'sort_order', archive_field: 'status', archive_value: 'archived', unarchive_value: 'draft' },
  blog_posts: { sort_field: 'published_at', archive_field: 'status', archive_value: 'archived', unarchive_value: 'draft' },
  downloads: { sort_field: 'sort_order', archive_field: 'status', archive_value: 'archived', unarchive_value: 'draft' },
  certifications: { sort_field: 'sort_order', archive_field: 'status', archive_value: 'archived', unarchive_value: 'draft' },
};

const presets = {
  products: {
    layout: 'tabular',
    layout_query: { tabular: { sort: ['sort_order', 'name_zh'], fields: ['name_zh', 'category_level_1', 'is_featured', 'status', 'sort_order'], page: 1 } },
    layout_options: { tabular: { widths: { name_zh: 260, category_level_1: 180, is_featured: 120, status: 120, sort_order: 100 } } },
  },
  product_categories: {
    layout: 'tabular',
    layout_query: { tabular: { sort: ['sort_order', 'name_zh'], fields: ['name_zh', 'slug_en', 'status', 'sort_order'], page: 1 } },
    layout_options: { tabular: { widths: { name_zh: 260, slug_en: 220, status: 120, sort_order: 100 } } },
  },
  industries: {
    layout: 'tabular',
    layout_query: { tabular: { sort: ['sort_order', 'name_zh'], fields: ['name_zh', 'slug_en', 'status', 'sort_order'], page: 1 } },
    layout_options: { tabular: { widths: { name_zh: 240, slug_en: 220, status: 120, sort_order: 100 } } },
  },
  case_studies: {
    layout: 'tabular',
    layout_query: { tabular: { sort: ['sort_order', 'title_zh'], fields: ['title_zh', 'country_id', 'status', 'sort_order'], page: 1 } },
    layout_options: { tabular: { widths: { title_zh: 280, country_id: 180, status: 120, sort_order: 100 } } },
  },
  blog_categories: {
    layout: 'tabular',
    layout_query: { tabular: { sort: ['sort_order', 'name_zh'], fields: ['name_zh', 'slug_en', 'status', 'sort_order'], page: 1 } },
    layout_options: { tabular: { widths: { name_zh: 240, slug_en: 220, status: 120, sort_order: 100 } } },
  },
  blog_posts: {
    layout: 'tabular',
    layout_query: { tabular: { sort: ['-published_at'], fields: ['title_zh', 'category_id', 'status', 'published_at', 'is_featured'], page: 1 } },
    layout_options: { tabular: { widths: { title_zh: 320, category_id: 180, status: 120, published_at: 180, is_featured: 120 } } },
  },
  downloads: {
    layout: 'tabular',
    layout_query: { tabular: { sort: ['sort_order', 'title_zh'], fields: ['title_zh', 'download_category', 'file_type', 'status', 'sort_order'], page: 1 } },
    layout_options: { tabular: { widths: { title_zh: 280, download_category: 180, file_type: 120, status: 120, sort_order: 100 } } },
  },
  certifications: {
    layout: 'tabular',
    layout_query: { tabular: { sort: ['sort_order', 'title_zh'], fields: ['title_zh', 'certificate_type', 'issued_by', 'status', 'sort_order'], page: 1 } },
    layout_options: { tabular: { widths: { title_zh: 280, certificate_type: 160, issued_by: 220, status: 120, sort_order: 100 } } },
  },
  inquiries: {
    layout: 'tabular',
    layout_query: { tabular: { sort: ['-created_at'], fields: ['name', 'company_name', 'email', 'product_name', 'status', 'created_at'], page: 1 } },
    layout_options: { tabular: { widths: { name: 160, company_name: 220, email: 240, product_name: 220, status: 140, created_at: 180 } } },
  },
  pages: {
    layout: 'tabular',
    layout_query: { tabular: { sort: ['page_key'], fields: ['page_key', 'title_zh', 'status', 'slug_en'], page: 1 } },
    layout_options: { tabular: { widths: { page_key: 150, title_zh: 260, status: 120, slug_en: 220 } } },
  },
};

const adminUserId = await getAdminUserId();
for (const [collection, meta] of Object.entries(collectionMetaUpdates)) {
  await patchCollection(collection, meta);
}
for (const [collection, preset] of Object.entries(presets)) {
  await upsertPreset(adminUserId, collection, preset);
}
