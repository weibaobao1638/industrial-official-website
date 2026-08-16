const BASE_URL = process.env.DIRECTUS_URL || 'http://127.0.0.1:8055';
const TOKEN = process.env.DIRECTUS_TOKEN || process.env.ADMIN_TOKEN || process.env.DIRECTUS_ADMIN_TOKEN || '';
const PAGE_SIZE = 500;

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

function slugifyEnglish(value) {
  return normalizeWhitespace(value)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

function buildCanonicalSlug(product) {
  const sources = [product.slug_en, product.name_en, product.slug_zh, product.name_zh];

  for (const source of sources) {
    const slug = slugifyEnglish(source);
    if (slug) return slug;
  }

  const productCode = slugifyEnglish(product.product_code);
  if (productCode) return productCode;

  return `product-${product.id}`;
}

async function getProducts() {
  const fields = [
    'id',
    'product_code',
    'name_zh',
    'name_en',
    'slug_zh',
    'slug_en',
    'status',
  ].join(',');

  const response = await api('GET', `/items/products?limit=${PAGE_SIZE}&fields=${fields}&sort=id`);
  return response?.data || [];
}

function printDuplicateSummary(products) {
  const bySlug = new Map();

  for (const product of products) {
    const slug = buildCanonicalSlug(product);
    if (!bySlug.has(slug)) bySlug.set(slug, []);
    bySlug.get(slug).push(product);
  }

  const duplicates = [...bySlug.entries()].filter(([, items]) => items.length > 1);

  if (!duplicates.length) {
    console.log('No duplicate canonical product slugs detected.');
    return;
  }

  console.log('Duplicate canonical product slugs detected:');
  for (const [slug, items] of duplicates) {
    const labels = items.map((item) => `${item.id}:${item.product_code || item.name_en || item.name_zh || 'unknown'}`).join(', ');
    console.log(`- ${slug}: ${labels}`);
  }
}

async function main() {
  const products = await getProducts();
  let updated = 0;

  for (const product of products) {
    const canonicalSlug = buildCanonicalSlug(product);
    if (product.slug_en === canonicalSlug && product.slug_zh === canonicalSlug) {
      continue;
    }

    await api('PATCH', `/items/products/${product.id}`, {
      slug_en: canonicalSlug,
      slug_zh: canonicalSlug,
    });
    updated += 1;
    console.log(`product updated: ${product.id} -> ${canonicalSlug}`);
  }

  console.log(`Product slug sync completed. Updated ${updated} item(s).`);
  printDuplicateSummary(products);
}

await main();
