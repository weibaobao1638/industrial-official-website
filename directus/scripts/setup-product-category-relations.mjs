const BASE_URL = process.env.DIRECTUS_URL || 'http://127.0.0.1:8055';
const TOKEN = process.env.ADMIN_TOKEN || process.env.DIRECTUS_ADMIN_TOKEN || '';
const CATEGORY_COLLECTION = 'product_categories';
const PRODUCT_COLLECTION = 'products';
const CATEGORY_TEMPLATE = '{{ name_zh }} / {{ name_en }}';

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

function buildCategorySlugs(item) {
  const zhSource = normalizeWhitespace(item.name_zh || item.name_en || '');
  const enSource = normalizeWhitespace(item.name_en || item.name_zh || '');

  return {
    slug_zh: item.slug_zh || (zhSource ? (hasCjk(zhSource) ? slugifyChinese(zhSource) : slugifyEnglish(zhSource)) : null),
    slug_en: item.slug_en || (enSource ? slugifyEnglish(enSource) || (hasCjk(enSource) ? slugifyChinese(enSource) : null) : null),
  };
}

function normalizeId(value) {
  if (value === null || value === undefined) return null;
  if (typeof value === 'object') {
    return normalizeId(value.id);
  }

  const normalized = String(value).trim();
  return normalized || null;
}

function isNumericLike(value) {
  return /^\d+$/.test(String(value ?? '').trim());
}

async function getRelations() {
  const res = await api('GET', '/relations');
  return res?.data || [];
}

async function ensureM2OFieldMeta(collection, field, { note, width = 'half', filter } = {}) {
  const fieldRes = await api('GET', `/fields/${collection}/${field}`);
  const meta = fieldRes?.data?.meta || {};
  const options = {
    ...(meta.options || {}),
    template: CATEGORY_TEMPLATE,
  };

  if (filter) {
    options.filter = filter;
  }

  const payload = {
    meta: {
      ...meta,
      special: ['m2o'],
      interface: 'select-dropdown-m2o',
      options,
      display: 'related-values',
      display_options: {
        template: CATEGORY_TEMPLATE,
      },
      note: note || meta.note,
      width: meta.width || width,
    },
  };

  await api('PATCH', `/fields/${collection}/${field}`, payload);
  console.log(`field meta updated: ${collection}.${field}`);
}

async function ensureRelation({ collection, field, relatedCollection, table, note, filter, width = 'half' }) {
  const relations = await getRelations();
  const exists = relations.find((item) => item.collection === collection && item.field === field);

  if (!exists) {
    const payload = {
      collection,
      field,
      related_collection: relatedCollection,
      meta: {
        many_collection: collection,
        many_field: field,
        one_collection: relatedCollection,
        one_field: null,
        one_collection_field: null,
        one_allowed_collections: null,
        junction_field: null,
        sort_field: null,
        one_deselect_action: 'nullify',
      },
      schema: {
        table,
        column: field,
        foreign_key_table: relatedCollection,
        foreign_key_column: 'id',
        on_update: 'NO ACTION',
        on_delete: 'SET NULL',
      },
    };

    await api('POST', '/relations', payload);
    console.log(`relation created: ${collection}.${field} -> ${relatedCollection}.id`);
  } else {
    console.log(`relation exists: ${collection}.${field}`);
  }

  await ensureM2OFieldMeta(collection, field, { note, filter, width });
}

async function backfillCategoryMetadata() {
  const res = await api('GET', `/items/${CATEGORY_COLLECTION}?limit=500&fields=id,name_zh,name_en,slug_zh,slug_en,status,parent_id`);
  const items = res?.data || [];

  for (const item of items) {
    const slugs = buildCategorySlugs(item);
    const payload = {};

    if (!item.slug_zh && slugs.slug_zh) payload.slug_zh = slugs.slug_zh;
    if (!item.slug_en && slugs.slug_en) payload.slug_en = slugs.slug_en;
    if (!item.status) payload.status = 'published';

    if (Object.keys(payload).length > 0) {
      await api('PATCH', `/items/${CATEGORY_COLLECTION}/${item.id}`, payload);
      console.log(`category updated: ${item.id}`);
    }
  }
}

async function findCategoryId(rawValue, categories, { topLevelOnly = false, childOnly = false, excludeId = null } = {}) {
  const value = normalizeWhitespace(rawValue);
  if (!value) return null;

  const filtered = categories.filter((item) => {
    const id = normalizeId(item.id);
    const parentId = normalizeId(item.parent_id);
    if (excludeId && id === excludeId) return false;
    if (topLevelOnly && parentId) return false;
    if (childOnly && !parentId) return false;
    return true;
  });

  if (isNumericLike(value)) {
    const numeric = String(Number(value));
    const byId = filtered.find((item) => normalizeId(item.id) === numeric);
    return normalizeId(byId?.id) || numeric;
  }

  const lower = value.toLowerCase();
  const match = filtered.find((item) =>
    [item.slug_zh, item.slug_en, item.name_zh, item.name_en]
      .filter(Boolean)
      .map((candidate) => String(candidate).trim().toLowerCase())
      .includes(lower),
  );

  return normalizeId(match?.id);
}

async function migrateCategoryParentValues() {
  const res = await api('GET', `/items/${CATEGORY_COLLECTION}?limit=500&fields=id,name_zh,name_en,slug_zh,slug_en,parent_id`);
  const categories = res?.data || [];

  for (const category of categories) {
    const current = category.parent_id;
    if (current === null || current === undefined || current === '') continue;

    const mappedId = await findCategoryId(current, categories, { topLevelOnly: true, excludeId: normalizeId(category.id) });
    if (!mappedId) {
      console.log(`parent mapping skipped: category ${category.id}`);
      continue;
    }

    if (normalizeId(current) === mappedId) continue;

    await api('PATCH', `/items/${CATEGORY_COLLECTION}/${category.id}`, { parent_id: mappedId });
    console.log(`category parent migrated: ${category.id} -> ${mappedId}`);
  }
}

async function migrateProductCategoryValues(field, { topLevelOnly = false, childOnly = false } = {}) {
  const categoryRes = await api('GET', `/items/${CATEGORY_COLLECTION}?limit=500&fields=id,name_zh,name_en,slug_zh,slug_en,parent_id`);
  const productRes = await api('GET', `/items/${PRODUCT_COLLECTION}?limit=500&fields=id,product_code,name_zh,name_en,${field}`);
  const categories = categoryRes?.data || [];
  const products = productRes?.data || [];

  for (const product of products) {
    const current = product[field];
    if (current === null || current === undefined || current === '') continue;

    const mappedId = await findCategoryId(current, categories, { topLevelOnly, childOnly });
    if (!mappedId) {
      console.log(`category mapping skipped: product ${product.id} field ${field}`);
      continue;
    }

    if (normalizeId(current) === mappedId) continue;

    await api('PATCH', `/items/${PRODUCT_COLLECTION}/${product.id}`, { [field]: mappedId });
    console.log(`product category migrated: ${product.id} ${field} -> ${mappedId}`);
  }
}

async function syncProductCategoryHierarchy() {
  const categoryRes = await api('GET', `/items/${CATEGORY_COLLECTION}?limit=500&fields=id,parent_id,name_zh,name_en`);
  const productRes = await api(
    'GET',
    `/items/${PRODUCT_COLLECTION}?limit=500&fields=id,product_code,name_zh,name_en,category_level_1,category_level_2`,
  );

  const categories = categoryRes?.data || [];
  const products = productRes?.data || [];
  const categoriesById = new Map(categories.map((item) => [normalizeId(item.id), item]));

  for (const product of products) {
    const level1Id = normalizeId(product.category_level_1);
    const level2Id = normalizeId(product.category_level_2);
    const payload = {};

    if (level1Id) {
      const level1Category = categoriesById.get(level1Id);
      const parentId = normalizeId(level1Category?.parent_id);

      if (parentId) {
        payload.category_level_1 = parentId;
        if (!level2Id) {
          payload.category_level_2 = level1Id;
        }
      }
    }

    if (level2Id) {
      const level2Category = categoriesById.get(level2Id);
      const parentId = normalizeId(level2Category?.parent_id);

      if (!level2Category || !parentId) {
        payload.category_level_2 = null;
      } else if ((payload.category_level_1 || level1Id) !== parentId) {
        payload.category_level_1 = parentId;
      }
    }

    if (Object.keys(payload).length === 0) continue;

    await api('PATCH', `/items/${PRODUCT_COLLECTION}/${product.id}`, payload);
    console.log(`product hierarchy synced: ${product.id}`);
  }
}

await backfillCategoryMetadata();
await ensureRelation({
  collection: CATEGORY_COLLECTION,
  field: 'parent_id',
  relatedCollection: CATEGORY_COLLECTION,
  table: CATEGORY_COLLECTION,
  note: '二级分类时选择一个一级分类作为父类目',
  filter: {
    parent_id: {
      _null: true,
    },
  },
});
await ensureRelation({
  collection: PRODUCT_COLLECTION,
  field: 'category_level_1',
  relatedCollection: CATEGORY_COLLECTION,
  table: PRODUCT_COLLECTION,
  note: '一级分类下拉选择（仅显示一级类目）',
  filter: {
    parent_id: {
      _null: true,
    },
  },
});
await ensureRelation({
  collection: PRODUCT_COLLECTION,
  field: 'category_level_2',
  relatedCollection: CATEGORY_COLLECTION,
  table: PRODUCT_COLLECTION,
  note: '二级分类下拉选择（仅显示二级类目）',
  filter: {
    parent_id: {
      _nnull: true,
    },
  },
});
await migrateCategoryParentValues();
await migrateProductCategoryValues('category_level_1', { topLevelOnly: true });
await migrateProductCategoryValues('category_level_2', { childOnly: true });
await syncProductCategoryHierarchy();

console.log('Product category hierarchy setup completed');
