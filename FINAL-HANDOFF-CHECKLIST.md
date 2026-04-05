# 最终交付清单（上线前 + 客户交接）

> 适用于当前项目：
> - 前端：Next.js
> - 后台：Directus
> - 数据库：SQLite
> - 文件存储：七牛云 Kodo
> - 部署方式：GitHub + Docker + PM2 + Nginx

---

## 一、上线前你现在要确认的事情

### 1. 代码层面
- [ ] 前端项目代码已整理完成
- [ ] `pnpm lint` 通过
- [ ] `pnpm typecheck` 通过
- [ ] `pnpm build` 通过
- [ ] `.env.local` 里没有本地开发专用错误配置
- [ ] 不需要提交的敏感文件没有被推到 GitHub

### 2. Directus 后台层面
- [ ] Directus 可以正常登录
- [ ] 产品主图上传正常
- [ ] 下载资料文件上传正常
- [ ] 认证资质图片/文件上传正常
- [ ] 页面内容可以正常编辑
- [ ] 中英文字段维护正常
- [ ] 询盘列表可查看

### 3. 演示内容层面
- [ ] 当前 demo 内容足够让客户理解如何维护
- [ ] 首页可正常展示
- [ ] 产品页可正常展示
- [ ] 下载中心可正常展示
- [ ] 认证资质页可正常展示
- [ ] Header Logo 能显示

---

## 二、推送到 GitHub 前检查

### 必做
- [ ] `.env.local` 不提交
- [ ] `directus/.env` 不提交
- [ ] `directus/.env.kodo` 不提交
- [ ] 数据库文件 `directus/database/data.db` 不提交（除非你明确要一起交付 demo 数据库）
- [ ] 上传文件目录 `directus/uploads/` 不提交（现在正式文件已切到七牛云）

### 建议保留提交
- [ ] 前端源码
- [ ] Directus docker 配置
- [ ] Directus 脚本
- [ ] 部署文档
- [ ] 七牛云接入文档
- [ ] 联调文档

---

## 三、推荐 GitHub 提交内容

建议仓库里保留：

```text
industrial-official-website/
├── src/
├── directus/
│   ├── docker-compose.yml
│   ├── docker-compose.kodo.yml
│   ├── .env.example
│   ├── .env.kodo.example
│   ├── schema-blueprint.json
│   ├── README.md
│   ├── handoff-checklist.md
│   ├── USE-QINIU-KODO.md
│   └── scripts/
├── README.md
├── DEPLOYMENT.md
├── DEPLOY-PRODUCTION.md
└── FINAL-HANDOFF-CHECKLIST.md
```

---

## 四、服务器上线前检查

### 服务器环境
- [ ] Node.js 20+
- [ ] pnpm
- [ ] pm2
- [ ] Docker
- [ ] Docker Compose
- [ ] Nginx
- [ ] Git

### 域名准备
- [ ] 前台域名已准备
- [ ] CMS 子域名已准备
- [ ] DNS 已可配置

### 七牛云准备
- [ ] Bucket 已创建
- [ ] AccessKey / SecretKey 已准备
- [ ] Region 已确认
- [ ] Endpoint 已确认

---

## 五、服务器部署时的实际顺序

### 第一步：拉代码
- [ ] GitHub 仓库已可访问
- [ ] 服务器已成功 `git clone`

### 第二步：配置环境变量
- [ ] 前端 `.env.local` 已填写
- [ ] `directus/.env` 已填写
- [ ] `directus/.env.kodo` 已填写

### 第三步：启动 Directus
- [ ] Docker Compose 已成功启动
- [ ] Directus 后台能打开
- [ ] 七牛云上传测试成功

### 第四步：启动前端
- [ ] `pnpm install` 成功
- [ ] `pnpm build` 成功
- [ ] PM2 启动成功

### 第五步：配置反向代理
- [ ] Nginx 配置完成
- [ ] 前台域名可访问
- [ ] CMS 域名可访问

### 第六步：配置 HTTPS
- [ ] 前台 HTTPS 可访问
- [ ] CMS HTTPS 可访问

---

## 六、客户交接前建议清理/确认

### 如果你要交“可直接维护版”
建议保留 demo 内容，但明确告诉客户：
- 这些内容是示例
- 后续可直接替换成正式内容

### 建议客户优先替换的内容
- [ ] Logo
- [ ] 公司介绍
- [ ] 联系方式
- [ ] 产品图片
- [ ] 产品描述
- [ ] 证书文件
- [ ] 下载资料
- [ ] 网站标题与 SEO 描述

---

## 七、交给客户时建议提供的内容

### 1. 基础信息
- [ ] 前台地址
- [ ] 后台地址
- [ ] 后台管理员账号
- [ ] 后台普通编辑账号（如有）

### 2. 简单使用说明
- [ ] 去哪里改首页
- [ ] 去哪里改产品
- [ ] 去哪里传图片
- [ ] 去哪里传 PDF
- [ ] 去哪里改认证资质
- [ ] 去哪里查看询盘

### 3. 重要提醒
- [ ] 不要随意删除系统字段
- [ ] 不要改 collection 名称
- [ ] 不要改字段英文标识
- [ ] 只在中文标签界面维护内容

---

## 八、你自己保留的技术资料
建议你自己留存：

- [ ] GitHub 仓库地址
- [ ] 服务器登录方式
- [ ] Nginx 配置文件
- [ ] PM2 启动命令
- [ ] 七牛云 Bucket 信息
- [ ] Directus 管理员账号
- [ ] revalidate secret
- [ ] 域名 DNS 配置说明

---

## 九、上线后第一轮检查

### 前台检查
- [ ] 首页正常
- [ ] 中英文切换正常
- [ ] 产品列表正常
- [ ] 产品详情正常
- [ ] 图片显示正常
- [ ] PDF 可下载
- [ ] 认证图片正常
- [ ] 联系页正常
- [ ] 询价页正常

### 后台检查
- [ ] 后台登录正常
- [ ] 文件上传正常
- [ ] 产品主图保存正常
- [ ] 编辑保存正常
- [ ] 新内容刷新后前台能看到

---

## 十、当前最推荐的实际操作顺序

### 你现在下一步建议就是：
1. 把代码推到 GitHub
2. 准备正式服务器
3. 按 `DEPLOY-PRODUCTION.md` 部署
4. 上线后把后台交给客户维护

---

## 十一、一句话总结

当前这套项目已经适合：

**部署到正式环境，然后由客户在 Directus 后台自行维护内容。**
