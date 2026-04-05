import fs from 'node:fs';

const BASE_URL = process.env.DIRECTUS_URL || 'http://127.0.0.1:8055';
const TOKEN = process.env.ADMIN_TOKEN || process.env.DIRECTUS_ADMIN_TOKEN || '';
const blueprintPath = process.env.BLUEPRINT_PATH || '/workspace/schema-blueprint.json';

const TEXT_FIELDS = new Set(['content', 'description', 'summary', 'background', 'solution', 'result', 'message', 'spec_requirements', 'social_links']);
const JSON_FIELDS = new Set(['gallery', 'spec_table', 'social_links']);
const BOOL_FIELDS = new Set(['is_featured', 'is_new', 'is_hot', 'indexable']);
const INT_FIELDS = new Set(['sort_order']);
const DATETIME_FIELDS = new Set(['published_at', 'valid_until', 'created_at']);
const UUID_FIELDS = new Set(['cover_image', 'file', 'image', 'logo', 'favicon', 'attachment']);
const IMAGE_FIELDS = new Set(['cover_image', 'image', 'logo', 'favicon']);

function inferType(field) {
  if (UUID_FIELDS.has(field)) return 'uuid';
  if (INT_FIELDS.has(field)) return 'integer';
  if (BOOL_FIELDS.has(field)) return 'boolean';
  if (DATETIME_FIELDS.has(field)) return 'dateTime';
  if (JSON_FIELDS.has(field)) return 'json';
  if ([...TEXT_FIELDS].some((token) => field.includes(token))) return 'text';
  if (field.startsWith('features_') || field.startsWith('applications_')) return 'text';
  return 'string';
}

function inferMeta(field) {
  if (UUID_FIELDS.has(field)) {
    return {
      interface: 'file',
      display: IMAGE_FIELDS.has(field) ? 'image' : null,
      note: `Bootstrapped file field ${field}`,
    };
  }

  if ([...TEXT_FIELDS].some((token) => field.includes(token)) || field.startsWith('features_') || field.startsWith('applications_')) {
    return {
      interface: 'input-multiline',
      note: `Bootstrapped text field ${field}`,
    };
  }

  if (BOOL_FIELDS.has(field)) {
    return {
      interface: 'boolean',
      note: `Bootstrapped boolean field ${field}`,
    };
  }

  return {
    interface: 'input',
    note: `Bootstrapped field ${field}`,
  };
}

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

async function waitUntilReady(timeoutMs = 120000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const response = await fetch(`${BASE_URL}/server/ping`);
      if (response.ok) return true;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
  return false;
}

const blueprint = JSON.parse(fs.readFileSync(blueprintPath, 'utf-8'));

async function ensureCollection(collection) {
  const existing = await api('GET', '/collections');
  const names = new Set((existing?.data || []).map((item) => item.collection));
  if (names.has(collection.name)) {
    console.log(`Collection exists: ${collection.name}`);
    return;
  }

  await api('POST', '/collections', {
    collection: collection.name,
    meta: {
      singleton: Boolean(collection.singleton),
      note: `Bootstrapped for industrial-official-website (${collection.name})`,
    },
    schema: {
      name: collection.name,
    },
  });
  console.log(`Created collection: ${collection.name}`);
}

async function ensureFields(collection) {
  const existing = await api('GET', `/fields/${collection.name}`);
  const names = new Set((existing?.data || []).map((item) => item.field));

  for (const field of collection.fields || []) {
    if (field === 'id' || names.has(field)) continue;
    try {
      await api('POST', `/fields/${collection.name}`, {
        field,
        type: inferType(field),
        meta: {
          ...inferMeta(field),
        },
      });
      console.log(`  + field ${collection.name}.${field}`);
    } catch (error) {
      console.log(`  ! failed field ${collection.name}.${field}: ${error.message}`);
    }
  }
}

if (!(await waitUntilReady())) {
  throw new Error('Directus not ready in time');
}

for (const collection of blueprint.collections) {
  await ensureCollection(collection);
  await ensureFields(collection);
}
