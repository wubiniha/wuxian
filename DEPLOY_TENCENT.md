# 腾讯云部署

## 服务器准备

```bash
apt-get update
apt-get install -y git nginx
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt-get install -y nodejs
npm install -g pm2
```

## 部署项目

```bash
git clone https://github.com/wubiniha/wuxian.git /opt/wuxian-canvas
cd /opt/wuxian-canvas
cp .env.example .env
nano .env
npm ci
npm run build
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```

至少配置 `OPENROUTER_API_KEY`、`APP_ENCRYPTION_KEY` 和 `WORKSPACE_TOKEN`。有托管数据库和对象存储时，再填写 `DATABASE_URL` 与 `S3_*` 配置。

## Nginx 反向代理

```nginx
server {
  listen 80;
  server_name _;
  location / {
    proxy_pass http://127.0.0.1:11081;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
  }
}
```
