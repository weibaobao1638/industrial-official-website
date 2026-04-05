const BASE_URL = process.env.DIRECTUS_URL || 'http://127.0.0.1:8055';
const TOKEN = process.env.ADMIN_TOKEN || process.env.DIRECTUS_ADMIN_TOKEN || '';

async function api(method, endpoint, body) {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method,
    headers: {
      ...(body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}),
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

async function findOne(collection, field, value) {
  const res = await api('GET', `/items/${collection}?filter[${field}][_eq]=${encodeURIComponent(value)}`);
  return res?.data?.[0] || null;
}

async function findFileByTitle(title) {
  const res = await api('GET', `/files?filter[title][_eq]=${encodeURIComponent(title)}`);
  return res?.data?.[0] || null;
}

async function createIfMissing(collection, payload, uniqueField) {
  const existing = uniqueField ? await findOne(collection, uniqueField, payload[uniqueField]) : null;
  if (existing) return existing;
  const created = await api('POST', `/items/${collection}`, JSON.stringify(payload));
  return created?.data || null;
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
    <circle cx="980" cy="180" r="140" fill="rgba(255,255,255,0.08)" />
    <circle cx="220" cy="620" r="200" fill="rgba(255,255,255,0.06)" />
    <text x="88" y="240" fill="#ffffff" font-size="68" font-family="Arial, Helvetica, sans-serif" font-weight="700">${title}</text>
    <text x="88" y="320" fill="${fg}" font-size="34" font-family="Arial, Helvetica, sans-serif">${subtitle}</text>
    <rect x="88" y="408" width="280" height="10" rx="5" fill="rgba(255,255,255,0.35)" />
    <rect x="88" y="444" width="360" height="10" rx="5" fill="rgba(255,255,255,0.18)" />
    <rect x="88" y="480" width="240" height="10" rx="5" fill="rgba(255,255,255,0.18)" />
  </svg>`;
}

function certSvg(label, color, subtitle) {
  return `
  <svg xmlns="http://www.w3.org/2000/svg" width="900" height="620" viewBox="0 0 900 620">
    <rect width="900" height="620" rx="28" fill="#ffffff" />
    <rect x="34" y="34" width="832" height="552" rx="18" fill="#f6f8fb" stroke="${color}" stroke-width="6" />
    <circle cx="450" cy="200" r="80" fill="${color}" opacity="0.12" />
    <circle cx="450" cy="200" r="54" fill="${color}" opacity="0.28" />
    <text x="450" y="210" text-anchor="middle" fill="${color}" font-size="32" font-family="Arial" font-weight="700">${label}</text>
    <text x="450" y="340" text-anchor="middle" fill="#10233f" font-size="42" font-family="Arial" font-weight="700">${subtitle}</text>
    <text x="450" y="394" text-anchor="middle" fill="#5e6c84" font-size="24" font-family="Arial">Demo asset for website preview</text>
  </svg>`;
}

function createPdf(lines) {
  const content = ['BT', '/F1 18 Tf', '72 760 Td', ...lines.flatMap((line, i) => [i === 0 ? `(${line}) Tj` : `0 -28 Td (${line}) Tj`]), 'ET'].join('\n');
  const objects = [
    '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj',
    '2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj',
    '3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj',
    `4 0 obj << /Length ${Buffer.byteLength(content, 'utf8')} >> stream\n${content}\nendstream endobj`,
    '5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj',
  ];
  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  for (const object of objects) {
    offsets.push(Buffer.byteLength(pdf, 'utf8'));
    pdf += `${object}\n`;
  }
  const xrefOffset = Buffer.byteLength(pdf, 'utf8');
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';
  for (let i = 1; i < offsets.length; i += 1) pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return Buffer.from(pdf, 'utf8');
}

async function uploadFile({ title, fileName, mimeType, buffer, folderName }) {
  const existing = await findFileByTitle(title);
  if (existing) return existing.id;
  const folder = await getFolderId(folderName);
  const form = new FormData();
  form.append('title', title);
  if (folder) form.append('folder', folder);
  form.append('file', new Blob([buffer], { type: mimeType }), fileName);
  const uploaded = await api('POST', '/files', form);
  return uploaded?.data?.id || null;
}

const assets = {
  brochure: await uploadFile({
    title: 'Company Brochure PDF',
    fileName: 'company-brochure.pdf',
    mimeType: 'application/pdf',
    buffer: createPdf(['Company Brochure', 'Industrial company profile and export capability', 'Demo PDF for download center preview']),
    folderName: '下载资料',
  }),
  installGuide: await uploadFile({
    title: 'Installation Guide PDF',
    fileName: 'installation-guide.pdf',
    mimeType: 'application/pdf',
    buffer: createPdf(['Installation Guide', 'Basic installation and maintenance notes', 'Demo PDF for download center preview']),
    folderName: '下载资料',
  }),
  report: await uploadFile({
    title: 'Material Test Report PDF',
    fileName: 'material-test-report.pdf',
    mimeType: 'application/pdf',
    buffer: createPdf(['Material Test Report', 'Inspection notes and compliance summary', 'Demo PDF for certification preview']),
    folderName: '认证文件',
  }),
  brochureCover: await uploadFile({
    title: 'Website Material Banner',
    fileName: 'website-material-banner.svg',
    mimeType: 'image/svg+xml',
    buffer: svgTemplate({ bg: '#0b5cab', fg: '#dcecff', title: 'Industrial Brochure', subtitle: 'Structured product and company presentation' }),
    folderName: '网站素材',
  }),
  pvcPipe: await uploadFile({
    title: 'PVC Pipe Demo Image',
    fileName: 'pvc-pipe.svg',
    mimeType: 'image/svg+xml',
    buffer: svgTemplate({ bg: '#1a7f7a', fg: '#d9fffb', title: 'PVC Pipe', subtitle: 'Lightweight piping for utility and drainage systems' }),
    folderName: '产品图片',
  }),
  ballValve: await uploadFile({
    title: 'Ball Valve Demo Image',
    fileName: 'ball-valve.svg',
    mimeType: 'image/svg+xml',
    buffer: svgTemplate({ bg: '#b14c2b', fg: '#ffe5dc', title: 'Ball Valve', subtitle: 'Compact flow control for process piping' }),
    folderName: '产品图片',
  }),
  testReportImage: await uploadFile({
    title: 'Test Report Demo Image',
    fileName: 'test-report.svg',
    mimeType: 'image/svg+xml',
    buffer: certSvg('TEST', '#7b4de0', 'Material Test Report'),
    folderName: '认证文件',
  }),
};

const extraProducts = [
  {
    product_code: 'PIPE-002',
    name_zh: 'PVC 排水管',
    name_en: 'PVC Drainage Pipe',
    summary_zh: '适用于给排水和轻型工程管路场景。',
    summary_en: 'Suitable for drainage, utility, and lightweight project piping.',
    description_zh: '用于排水和基础工程场景的轻量化管道产品。',
    description_en: 'A lightweight piping product for drainage and basic utility projects.',
    features_zh: '重量轻\n安装方便\n维护成本低',
    features_en: 'Lightweight\nEasy installation\nLow maintenance cost',
    applications_zh: '建筑排水\n市政工程',
    applications_en: 'Building drainage\nMunicipal projects',
    material: 'PVC',
    specification: 'DN50-DN250',
    category_level_1: 'pipes',
    slug_zh: 'pvc-drainage-pipe',
    slug_en: 'pvc-drainage-pipe',
    is_featured: true,
    status: 'published',
    sort_order: 4,
    cover_image: assets.pvcPipe,
  },
  {
    product_code: 'VALVE-002',
    name_zh: '工业球阀',
    name_en: 'Industrial Ball Valve',
    summary_zh: '适用于工业流体控制和启闭场景。',
    summary_en: 'Designed for industrial flow control and shutoff scenarios.',
    description_zh: '紧凑型阀门产品，适合工业流体控制与维护场景。',
    description_en: 'A compact valve product for industrial shutoff and fluid-control use cases.',
    features_zh: '启闭灵活\n结构紧凑\n维护便捷',
    features_en: 'Fast shutoff\nCompact body\nEasy maintenance',
    applications_zh: '工业制造\n管路系统',
    applications_en: 'Industrial manufacturing\nPiping systems',
    material: 'Carbon Steel / Stainless Steel',
    specification: '1/2" - 4"',
    category_level_1: 'valves',
    slug_zh: 'industrial-ball-valve',
    slug_en: 'industrial-ball-valve',
    is_featured: true,
    status: 'published',
    sort_order: 5,
    cover_image: assets.ballValve,
  },
];

for (const item of extraProducts) {
  await createIfMissing('products', item, 'slug_en');
}

const extraDownloads = [
  {
    title_zh: '公司宣传册',
    title_en: 'Company Brochure',
    description_zh: '企业介绍与产品能力展示资料。',
    description_en: 'Company introduction and product capability overview.',
    file_type: 'PDF',
    download_category: 'brochure',
    status: 'published',
    file: assets.brochure,
  },
  {
    title_zh: '安装指南',
    title_en: 'Installation Guide',
    description_zh: '安装与维护基础说明。',
    description_en: 'Basic installation and maintenance notes.',
    file_type: 'PDF',
    download_category: 'guide',
    status: 'published',
    file: assets.installGuide,
  },
];

for (const item of extraDownloads) {
  const record = await createIfMissing('downloads', item, 'title_en');
  if (record?.id) await patchItem('downloads', record.id, { file: item.file, file_type: item.file_type });
}

const extraCert = {
  title_zh: '材料检测报告',
  title_en: 'Material Test Report',
  description_zh: '展示材料检测与合规信息的示例文件。',
  description_en: 'Sample material test report for compliance-oriented presentation.',
  certificate_type: 'REPORT',
  issued_by: 'Authorized Lab',
  valid_until: '2030-12-31T00:00:00Z',
  status: 'published',
};
const certRecord = await createIfMissing('certifications', extraCert, 'title_en');
if (certRecord?.id) await patchItem('certifications', certRecord.id, { file: assets.report, image: assets.testReportImage });

const siteSettings = await findOne('site_settings', 'id', 1);
if (siteSettings?.id) {
  await patchItem('site_settings', siteSettings.id, { social_links: `Website Material Banner: ${assets.brochureCover}` });
}

console.log('Showcase seeding completed', { assetsCount: Object.keys(assets).length, extraProducts: extraProducts.length, extraDownloads: extraDownloads.length, extraCertifications: 1 });
