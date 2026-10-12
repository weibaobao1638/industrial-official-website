// Idempotently add the "WHO WE ARE" homepage image fields (about_image_1..3) to the
// site_settings singleton, mirroring the existing logo/favicon file fields.
//
// Run inside the Directus container:
//   docker compose exec -T directus node /workspace/scripts/setup-about-images.mjs

const BASE_URL = process.env.DIRECTUS_URL || 'http://127.0.0.1:8055';
const TOKEN = process.env.ADMIN_TOKEN || process.env.DIRECTUS_ADMIN_TOKEN || '';

const FIELDS = ['about_image_1', 'about_image_2', 'about_image_3'];

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

async function ensureField(field) {
  const existing = await api('GET', '/fields/site_settings');
  const names = new Set((existing?.data || []).map((item) => item.field));
  if (names.has(field)) {
    console.log(`field exists: site_settings.${field}`);
    return;
  }

  await api('POST', '/fields/site_settings', {
    field,
    type: 'uuid',
    meta: {
      special: null,
      interface: 'file',
      display: 'image',
      width: 'half',
      note: `Homepage "WHO WE ARE" image (${field})`,
    },
  });
  console.log(`field created: site_settings.${field}`);
}

async function ensureRelation(field) {
  const relations = await api('GET', '/relations');
  const exists = (relations?.data || []).find(
    (item) => item.collection === 'site_settings' && item.field === field,
  );
  if (exists) {
    console.log(`relation exists: site_settings.${field}`);
    return;
  }

  await api('POST', '/relations', {
    collection: 'site_settings',
    field,
    related_collection: 'directus_files',
    meta: {
      many_collection: 'site_settings',
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
      table: 'site_settings',
      column: field,
      foreign_key_table: 'directus_files',
      foreign_key_column: 'id',
      on_update: 'NO ACTION',
      on_delete: 'SET NULL',
    },
  });
  console.log(`relation created: site_settings.${field}`);
}

for (const field of FIELDS) {
  await ensureField(field);
  await ensureRelation(field);
}
