# 正式环境部署步骤（GitHub + Docker + PM2）

> 适用当前项目：
> - 前端：Next.js
> - 后台：Directus
> - 数据库：SQLite（当前阶段）
> - 文件存储：七牛云 Kodo
> - 进程管理：PM2
> - 反向代理：Nginx

---

## 1. 推荐部署结构

建议正式环境拆成两个服务：

### 前端网站
- 域名：`www.your-domain.com`
- 技术：Next.js
- 运行方式：Node.js + PM2

### 后台 CMS
- 域名：`cms.your-domain.com`
- 技术：Directus
- 运行方式：Docker Compose

---

## 2. 推荐整体流程

1. 把代码上传到 GitHub
2. 服务器安装运行环境
3. 服务器拉取代码
4. 配置前端环境变量
5. 配置 Directus 环境变量
6. 启动 Directus（Docker Compose）
7. 启动前端（PM2）
8. 配置 Nginx 域名反向代理
9. 配置 HTTPS
10. 验证前台、后台、上传、下载、询价

---

## 3. 第一步：上传代码到 GitHub

在本地项目目录执行：

```bash
cd /home/william/Documents/industrial-official-website

git init
git add .
git commit -m "Prepare production deployment for bilingual industrial website"

git branch -M main
git remote add origin 你的GitHub仓库地址
git push -u origin main
```

如果你已经有仓库，就正常提交并推送即可。

---

## 4. 第二步：准备服务器环境

服务器建议安装：

```bash
sudo apt update
sudo apt install -y git nginx docker.io docker-compose-v2
```

安装 Node.js 20+：

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

安装 pnpm 和 pm2：

```bash
sudo npm install -g pnpm pm2
```

检查版本：

```bash
node -v
pnpm -v
pm2 -v
docker --version
docker compose version
```

---

## 5. 第三步：服务器拉取代码

建议目录：

```bash
cd /var/www
sudo git clone 你的GitHub仓库地址 industrial-official-website
sudo chown -R $USER:$USER /var/www/industrial-official-website
cd /var/www/industrial-official-website
```

---

## 6. 第四步：配置前端环境变量

创建前端环境变量文件：

```bash
cd /var/www/industrial-official-website
cp .env.example .env.local
```

编辑 `.env.local`：

```env
NEXT_PUBLIC_SITE_URL=https://www.your-domain.com
DIRECTUS_URL=https://cms.your-domain.com
DIRECTUS_TOKEN=你的DirectusToken
REVALIDATE_SECRET=你自己的强随机密钥
INQUIRY_RECEIVER_EMAIL=sales@example.com
```

说明：
- `DIRECTUS_URL` 必须指向正式 CMS 域名
- `DIRECTUS_TOKEN` 必须是正式环境的 API Token
- `REVALIDATE_SECRET` 需要和 Directus webhook 一致

---

## 7. 第五步：配置 Directus 环境变量

### 7.1 Directus 基础环境变量
进入：

```bash
cd /var/www/industrial-official-website/directus
```

创建 `.env`：

```env
KEY=自己生成的随机KEY
SECRET=自己生成的随机SECRET
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=强密码
ADMIN_TOKEN=自己生成的管理Token
```

### 7.2 七牛云 Kodo 配置
复制模板：

```bash
cp .env.kodo.example .env.kodo
```

编辑 `.env.kodo`：

```env
KODO_ACCESS_KEY=你的AK
KODO_SECRET_KEY=你的SK
KODO_BUCKET=你的Bucket
KODO_REGION=你的区域
KODO_S3_ENDPOINT=你的S3兼容Endpoint
```

---

## 8. 第六步：启动 Directus

在服务器上执行：

```bash
cd /var/www/industrial-official-website/directus

docker compose --env-file .env --env-file .env.kodo -f docker-compose.yml -f docker-compose.kodo.yml up -d
```

查看状态：

```bash
docker compose ps
```

如果要初始化 schema 和 demo 内容：

```bash
./scripts/bootstrap-all.sh
```

如果只想执行后台优化：

```bash
docker compose exec -T directus node /workspace/scripts/optimize-admin.mjs
docker compose exec -T directus node /workspace/scripts/enhance-editor-layout.mjs
docker compose exec -T directus node /workspace/scripts/configure-list-presets.mjs
```

---

## 9. 第七步：启动前端

进入项目根目录：

```bash
cd /var/www/industrial-official-website
```

安装依赖并构建：

```bash
pnpm install
pnpm build
```

使用 PM2 启动：

```bash
pm2 start "pnpm start" --name industrial-website
pm2 save
pm2 startup
```

查看状态：

```bash
pm2 list
pm2 logs industrial-website
```

---

## 10. 第八步：配置 Nginx

### 10.1 前端站点配置
创建：

```bash
sudo nano /etc/nginx/sites-available/industrial-website
```

内容示例：

```nginx
server {
    listen 80;
    server_name www.your-domain.com your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 10.2 Directus 后台配置
创建：

```bash
sudo nano /etc/nginx/sites-available/industrial-cms
```

内容示例：

```nginx
server {
    listen 80;
    server_name cms.your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:8055;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

启用配置：

```bash
sudo ln -s /etc/nginx/sites-available/industrial-website /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/industrial-cms /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 11. 第九步：配置 HTTPS

推荐用 Certbot：

```bash
sudo apt install -y certbot python3-certbot-nginx
```

申请证书：

```bash
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
sudo certbot --nginx -d cms.your-domain.com
```

---

## 12. 第十步：配置 Directus 内容刷新 webhook

前端已经提供：

```text
POST /api/revalidate
```

你需要在 Directus 配置 Flow / Webhook，调用：

```text
https://www.your-domain.com/api/revalidate
```

示例请求体：

```json
{
  "secret": "你的REVALIDATE_SECRET",
  "tags": ["products", "pages", "blog_posts"]
}
```

---

## 13. 上线后更新代码的方式

以后代码更新推荐流程：

```bash
cd /var/www/industrial-official-website
git pull
pnpm install
pnpm build
pm2 restart industrial-website
```

如果 Directus 也有脚本或配置更新，再执行：

```bash
cd /var/www/industrial-official-website/directus
docker compose --env-file .env --env-file .env.kodo -f docker-compose.yml -f docker-compose.kodo.yml up -d
```

---

## 14. 正式上线前检查清单

### 前台检查
- [ ] 首页可打开
- [ ] 中英文切换正常
- [ ] 产品列表可打开
- [ ] 产品详情可打开
- [ ] 图片显示正常
- [ ] 下载文件可点击
- [ ] 认证页显示正常
- [ ] 联系页正常
- [ ] 询价提交正常

### 后台检查
- [ ] Directus 后台可登录
- [ ] 文件上传正常
- [ ] 产品主图保存正常
- [ ] 内容编辑正常
- [ ] 七牛云新文件上传正常

### 服务检查
- [ ] PM2 正常运行
- [ ] Docker 容器正常运行
- [ ] Nginx 正常代理
- [ ] HTTPS 正常
- [ ] revalidate 正常

---

## 15. 当前推荐策略

对于你现在这个项目，我建议：

### 当前正式环境先用
- 数据库：SQLite
- 文件：七牛云 Kodo
- 前端：PM2
- 后台：Docker Compose

### 后续再升级
如果未来出现：
- 多人高频维护
- 数据量明显增大
- 运维要求提高

再考虑把数据库从 SQLite 升级到 PostgreSQL。
