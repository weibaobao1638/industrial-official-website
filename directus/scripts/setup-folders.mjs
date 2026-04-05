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

async function ensureFolder(name) {
  const list = await api('GET', '/folders');
  const existing = (list?.data || []).find((item) => item.name === name);
  if (existing) {
    console.log(`folder exists: ${name}`);
    return existing;
  }
  const created = await api('POST', '/folders', { name });
  console.log(`folder created: ${name}`);
  return created?.data || null;
}

for (const name of ['产品图片', '下载资料', '认证文件', '网站素材']) {
  await ensureFolder(name);
}
