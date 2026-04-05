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

async function patchField(collection, field, meta) {
  await api('PATCH', `/fields/${collection}/${field}`, { meta });
  console.log(`patched field: ${collection}.${field}`);
}

const publishedChoices = [
  { text: '草稿', value: 'draft' },
  { text: '已发布', value: 'published' },
  { text: '已下线', value: 'archived' },
];

const fileHint = '如果直接上传无反应，可先到左侧 Files 上传，再返回此处选择文件。';

const updates = [
  ['products', 'status', { interface: 'select-dropdown', options: { choices: publishedChoices }, width: 'half', note: '产品发布状态' }],
  ['pages', 'status', { interface: 'select-dropdown', options: { choices: publishedChoices }, width: 'half', note: '页面发布状态' }],
  ['industries', 'status', { interface: 'select-dropdown', options: { choices: publishedChoices }, width: 'half', note: '行业方案发布状态' }],
  ['case_studies', 'status', { interface: 'select-dropdown', options: { choices: publishedChoices }, width: 'half', note: '案例发布状态' }],
  ['blog_posts', 'status', { interface: 'select-dropdown', options: { choices: publishedChoices }, width: 'half', note: '文章发布状态' }],
  ['downloads', 'status', { interface: 'select-dropdown', options: { choices: publishedChoices }, width: 'half', note: '下载资料发布状态' }],
  ['certifications', 'status', { interface: 'select-dropdown', options: { choices: publishedChoices }, width: 'half', note: '认证资质发布状态' }],
  ['products', 'is_featured', { interface: 'boolean', options: { label: '是否首页推荐' }, width: 'half' }],
  ['products', 'is_new', { interface: 'boolean', options: { label: '是否新品' }, width: 'half' }],
  ['products', 'is_hot', { interface: 'boolean', options: { label: '是否热门' }, width: 'half' }],
  ['blog_posts', 'is_featured', { interface: 'boolean', options: { label: '是否推荐文章' }, width: 'half' }],
  ['products', 'cover_image', { interface: 'file', display: 'image', note: `产品主图。${fileHint}` }],
  ['downloads', 'file', { interface: 'file', note: `资料文件上传。${fileHint}` }],
  ['certifications', 'file', { interface: 'file', note: `证书文件上传。${fileHint}` }],
  ['certifications', 'image', { interface: 'file', display: 'image', note: `证书图片上传。${fileHint}` }],
  ['site_settings', 'logo', { interface: 'file', display: 'image', note: `网站 Logo 上传。${fileHint}` }],
  ['site_settings', 'favicon', { interface: 'file', display: 'image', note: `网站图标上传。${fileHint}` }],
  ['inquiries', 'status', { interface: 'select-dropdown', options: { choices: [
    { text: '新询盘', value: 'new' },
    { text: '跟进中', value: 'in_progress' },
    { text: '已完成', value: 'done' },
    { text: '无效', value: 'invalid' },
  ] }, note: '询盘跟进状态' }],
];

for (const [collection, field, meta] of updates) {
  await patchField(collection, field, meta);
}
