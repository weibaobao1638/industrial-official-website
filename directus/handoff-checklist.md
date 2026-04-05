# Directus 联调与交付清单

这是把项目从“前端骨架 + fallback 数据”推进到“真实 CMS 驱动交付版”的最小检查清单。

## 1. 基础设施
- [ ] Directus 已部署并可访问
- [ ] PostgreSQL 已连接且正常
- [ ] 文件/资源存储已配置
- [ ] 前端 `.env.local` 已填写完成

## 2. Collections
需要创建并确认以下 collections：
- [ ] `site_settings`
- [ ] `pages`
- [ ] `product_categories`
- [ ] `products`
- [ ] `industries`
- [ ] `case_studies`
- [ ] `blog_categories`
- [ ] `blog_posts`
- [ ] `downloads`
- [ ] `certifications`
- [ ] `inquiries`

## 3. 核心字段
前端当前依赖这些命名约定：
- [ ] `*_zh` / `*_en` 语言字段
- [ ] `slug_zh` / `slug_en`
- [ ] `status`
- [ ] `sort_order`（适用时）
- [ ] `schema-blueprint.json` 中定义的 relation 字段

## 4. 发布状态约定
前端当前默认读取：
- `status = published`

## 5. API Token 权限
- [ ] 创建用于前端服务端读取内容的 Directus token
- [ ] 确认该 token 可读取网站相关 collections
- [ ] 确认该 token 可写入 `inquiries`
- [ ] 不必要的管理类 collections 不要开放给前端 token

## 6. revalidate 刷新配置
在 Directus 中配置 Flow / Webhook，请求：
- `/api/revalidate`

建议请求体：
- 产品更新：`{ "secret": "...", "tags": ["products"] }`
- 博客更新：`{ "secret": "...", "tags": ["blog_posts"] }`
- 页面更新：`{ "secret": "...", "tags": ["pages"] }`
- 多模块更新：`{ "secret": "...", "tags": ["products", "industries"] }`

## 7. 最少内容初始化
在正式联调前，建议至少录入：
- [ ] `site_settings` 单例
- [ ] `pages` 中的 `home`
- [ ] `pages` 中的 `about`
- [ ] `pages` 中的 `contact`
- [ ] 6 个以上产品
- [ ] 3 个以上行业方案
- [ ] 2 个以上案例
- [ ] 4 篇以上博客文章
- [ ] 2 个以上下载资料
- [ ] 2 个以上认证资质

## 8. 最终联调检查
- [ ] 产品列表读取真实 CMS 数据
- [ ] 产品详情读取真实 CMS 数据
- [ ] 博客列表/详情读取真实 CMS 数据
- [ ] 询价表单可写入 `inquiries`
- [ ] revalidate 可以正确刷新页面
