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

function createPdf(lines) {
  const content = [
    'BT',
    '/F1 18 Tf',
    '72 760 Td',
    ...lines.flatMap((line, index) => [
      index === 0 ? `(${line}) Tj` : `0 -28 Td (${line}) Tj`,
    ]),
    'ET',
  ].join('\n');

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
  for (let i = 1; i < offsets.length; i += 1) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return Buffer.from(pdf, 'utf8');
}

async function uploadPdf({ title, fileName, lines, folderName }) {
  const folder = await getFolderId(folderName);
  const form = new FormData();
  form.append('title', title);
  if (folder) form.append('folder', folder);
  form.append('file', new Blob([createPdf(lines)], { type: 'application/pdf' }), fileName);
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

const docs = {
  catalog: await uploadPdf({
    title: 'Product Catalog PDF',
    fileName: 'product-catalog.pdf',
    folderName: '下载资料',
    lines: ['Industrial Product Catalog', 'Core product lines, categories, and export information', 'Demo PDF generated for content preview'],
  }),
  datasheet: await uploadPdf({
    title: 'Technical Datasheet PDF',
    fileName: 'technical-datasheet.pdf',
    folderName: '下载资料',
    lines: ['Technical Datasheet', 'Material, specification, and reference notes', 'Demo PDF generated for content preview'],
  }),
  iso: await uploadPdf({
    title: 'ISO Certificate PDF',
    fileName: 'iso-certificate.pdf',
    folderName: '认证文件',
    lines: ['ISO Quality Certification', 'Sample certificate file for admin-managed preview'],
  }),
  ce: await uploadPdf({
    title: 'CE Certificate PDF',
    fileName: 'ce-certificate.pdf',
    folderName: '认证文件',
    lines: ['CE Certification', 'Sample certificate file for admin-managed preview'],
  }),
};

const catalog = await findOne('downloads', 'title_en', 'Product Catalog');
if (catalog) await patchItem('downloads', catalog.id, { file: docs.catalog, file_type: 'PDF' });

const datasheet = await findOne('downloads', 'title_en', 'Technical Datasheet');
if (datasheet) await patchItem('downloads', datasheet.id, { file: docs.datasheet, file_type: 'PDF' });

const iso = await findOne('certifications', 'title_en', 'ISO Quality Certification');
if (iso) await patchItem('certifications', iso.id, { file: docs.iso });

const ce = await findOne('certifications', 'title_en', 'CE Certificate');
if (ce) await patchItem('certifications', ce.id, { file: docs.ce });

console.log('Document seeding completed', docs);
