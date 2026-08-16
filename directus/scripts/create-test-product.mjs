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

  const text = await response.text();
  if (!response.ok) {
    throw new Error(`${method} ${endpoint} failed: ${response.status} ${text}`);
  }

  return text ? JSON.parse(text) : null;
}

const payload = {
  product_code: 'TEST-ROUTE-001',
  name_zh: '流程测试工业接头',
  name_en: 'Process Test Industrial Coupling',
  summary_zh: '用于验证 Directus 创建产品后，前台列表与详情路由是否正常展示。',
  summary_en: 'Used to verify that frontend listing and detail routing work correctly after creating a product in Directus.',
  description_zh: '这是一条用于流程验证的测试产品，覆盖创建、自动发布、自动 slug、分类下拉和前台详情路由。',
  description_en: 'This is a process-validation product covering creation, auto publish, auto slug, category dropdown, and frontend detail routing.',
  features_zh: '自动发布\n自动 slug\n详情路由验证',
  features_en: 'Auto publish\nAuto slug\nDetail route verification',
  applications_zh: '后台流程联调\n前台路由验证',
  applications_en: 'CMS workflow testing\nFrontend route verification',
  material: 'Stainless Steel',
  specification: 'TEST-SPEC-001',
  category_level_1: 5,
};

const existing = await api('GET', '/items/products?filter[product_code][_eq]=TEST-ROUTE-001&limit=1');
const created = existing?.data?.[0]
  ? { reused: true, data: existing.data[0] }
  : await api('POST', '/items/products', payload);

console.log(JSON.stringify(created, null, 2));
