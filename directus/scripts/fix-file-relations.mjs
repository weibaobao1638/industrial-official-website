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

async function getRelations() {
  const res = await api('GET', '/relations');
  return res?.data || [];
}

async function ensureRelation(collection, field) {
  const relations = await getRelations();
  const exists = relations.find((item) => item.collection === collection && item.field === field);
  if (exists) {
    console.log(`relation exists: ${collection}.${field}`);
    return;
  }

  const payload = {
    collection,
    field,
    related_collection: 'directus_files',
    meta: {
      many_collection: collection,
      many_field: field,
      one_collection: 'directus_files',
      one_field: null,
      one_collection_field: null,
      one_allowed_collections: null,
      junction_field: null,
      sort_field: null,
      one_deselect_action: 'nullify',
    },
    schema: {
      table: collection,
      column: field,
      foreign_key_table: 'directus_files',
      foreign_key_column: 'id',
      on_update: 'NO ACTION',
      on_delete: 'SET NULL',
    },
  };

  await api('POST', '/relations', payload);
  console.log(`relation created: ${collection}.${field}`);
}

for (const [collection, field] of [
  ['home_banners', 'image'],
  ['products', 'cover_image'],
  ['downloads', 'file'],
  ['certifications', 'file'],
  ['certifications', 'image'],
  ['site_settings', 'logo'],
  ['site_settings', 'favicon'],
  ['site_settings', 'about_image_1'],
  ['site_settings', 'about_image_2'],
  ['site_settings', 'about_image_3'],
  ['inquiries', 'attachment'],
]) {
  await ensureRelation(collection, field);
}
