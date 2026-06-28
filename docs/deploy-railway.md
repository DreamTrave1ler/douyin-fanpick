# Railway 部署详细步骤

## 方式一：通过 GitHub 部署（推荐）

### 第 1 步：将代码推送到 GitHub

1. **创建 GitHub 仓库**
   - 打开 https://github.com/new
   - 仓库名：`douyin-fanpick`
   - 选择 **Private**（私有仓库，保护你的代码）
   - 点击「Create repository」

2. **初始化并推送代码**

   在项目根目录执行：

   ```bash
   # 初始化 git
   git init

   # 添加所有文件
   git add .

   # 首次提交
   git commit -m "Initial commit - FanPick 小程序"

   # 关联远程仓库（替换 YOUR_USERNAME）
   git remote add origin https://github.com/YOUR_USERNAME/douyin-fanpick.git

   # 推送
   git branch -M main
   git push -u origin main
   ```

### 第 2 步：注册 Railway

1. 打开 https://railway.app/
2. 点击「Login」
3. 选择「Login with GitHub」授权

### 第 3 步：创建项目并部署

1. 点击「New Project」
2. 选择「Deploy from GitHub repo」
3. 找到并选择 `douyin-fanpick` 仓库
4. Railway 会自动检测到 Dockerfile 并开始构建

### 第 4 步：配置环境变量

1. 在项目页面点击 `fanpick-server` 服务
2. 点击「Variables」标签
3. 添加以下环境变量：

   | 变量名 | 值 |
   |--------|-----|
   | `PORT` | `3000` |
   | `TT_APP_ID` | `tt4186373bdfe20c5401` |
   | `TT_APP_SECRET` | `9600b4cfcc9ccd95ac8417b4cf8b28db19de81fb` |

4. 点击「Add」保存

### 第 5 步：获取公网地址

1. 点击「Settings」标签
2. 找到「Networking」部分
3. 点击「Generate Domain」
4. 获得地址如：`https://fanpick-server-production.up.railway.app`

### 第 6 步：验证部署

1. 在浏览器访问：`https://fanpick-server-production.up.railway.app/api/health`
2. 应该看到：
   ```json
   {"code":0,"data":{"status":"ok","time":"2026-06-28T..."}}
   ```

---

## 方式二：通过 Railway CLI 部署

### 第 1 步：安装 Railway CLI

```bash
npm install -g @railway/cli
```

### 第 2 步：登录

```bash
railway login
```

浏览器会打开授权页面，点击授权。

### 第 3 步：初始化项目

```bash
cd server
railway init
```

输入项目名称：`fanpick-server`

### 第 4 步：设置环境变量

```bash
railway variables set PORT=3000
railway variables set TT_APP_ID=tt4186373bdfe20c5401
railway variables set TT_APP_SECRET=9600b4cfcc9ccd95ac8417b4cf8b28db19de81fb
```

### 第 5 步：部署

```bash
railway up
```

### 第 6 步：生成公网域名

```bash
railway domain
```

---

## 部署后更新小程序

### 更新 API 地址

修改 `miniapp/utils/api.js`：

```javascript
const BASE_URL = 'https://你的Railway地址/api';
```

例如：
```javascript
const BASE_URL = 'https://fanpick-server-production.up.railway.app/api';
```

---

## 免费额度说明

Railway 免费计划：
- 每月 **$5** 免费额度
- 512MB 内存
- 足够小型项目使用
- 超出后会暂停服务，下月恢复

---

## 常见问题

### Q: 构建失败怎么办？

A: 检查 Dockerfile 是否正确，查看构建日志定位问题。

### Q: 服务启动后立即停止？

A: 检查环境变量是否正确设置，查看日志排查错误。

### Q: 数据会丢失吗？

A: Railway 的免费层每次部署会重置文件系统。SQLite 数据库文件会丢失。
   如果需要持久化，考虑：
   1. 升级到付费计划（支持持久化卷）
   2. 改用外部数据库（如 PlanetScale、Supabase）

### Q: 如何查看日志？

A: 在 Railway 项目页面点击「Deployments」→ 选择部署 → 查看日志。
