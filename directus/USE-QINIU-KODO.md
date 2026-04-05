# 使用七牛云 Kodo 作为 Directus 文件存储

## 1. 适用场景
如果你希望把当前 Directus 的本地 `uploads/` 文件存储切换到云对象存储，并且团队主要在中国维护，七牛云 Kodo 是一个比较顺手的选择。

当前项目已经完成：
- Directus 本地运行
- 前端与 Directus 联调
- 图片/文件上传与读取可用

接下来只需要把 **Directus 文件存储** 从本地切到 **七牛云 Kodo（S3 兼容）**。

---

## 2. 当前项目中已准备好的文件
目录：
`/home/william/Documents/industrial-official-website/directus`

已提供：
- `docker-compose.yml`：当前本地直传到本地磁盘的配置
- `docker-compose.kodo.yml`：切换七牛云 Kodo 的覆盖配置
- `.env.kodo.example`：七牛云环境变量模板

---

## 3. 准备七牛云参数
需要准备这些信息：
- AccessKey
- SecretKey
- Bucket 名称
- Region
- S3 兼容 Endpoint

这些参数需要从你们自己的七牛云 Kodo 控制台获取。

参考官方资料：
- 七牛云 Kodo S3 兼容 API：<https://developer.qiniu.com/kodo/4087/compatible-s3-api>
- 七牛云兼容公共头：<https://developer.qiniu.com/kodo/4091/s3-compatible-header>

---

## 4. 配置环境变量
在 `directus/` 目录下创建 `.env.kodo`：

```bash
cp .env.kodo.example .env.kodo
```

然后填写真实值：

```env
KODO_ACCESS_KEY=your-access-key
KODO_SECRET_KEY=your-secret-key
KODO_BUCKET=your-bucket-name
KODO_REGION=your-region
KODO_S3_ENDPOINT=https://your-kodo-s3-endpoint
```

---

## 5. 启动方式
当前 Directus 本地文件模式：

```bash
docker compose up -d
```

切到七牛云 Kodo：

```bash
docker compose --env-file .env.kodo -f docker-compose.yml -f docker-compose.kodo.yml up -d
```

说明：
- 基础服务仍然使用当前 `docker-compose.yml`
- `docker-compose.kodo.yml` 只负责覆盖文件存储配置

---

## 6. 切换后的效果
切换成功后：
- 新上传的图片/文件将不再写入本地 `uploads/`
- 会直接写入七牛云 Kodo Bucket
- Directus 仍然通过 `directus_files` 记录文件元数据
- 前端无需改动读取逻辑，仍然走 Directus 文件接口

参考 Directus 官方配置文档：
- Directus Config Options / File Storage：<https://docs.directus.io/self-hosted/config-options>

---

## 7. 注意事项
### 1）这次切换只影响“新上传文件”
已经存在于本地 `uploads/` 的历史文件，不会自动迁移到七牛云。

### 2）如果你要正式上线
建议：
- 先确认七牛云 Bucket 可正常读写
- 再做历史文件迁移
- 再切换生产环境

### 3）如果前端图片访问有问题
优先检查：
- Kodo Endpoint 是否正确
- Bucket 权限
- Directus 存储配置是否生效

---

## 8. 推荐迁移顺序
1. 保持当前本地 Directus 继续可用
2. 准备七牛云 Bucket
3. 配置 `.env.kodo`
4. 用覆盖 compose 启动
5. 上传一张测试图片验证
6. 上传一份 PDF 验证
7. 确认前端显示正常
8. 再决定是否迁移历史文件

---

## 9. 当前建议
如果你们现在只是本地联调，先保持本地存储即可。
如果准备进入正式部署和长期内容维护，再切到七牛云 Kodo 会更合理。
