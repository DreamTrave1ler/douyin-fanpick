require('dotenv').config();
const express = require('express');
const cors = require('cors');
const response = require('./utils/response');
const { requireAuth, optionalAuth } = require('./middleware/auth');
const { initDatabase } = require('./utils/initdb');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());
app.use(response);

// 静态资源缓存
app.use((req, res, next) => {
    // GET 请求缓存 30 秒
    if (req.method === 'GET') {
        res.set('Cache-Control', 'public, max-age=30');
    }
    next();
});

// 路由
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', optionalAuth, require('./routes/product'));
app.use('/api/wants', optionalAuth, require('./routes/want'));
app.use('/api/creator', requireAuth, require('./routes/creator'));

// 健康检查
app.get('/api/health', (req, res) => {
    res.success({ status: 'ok', time: new Date().toISOString() });
});

// 错误处理
app.use((err, req, res, next) => {
    console.error('未捕获错误:', err);
    res.error('服务器内部错误', 500);
});

// 初始化数据库后启动服务
async function start() {
    await initDatabase();
    app.listen(PORT, () => {
        console.log(`🚀 FanPick 服务已启动: http://localhost:${PORT}`);
        console.log(`📊 健康检查: http://localhost:${PORT}/api/health`);
    });
}

start().catch(err => {
    console.error('启动失败:', err);
    process.exit(1);
});

module.exports = app;
