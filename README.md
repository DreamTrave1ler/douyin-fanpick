# FanPick - 抖音粉丝选品小程序

> 帮助创作者了解粉丝购物偏好，精准选品上架橱窗

## 项目结构

```
douyin-fanpick/
├── docs/PRD.md              # 产品需求文档
├── miniapp/                 # 抖音小程序前端
│   ├── app.js / app.json / app.ttss
│   ├── pages/
│   │   ├── index/           # 首页 - 产品列表 + 投票
│   │   ├── detail/          # 产品详情
│   │   ├── rank/            # 人气排行榜
│   │   └── mine/            # 个人中心 + 创作者入口
│   └── project.config.json
└── server/                  # Node.js 后端
    ├── app.js               # 入口
    ├── .env                 # 环境变量
    ├── schema.sqlite.sql    # 数据库结构
    ├── routes/              # API 路由
    └── controllers/         # 业务逻辑
```

## 快速启动

### 后端服务

```bash
cd server
npm install
npm run dev
```

服务启动后访问 http://localhost:3000/api/health 验证。

### 小程序前端

1. 下载 [抖音开发者工具](https://developer.open-douyin.com/docs/resource/zh-CN/mini-app/develop/developer-instrument/download/)
2. 打开工具 → 导入项目 → 选择 `miniapp` 目录
3. AppID 填入 `tt4186373bdfe20c5401`
4. 修改 `app.js` 中 `baseUrl` 为你的服务端地址
5. 点击「编译」预览

## 上架抖音流程

1. 登录 [抖音开放平台](https://developer.open-douyin.com/)
2. 进入你的小程序 → 开发管理 → 开发设置
3. 获取 **App Secret**，填入 `server/.env`
4. 选择类目（推荐：工具）
5. 提交审核

## API 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/auth/login | 登录 |
| GET | /api/auth/user | 用户信息 |
| GET | /api/products | 产品列表 |
| GET | /api/products/:id | 产品详情 |
| POST | /api/products | 添加产品 |
| POST | /api/wants | 投票 |
| DELETE | /api/wants | 取消投票 |
| GET | /api/wants/rank | 排行榜 |
| GET | /api/creator/dashboard | 创作者数据概览 |

## 技术栈

- 前端：抖音小程序（TTML + TTSS）
- 后端：Node.js + Express
- 数据库：SQLite（零配置）
