# 项目启动与部署说明

## 1. 项目位置
```bash
cd /home/william/Documents/industrial-official-website
```

---

## 2. 环境要求
请确保具备以下环境：
- Node.js 20+
- pnpm 10+
- 一个可访问的 Directus 实例
- 已连接到 Directus 的 PostgreSQL 数据库

查看版本：
```bash
node -v
pnpm -v
```

---

## 3. 安装依赖
```bash
pnpm install
```

---

## 4. 配置环境变量
先复制环境变量文件：
```bash
cp .env.example .env.local
```

然后编辑 `.env.local`：
```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
DIRECTUS_URL=http://localhost:8055
DIRECTUS_TOKEN=你的-directus-token
REVALIDATE_SECRET=你的-secret
INQUIRY_RECEIVER_EMAIL=sales@example.com
```

### 必填变量说明
- `DIRECTUS_URL`：Directus 服务地址
- `DIRECTUS_TOKEN`：前端服务端读取 CMS 内容、写入询盘所需 token
- `REVALIDATE_SECRET`：内容更新后刷新缓存所需密钥

---

## 5. 本地启动项目
```bash
pnpm dev
```

启动后访问：
```text
http://localhost:3000
```

可用语言入口：
- `http://localhost:3000/en`
- `http://localhost:3000/zh`

---

## 6. 启动前检查
在联调真实 CMS 内容前，请确认 Directus 中至少已经有这些 collections：
- `site_settings`
- `pages`
- `products`
- `industries`
- `case_studies`
- `blog_posts`
- `downloads`
- `certifications`
- `inquiries`

同时可参考：
- `directus/schema-blueprint.json`
- `directus/handoff-checklist.md`

---

## 7. 验证命令
部署前建议执行：
```bash
pnpm lint
pnpm typecheck
pnpm build
```

如需本地以生产模式运行：
```bash
pnpm start
```

---

## 8. Directus 内容更新刷新机制
当 Directus 内容更新后，可以调用：
```text
POST /api/revalidate
```

示例请求体：
```json
{
  "secret": "your-secret",
  "tags": ["products", "pages"]
}
```

当前支持字段：
- `path`
- `paths`
- `tag`
- `tags`

---

## 9. 推荐部署结构

### 前端
Next.js 前端建议部署在：
- Vercel
- Docker
- Node 服务
- VPS

### CMS
Directus 建议单独部署在：
- Docker
- VPS
- 云服务器

### 推荐域名拆分
- 前端：`www.example.com`
- CMS：`cms.example.com`

---

## 10. 生产环境变量示例
```env
NEXT_PUBLIC_SITE_URL=https://www.example.com
DIRECTUS_URL=https://cms.example.com
DIRECTUS_TOKEN=production-token
REVALIDATE_SECRET=strong-secret
INQUIRY_RECEIVER_EMAIL=sales@example.com
```

---

## 11. 推荐部署步骤

### 第一步
先部署 Directus 和数据库。

### 第二步
根据以下文件创建 collections 和字段：
- `directus/schema-blueprint.json`

### 第三步
初始化最少内容：
- `site_settings`
- `pages`（至少 `home`、`about`、`contact`）
- products
- industries
- cases
- blog posts
- downloads
- certifications

### 第四步
部署 Next.js 前端。

### 第五步
配置环境变量。

### 第六步
在 Directus 中配置 webhook / flow，调用 `/api/revalidate`。

### 第七步
逐项检查：
- 首页
- 产品列表/详情
- 博客列表/详情
- 询价提交
- 下载中心
- 认证资质
- 中英文切换

---

## 12. 常见问题

### 问题：前端一直显示 fallback/mock 内容
可能原因：
- Directus 里没有对应内容
- 字段名与当前代码不一致
- token 权限不足

重点检查：
- collection 名称
- 字段名称
- `status = published`
- token 权限

### 问题：询价提交失败
检查：
- `inquiries` collection 是否存在
- token 是否允许创建数据
- `DIRECTUS_TOKEN` 是否正确

### 问题：内容更新后页面不刷新
检查：
- `REVALIDATE_SECRET`
- Directus webhook 请求体
- `/api/revalidate` 是否能访问

### 问题：图片或附件不显示
检查：
- `DIRECTUS_URL`
- Directus 资源地址
- Next.js 图片远程配置

---

## 13. 最终交付前检查清单
- [ ] `.env.local` 已正确配置
- [ ] Directus collections 已建好
- [ ] token 权限已确认
- [ ] `pnpm lint` 通过
- [ ] `pnpm typecheck` 通过
- [ ] `pnpm build` 通过
- [ ] 询价表单已测试
- [ ] 中英文页面已测试
- [ ] revalidate 已测试

---

## 14. 建议重点查看的文件
- `README.md`
- `.env.example`
- `directus/schema-blueprint.json`
- `directus/handoff-checklist.md`
- `directus/webhook-payload.example.json`


## 15. 切换七牛云 Kodo 存储（可选）
如果你们决定把 Directus 文件从本地 `uploads/` 切换到七牛云 Kodo，可参考：
- `directus/USE-QINIU-KODO.md`
- `directus/docker-compose.kodo.yml`
- `directus/.env.kodo.example`

推荐命令：
```bash
cd /home/william/Documents/industrial-official-website/directus
docker compose --env-file .env.kodo -f docker-compose.yml -f docker-compose.kodo.yml up -d
```
