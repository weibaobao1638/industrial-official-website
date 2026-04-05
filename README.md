# Industrial Official Website

Next.js + TypeScript + App Router frontend for the bilingual industrial company website.

## Stack
- Next.js
- TypeScript
- App Router
- Directus (headless CMS)
- PostgreSQL (via Directus)

## Commands
```bash
pnpm install
pnpm dev
pnpm lint
pnpm typecheck
pnpm build
```

## Environment
Copy `.env.example` to `.env.local` and fill the values.

## Current implementation status
- Bilingual routes: `zh` / `en`
- Directus read integration:
  - `site_settings`
  - `pages`
  - `products`
  - `industries`
  - `case_studies`
  - `blog_posts`
  - `downloads`
  - `certifications`
- Directus write integration:
  - `inquiries`
- Cache refresh endpoint:
  - `/api/revalidate`

## Directus delivery files
See:
- `directus/schema-blueprint.json`
- `directus/handoff-checklist.md`
- `directus/webhook-payload.example.json`
- `directus/collections-required.txt`

## Recommended delivery order
1. Provision Directus and database
2. Create collections from `schema-blueprint.json`
3. Seed minimum bilingual content
4. Configure frontend `.env.local`
5. Configure Directus webhook to call `/api/revalidate`
6. Run final content verification

## Docs
Project planning docs live in:
`/home/william/Documents/industrial-official-website-docs`


## Startup & Deployment
See `DEPLOYMENT.md` for local startup, Directus integration, and deployment steps.


## 正式环境部署
使用 GitHub + Docker + PM2 的正式环境部署说明见：`DEPLOY-PRODUCTION.md`


## 最终交付清单
上线前与客户交接建议看：`FINAL-HANDOFF-CHECKLIST.md`
