# 火山引擎部署步骤（字节跳动官方云）

> 火山引擎是字节跳动的云服务平台，和抖音同属一家，网络延迟最低

---

## 快速部署：函数计算（最简单）

### 第 1 步：注册火山引擎

1. 打开 https://www.volcengine.com/
2. 点击右上角「注册」
3. 完成注册和实名认证

### 第 2 步：开通函数计算

1. 登录控制台
2. 搜索「函数计算」或「EFC」
3. 点击「立即开通」

### 第 3 步：创建函数

1. 点击「创建函数」
2. 配置：
   - 函数名称：`fanpick-api`
   - 运行环境：Node.js 18
   - 内存：256MB
   - 超时：10 秒

### 第 4 步：上传代码

打包 server 目录并上传：

```bash
cd server
npm install --production
zip -r fanpick.zip . -x "*.git*"
```

### 第 5 步：配置触发器

1. 创建 HTTP 触发器
2. 获取 API 网关地址

---

## 推荐方案：轻量应用服务器（最稳定）

### 第 1 步：购买服务器

1. 打开 https://www.volcengine.com/product/ecm
2. 选择「轻量应用服务器」
3. 配置：
   - 地域：中国（选离你近的）
   - 系统：Ubuntu 22.04
   - 规格：1 核 1G（够用）
   - 带宽：3Mbps
4. 购买（新用户有优惠，约 40 元/月）

### 第 2 步：连接服务器

购买后获取公网 IP 和密码，用 SSH 连接：

```bash
ssh root@你的公网IP
```

### 第 3 步：安装 Node.js

```bash
# 更新系统
apt update

# 安装 Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# 验证
node -v
npm -v
```

### 第 4 步：上传代码

在本地执行（替换 IP）：

```bash
# 打包项目
cd server
npm install --production
cd ..
tar -czf fanpick-server.tar.gz server/

# 上传到服务器
scp fanpick-server.tar.gz root@你的公网IP:/root/
```

### 第 5 步：服务器上部署

```bash
# 解压
cd /root
tar -xzf fanpick-server.tar.gz

# 进入目录
cd server

# 创建环境变量文件
cat > .env << 'EOF'
PORT=3000
TT_APP_ID=tt4186373bdfe20c5401
TT_APP_SECRET=9600b4cfcc9ccd95ac8417b4cf8b28db19de81fb
EOF

# 安装 PM2（进程管理器）
npm install -g pm2

# 启动服务
pm2 start app.js --name fanpick

# 设置开机自启
pm2 startup
pm2 save
```

### 第 6 步：配置 Nginx（HTTPS）

```bash
# 安装 Nginx
apt install -y nginx

# 安装 Certbot（免费 SSL 证书）
apt install -y certbot python3-certbot-nginx
```

创建 Nginx 配置：

```bash
cat > /etc/nginx/sites-available/fanpick << 'EOF'
server {
    listen 80;
    server_name 你的域名;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
EOF

# 启用配置
ln -s /etc/nginx/sites-available/fanpick /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

申请 SSL 证书：

```bash
certbot --nginx -d 你的域名
```

### 第 7 步：验证

访问 `https://你的域名/api/health` 检查服务是否正常。

---

## 无域名方案（直接用 IP）

如果没有域名，可以直接用 IP 访问（但小程序要求 HTTPS）：

### 配置自签名证书

```bash
# 生成自签名证书
mkdir -p /etc/nginx/ssl
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/nginx/ssl/fanpick.key \
    -out /etc/nginx/ssl/fanpick.crt \
    -subj "/CN=你的公网IP"
```

Nginx 配置：

```bash
cat > /etc/nginx/sites-available/fanpick << 'EOF'
server {
    listen 443 ssl;
    server_name 你的公网IP;

    ssl_certificate /etc/nginx/ssl/fanpick.crt;
    ssl_certificate_key /etc/nginx/ssl/fanpick.key;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
EOF

ln -s /etc/nginx/sites-available/fanpick /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

---

## 最终更新小程序

拿到服务器地址后，修改 `miniapp/utils/api.js`：

```javascript
const BASE_URL = 'https://你的域名或IP/api';
```

并在抖音开放平台配置服务器域名。

---

## 费用对比

| 方案 | 月费 | 优点 |
|------|------|------|
| 火山引擎轻量服务器 | ~40 元 | 稳定、国内快 |
| 阿里云轻量服务器 | ~40 元 | 稳定、文档多 |
| 腾讯云轻量服务器 | ~40 元 | 稳定 |
| Railway | 免费/$5 | 免费额度、海外 |
| Vercel | 免费 | 无服务器、海外 |
