# 抖音云部署详细步骤

> 抖音云是字节跳动官方提供的云服务，与小程序无缝集成

---

## 第 1 步：开通抖音云

1. 打开 https://developer.open-douyin.com/
2. 登录你的开发者账号
3. 进入你的小程序应用
4. 左侧菜单找到「抖音云」或「云服务」
5. 点击「立即开通」
6. 完成实名认证（如未完成）

---

## 第 2 步：创建云服务

1. 进入抖音云控制台
2. 点击「创建服务」
3. 选择服务类型：
   - **云函数**（Serverless）← 推荐，适合小型项目
   - **云托管**（容器化部署）
4. 服务名称：`fanpick-server`
5. 选择地域：中国（默认）

---

## 第 3 步：使用云函数部署

### 3.1 创建云函数

1. 点击「云函数」→「创建函数」
2. 函数名称：`fanpick-api`
3. 运行环境：Node.js 18
4. 代码上传方式：选择「本地上传」

### 3.2 打包服务代码

在 `server` 目录下创建云函数入口文件：

```javascript
// 云函数入口文件 index.js
const app = require('./app');

// 云函数入口
exports.main = async (event, context) => {
    return app;
};
```

打包命令：
```bash
cd server
# 删除 node_modules 重新安装
rm -rf node_modules
npm install --production

# 打包（包含所有文件）
zip -r fanpick-server.zip . -x "*.git*" -x "*.env"
```

### 3.3 上传代码包

1. 上传 `fanpick-server.zip`
2. 入口文件：`index.main`
3. 超时时间：10 秒
4. 内存：256MB

### 3.4 配置环境变量

在云函数配置中添加：

| 变量名 | 值 |
|--------|-----|
| `TT_APP_ID` | `tt4186373bdfe20c5401` |
| `TT_APP_SECRET` | `9600b4cfcc9ccd95ac8417b4cf8b28db19de81fb` |

### 3.5 配置触发器

1. 创建 HTTP 触发器
2. 路径：`/api/*`
3. 请求方法：全部
4. 获取访问地址

---

## 第 4 步：使用云托管部署（推荐）

云托管更适合完整的 Express 应用。

### 4.1 创建云托管服务

1. 抖音云控制台 →「云托管」→「创建服务」
2. 服务名称：`fanpick`
3. 部署方式：选择「镜像部署」

### 4.2 构建镜像

由于抖音云可能不支持直接上传 Dockerfile，需要推送到镜像仓库：

```bash
# 本地构建镜像
docker build -t fanpick-server ./server

# 标记镜像（替换为抖音云提供的镜像仓库地址）
docker tag fanpick-server:latest registry.douyincloud.com/你的命名空间/fanpick-server:latest

# 推送镜像
docker push registry.douyincloud.com/你的命名空间/fanpick-server:latest
```

### 4.3 配置服务

- 端口：`3000`
- 环境变量：同上
- 实例规格：1 核 512MB

### 4.4 获取访问地址

部署成功后，在服务详情页获取：
- 内网地址（小程序内部使用）
- 外网访问地址（如果开启了外网访问）

---

## 第 5 步：小程序内配置

### 5.1 配置服务器域名

1. 进入「开发管理」→「开发设置」
2. 服务器域名 → request 合法域名
3. 添加抖音云分配的域名

### 5.2 更新小程序代码

修改 `miniapp/utils/api.js`：

```javascript
// 如果使用抖音云云托管，使用分配的域名
const BASE_URL = 'https://你的抖音云域名/api';
```

---

## 抖音云免费额度

| 资源 | 免费额度 |
|------|----------|
| 云函数 | 每月 40 万次调用 |
| 云托管 | 新用户有免费试用期 |
| 存储 | 1GB |
| 流量 | 一定额度内免费 |

---

## 常见问题

### Q: 找不到抖音云入口？

A: 并非所有账号都有抖音云权限，可能需要：
1. 完成企业认证
2. 或使用其他云服务（如阿里云、腾讯云）

### Q: 云函数和云托管选哪个？

A: 推荐**云托管**，因为：
- Express 应用更适合容器化部署
- 支持 WebSocket
- 更好的调试体验

### Q: 数据库怎么处理？

A: sql.js 使用文件存储，云函数环境下文件系统是临时的。解决方案：
1. 使用抖音云提供的云数据库
2. 或使用外部数据库服务
