# Directus 集成说明

这个目录存放的是前端项目与 Directus 对接时真正会用到的资料。

## 文件说明
- `schema-blueprint.json`：collections、字段、关系的结构蓝图
- `handoff-checklist.md`：CMS 联调和交付前检查清单
- `webhook-payload.example.json`：`/api/revalidate` 的示例请求体
- `collections-required.txt`：当前项目要求的 collection 名单

## 当前已接入的内容模块
前端已经支持 Directus 读取，并保留 fallback：
- `products`
- `industries`
- `case_studies`
- `blog_posts`
- `pages`
- `site_settings`
- `downloads`
- `certifications`

前端已经支持 Directus 写入：
- `inquiries`

## 后续还可以继续补的内容
- 首页更多区块的 CMS 化
- 更细的内容块拆分
- 最终正式内容录入

## 当前环境变量
- `DIRECTUS_URL`
- `DIRECTUS_TOKEN`
- `REVALIDATE_SECRET`

## 当前前端使用的 Directus REST 接口
例如：
- `/items/products`
- `/items/industries`
- `/items/case_studies`
- `/items/blog_posts`
- `/items/pages`
- `/items/site_settings`
- `/items/downloads`
- `/items/certifications`

## 缓存刷新接口
前端提供：
- `/api/revalidate`

当前支持的字段：
- `secret`
- `path`
- `paths`
- `tag`
- `tags`
