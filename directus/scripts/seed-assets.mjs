const BASE_URL = process.env.DIRECTUS_URL || 'http://127.0.0.1:8055';
const TOKEN = process.env.ADMIN_TOKEN || process.env.DIRECTUS_ADMIN_TOKEN || '';

async function api(method, endpoint, body, extraHeaders = {}) {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method,
    headers: {
      ...(body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}),
      ...extraHeaders,
    },
    body,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`${method} ${endpoint} failed: ${response.status} ${text}`);
  }

  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

async function getFolderId(name) {
  const res = await api('GET', '/folders');
  return res?.data?.find((item) => item.name === name)?.id || null;
}

async function uploadSvg({ title, fileName, svg, folderName }) {
  const folder = await getFolderId(folderName);
  const form = new FormData();
  form.append('title', title);
  if (folder) form.append('folder', folder);
  form.append('file', new Blob([svg], { type: 'image/svg+xml' }), fileName);
  const uploaded = await api('POST', '/files', form);
  return uploaded?.data?.id || null;
}

async function findOne(collection, field, value) {
  const res = await api('GET', `/items/${collection}?filter[${field}][_eq]=${encodeURIComponent(value)}`);
  return res?.data?.[0] || null;
}

async function patchItem(collection, id, payload) {
  await api('PATCH', `/items/${collection}/${id}`, JSON.stringify(payload));
}

function svgTemplate({ bg, fg, title, subtitle }) {
  return `
  <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="760" viewBox="0 0 1200 760">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${bg}" />
        <stop offset="100%" stop-color="#082540" />
      </linearGradient>
    </defs>
    <rect width="1200" height="760" fill="url(#g)" rx="36" />
    <circle cx="1020" cy="140" r="120" fill="rgba(255,255,255,0.08)" />
    <circle cx="160" cy="620" r="180" fill="rgba(255,255,255,0.06)" />
    <text x="88" y="250" fill="#ffffff" font-size="72" font-family="Arial, Helvetica, sans-serif" font-weight="700">${title}</text>
    <text x="88" y="330" fill="${fg}" font-size="34" font-family="Arial, Helvetica, sans-serif">${subtitle}</text>
    <rect x="88" y="420" width="240" height="10" rx="5" fill="rgba(255,255,255,0.35)" />
    <rect x="88" y="456" width="320" height="10" rx="5" fill="rgba(255,255,255,0.18)" />
  </svg>`;
}

function logoSvg() {
  return `
  <svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">
    <rect width="256" height="256" rx="48" fill="#0b5cab" />
    <path d="M64 164 L112 92 L150 136 L188 84" stroke="#ffffff" stroke-width="20" stroke-linecap="round" stroke-linejoin="round" fill="none" />
    <circle cx="188" cy="84" r="16" fill="#8fd3ff" />
  </svg>`;
}

function certSvg(label, color) {
  return `
  <svg xmlns="http://www.w3.org/2000/svg" width="900" height="620" viewBox="0 0 900 620">
    <rect width="900" height="620" rx="28" fill="#ffffff" />
    <rect x="34" y="34" width="832" height="552" rx="18" fill="#f6f8fb" stroke="${color}" stroke-width="6" />
    <circle cx="450" cy="210" r="74" fill="${color}" opacity="0.15" />
    <circle cx="450" cy="210" r="52" fill="${color}" opacity="0.28" />
    <text x="450" y="220" text-anchor="middle" fill="${color}" font-size="34" font-family="Arial" font-weight="700">${label}</text>
    <text x="450" y="360" text-anchor="middle" fill="#10233f" font-size="40" font-family="Arial" font-weight="700">Certification Sample</text>
    <text x="450" y="412" text-anchor="middle" fill="#5e6c84" font-size="24" font-family="Arial">Demo visual for admin-managed content</text>
  </svg>`;
}

const assets = {
  logo: await uploadSvg({ title: 'Site Logo', fileName: 'site-logo.svg', svg: logoSvg(), folderName: '网站素材' }),
  pipe: await uploadSvg({ title: 'Stainless Steel Pipe', fileName: 'pipe.svg', svg: svgTemplate({ bg: '#0b5cab', fg: '#cfe7ff', title: 'Stainless Steel Pipe', subtitle: 'Industrial piping for water treatment & construction' }), folderName: '产品图片' }),
  valve: await uploadSvg({ title: 'Industrial Gate Valve', fileName: 'valve.svg', svg: svgTemplate({ bg: '#147a4b', fg: '#d9ffe8', title: 'Industrial Gate Valve', subtitle: 'Reliable flow control for industrial systems' }), folderName: '产品图片' }),
  fitting: await uploadSvg({ title: 'Pipe Fitting Elbow', fileName: 'fitting.svg', svg: svgTemplate({ bg: '#7b4de0', fg: '#ece2ff', title: 'Pipe Fitting Elbow', subtitle: 'Directional connection for utility and process piping' }), folderName: '产品图片' }),
  iso: await uploadSvg({ title: 'ISO Certificate', fileName: 'iso-cert.svg', svg: certSvg('ISO', '#0b5cab'), folderName: '认证文件' }),
  ce: await uploadSvg({ title: 'CE Certificate', fileName: 'ce-cert.svg', svg: certSvg('CE', '#147a4b'), folderName: '认证文件' }),
};

const siteSettings = await findOne('site_settings', 'id', 1);
if (siteSettings) {
  await patchItem('site_settings', siteSettings.id, { logo: assets.logo, favicon: assets.logo });
}

for (const [slug, fileId] of [
  ['stainless-steel-pipe', assets.pipe],
  ['industrial-gate-valve', assets.valve],
  ['pipe-fitting-elbow', assets.fitting],
]) {
  const item = await findOne('products', 'slug_en', slug);
  if (item) {
    await patchItem('products', item.id, { cover_image: fileId });
  }
}

for (const [title, fileId] of [
  ['ISO Quality Certification', assets.iso],
  ['CE Certificate', assets.ce],
]) {
  const item = await findOne('certifications', 'title_en', title);
  if (item) {
    await patchItem('certifications', item.id, { image: fileId });
  }
}

console.log('Asset seeding completed', assets);
