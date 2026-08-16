const BASE_URL = process.env.DIRECTUS_URL || 'http://127.0.0.1:8055';
const TOKEN = process.env.ADMIN_TOKEN || process.env.DIRECTUS_ADMIN_TOKEN || '';

const CATEGORIES = [
  {
    name_zh: '清洗喷头',
    name_en: 'Cleaning Nozzles',
    description_zh: '用于储罐、容器与工业设备内部清洗的喷头类产品。',
    description_en: 'Nozzle products for tank, vessel, and industrial equipment cleaning.',
    slug_zh: 'cleaning-nozzles',
    slug_en: 'cleaning-nozzles',
    status: 'published',
    sort_order: 1,
  },
  {
    name_zh: '工业接头',
    name_en: 'Industrial Couplings',
    description_zh: '适用于工业流体连接与输送场景的接头类产品。',
    description_en: 'Coupling products for industrial fluid connection and transfer systems.',
    slug_zh: 'industrial-couplings',
    slug_en: 'industrial-couplings',
    status: 'published',
    sort_order: 2,
  },
  {
    name_zh: '工业软管',
    name_en: 'Industrial Hoses',
    description_zh: '覆盖输油、空气、蒸汽、食品与复合介质输送的软管产品。',
    description_en: 'Industrial hose products for oil, air, steam, food, and composite media transfer.',
    slug_zh: 'industrial-hoses',
    slug_en: 'industrial-hoses',
    status: 'published',
    sort_order: 3,
  },
  {
    name_zh: '安全卡箍',
    name_en: 'Safety Clamps',
    description_zh: '用于软管与管路系统安全锁紧的卡箍类产品。',
    description_en: 'Clamp products for safe locking in hose and piping systems.',
    slug_zh: 'safety-clamps',
    slug_en: 'safety-clamps',
    status: 'published',
    sort_order: 4,
  },
  {
    name_zh: '软管接头',
    name_en: 'Hose Fittings',
    description_zh: '工业软管系统中常用的接头与连接件产品。',
    description_en: 'Fittings and connection products used in industrial hose systems.',
    slug_zh: 'hose-fittings',
    slug_en: 'hose-fittings',
    status: 'published',
    sort_order: 5,
  },
  {
    name_zh: '法兰接头',
    name_en: 'Flange Couplings',
    description_zh: '适用于法兰连接场景的工业耦合与配套产品。',
    description_en: 'Industrial coupling products for flange-based connection scenarios.',
    slug_zh: 'flange-couplings',
    slug_en: 'flange-couplings',
    status: 'published',
    sort_order: 6,
  },
];

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

async function findOne(collection, field, value) {
  const res = await api('GET', `/items/${collection}?filter[${field}][_eq]=${encodeURIComponent(value)}&limit=1`);
  return res?.data?.[0] || null;
}

async function patchItem(collection, id, payload) {
  const res = await api('PATCH', `/items/${collection}/${id}`, payload);
  return res?.data || null;
}

async function createItem(collection, payload) {
  const res = await api('POST', `/items/${collection}`, payload);
  return res?.data || null;
}

function normalize(value) {
  return String(value ?? '').trim().toLowerCase();
}

function looksLikeCleaningCategory(item) {
  const values = [item?.name_zh, item?.name_en, item?.slug_zh, item?.slug_en]
    .map(normalize)
    .filter(Boolean);

  return values.some((value) =>
    value.includes('清洗喷头') ||
    value.includes('cleaning nozzle') ||
    value.includes('nozzle') ||
    value === 'dimensional',
  );
}

async function ensureCategory(payload) {
  let existing = await findOne('product_categories', 'slug_en', payload.slug_en);

  if (!existing && payload.slug_en === 'cleaning-nozzles') {
    const list = await api('GET', '/items/product_categories?limit=100&fields=id,name_zh,name_en,slug_zh,slug_en');
    existing = (list?.data || []).find(looksLikeCleaningCategory) || null;
  }

  if (existing) {
    await patchItem('product_categories', existing.id, payload);
    console.log(`category updated: ${payload.slug_en}`);
    return { ...existing, ...payload };
  }

  const created = await createItem('product_categories', payload);
  console.log(`category created: ${payload.slug_en}`);
  return created;
}

function resolveCategorySlug(nameZh, nameEn) {
  const text = `${nameZh || ''} ${nameEn || ''}`.toLowerCase();

  if (text.includes('喷头') || text.includes('nozzle')) return 'cleaning-nozzles';
  if (text.includes('卡箍') || text.includes('clamp')) return 'safety-clamps';
  if (text.includes('法兰') || text.includes('flange')) return 'flange-couplings';
  if (text.includes('软管') || text.includes('hose')) return 'industrial-hoses';
  if (text.includes('接头') || text.includes('coupling')) return 'industrial-couplings';
  if (text.includes('fitting')) return 'hose-fittings';

  return null;
}

async function assignProductCategories(categoriesBySlug) {
  const res = await api('GET', '/items/products?limit=500&fields=id,product_code,name_zh,name_en,category_level_1,status');
  const products = res?.data || [];

  for (const product of products) {
    if (product.category_level_1) continue;
    if (product.status !== 'published') continue;

    const slug = resolveCategorySlug(product.name_zh, product.name_en);
    const category = slug ? categoriesBySlug.get(slug) : null;

    if (!category?.id) continue;

    await patchItem('products', product.id, { category_level_1: category.id });
    console.log(`product category assigned: ${product.id} -> ${slug}`);
  }
}

const ensured = [];
for (const category of CATEGORIES) {
  ensured.push(await ensureCategory(category));
}

await assignProductCategories(new Map(ensured.map((item) => [item.slug_en, item])));

console.log('Product category seeding completed');
