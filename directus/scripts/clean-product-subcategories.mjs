const BASE_URL = process.env.DIRECTUS_URL || 'http://127.0.0.1:8055';
const TOKEN = process.env.ADMIN_TOKEN || process.env.DIRECTUS_ADMIN_TOKEN || '';
const CATEGORY_COLLECTION = 'product_categories';
const PRODUCT_COLLECTION = 'products';

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

function normalizeWhitespace(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function normalizeKey(value) {
  return normalizeWhitespace(value).toLowerCase();
}

function hasCjk(value) {
  return /[\u3400-\u9fff]/u.test(value);
}

function slugifyEnglish(value) {
  return normalizeWhitespace(value)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

function slugifyChinese(value) {
  return normalizeWhitespace(value)
    .toLowerCase()
    .replace(/[^\p{Script=Han}a-z0-9]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

function buildCategorySlugs({ name_zh, name_en }) {
  const zhSource = normalizeWhitespace(name_zh || name_en || '');
  const enSource = normalizeWhitespace(name_en || name_zh || '');

  return {
    slug_zh: zhSource ? (hasCjk(zhSource) ? slugifyChinese(zhSource) : slugifyEnglish(zhSource)) : null,
    slug_en: enSource ? slugifyEnglish(enSource) || (hasCjk(enSource) ? slugifyChinese(enSource) : null) : null,
  };
}

function normalizeId(value) {
  if (value === null || value === undefined) return null;
  if (typeof value === 'object') return normalizeId(value.id);
  const normalized = String(value).trim();
  return normalized || null;
}

async function fetchCategories() {
  const res = await api(
    'GET',
    `/items/${CATEGORY_COLLECTION}?limit=500&fields=id,name_zh,name_en,slug_zh,slug_en,parent_id,status,sort_order`,
  );
  return res?.data || [];
}

async function fetchProducts() {
  const res = await api(
    'GET',
    `/items/${PRODUCT_COLLECTION}?limit=500&fields=id,product_code,name_zh,name_en,slug_zh,slug_en,status,category_level_1,category_level_2`,
  );
  return res?.data || [];
}

async function patchItem(collection, id, payload) {
  const res = await api('PATCH', `/items/${collection}/${id}`, payload);
  return res?.data || null;
}

async function createItem(collection, payload) {
  const res = await api('POST', `/items/${collection}`, payload);
  return res?.data || null;
}

function makeGroupKey(product) {
  return [
    normalizeId(product.category_level_1) || 'no-level-1',
    normalizeKey(product.name_zh || ''),
    normalizeKey(product.name_en || ''),
  ].join('||');
}

function categoryMatchesGroup(category, group) {
  const names = [
    normalizeKey(category.name_zh),
    normalizeKey(category.name_en),
    normalizeKey(category.slug_zh),
    normalizeKey(category.slug_en),
  ];

  return names.includes(group.nameZhKey) || names.includes(group.nameEnKey) || names.includes(group.slugZhKey) || names.includes(group.slugEnKey);
}

function groupProducts(products) {
  const grouped = new Map();

  for (const product of products) {
    if (product.status !== 'published') continue;
    const level1Id = normalizeId(product.category_level_1);
    if (!level1Id) {
      console.log(`skip product without level-1 category: ${product.id}`);
      continue;
    }

    const key = makeGroupKey(product);
    if (!grouped.has(key)) {
      const slugs = buildCategorySlugs(product);
      grouped.set(key, {
        key,
        level1Id,
        name_zh: normalizeWhitespace(product.name_zh || product.name_en || `subcategory-${product.id}`),
        name_en: normalizeWhitespace(product.name_en || product.name_zh || `subcategory-${product.id}`),
        slug_zh: slugs.slug_zh,
        slug_en: slugs.slug_en,
        nameZhKey: normalizeKey(product.name_zh || product.name_en || ''),
        nameEnKey: normalizeKey(product.name_en || product.name_zh || ''),
        slugZhKey: normalizeKey(slugs.slug_zh || ''),
        slugEnKey: normalizeKey(slugs.slug_en || ''),
        products: [],
      });
    }

    grouped.get(key).products.push(product);
  }

  return [...grouped.values()];
}

function findCurrentCategoryForGroup(group, categoriesById) {
  for (const product of group.products) {
    const level2Id = normalizeId(product.category_level_2);
    if (!level2Id) continue;
    const category = categoriesById.get(level2Id);
    if (!category) continue;
    if (normalizeId(category.parent_id) !== group.level1Id) continue;
    return category;
  }

  return null;
}

async function ensureSubcategory(group, categories, categoriesById) {
  const existingChild = categories.find((category) =>
    normalizeId(category.parent_id) === group.level1Id && categoryMatchesGroup(category, group),
  );

  const reusableCurrent = findCurrentCategoryForGroup(group, categoriesById);
  const candidate = existingChild || reusableCurrent;
  const payload = {
    name_zh: group.name_zh,
    name_en: group.name_en,
    parent_id: Number(group.level1Id),
    slug_zh: group.slug_zh,
    slug_en: group.slug_en,
    status: 'published',
  };

  if (candidate) {
    await patchItem(CATEGORY_COLLECTION, candidate.id, payload);
    const updated = { ...candidate, ...payload, id: candidate.id };
    categoriesById.set(normalizeId(candidate.id), updated);
    console.log(`subcategory updated: ${candidate.id} <- ${group.name_en}`);
    return updated;
  }

  const created = await createItem(CATEGORY_COLLECTION, payload);
  categories.push(created);
  categoriesById.set(normalizeId(created.id), created);
  console.log(`subcategory created: ${created.id} <- ${group.name_en}`);
  return created;
}

async function assignProductsToSubcategory(group, subcategory) {
  const subcategoryId = Number(normalizeId(subcategory.id));

  for (const product of group.products) {
    const payload = {
      category_level_1: Number(group.level1Id),
      category_level_2: subcategoryId,
    };

    if (
      normalizeId(product.category_level_1) === String(payload.category_level_1)
      && normalizeId(product.category_level_2) === String(payload.category_level_2)
    ) {
      continue;
    }

    await patchItem(PRODUCT_COLLECTION, product.id, payload);
    console.log(`product updated: ${product.id} -> level1 ${payload.category_level_1}, level2 ${payload.category_level_2}`);
  }
}

async function main() {
  const categories = await fetchCategories();
  const products = await fetchProducts();
  const categoriesById = new Map(categories.map((item) => [normalizeId(item.id), item]));
  const groups = groupProducts(products);

  for (const group of groups) {
    const subcategory = await ensureSubcategory(group, categories, categoriesById);
    await assignProductsToSubcategory(group, subcategory);
  }

  console.log(`Product subcategory cleanup completed. Groups processed: ${groups.length}`);
}

await main();
