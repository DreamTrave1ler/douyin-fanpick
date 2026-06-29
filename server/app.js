require('dotenv').config();
const express = require('express');
const cors = require('cors');
const compression = require('compression');
const response = require('./utils/response');
const { requireAuth, optionalAuth } = require('./middleware/auth');
const { initDatabase } = require('./utils/initdb');

const app = express();
const PORT = process.env.PORT || 3000;

// 响应压缩 - 减少传输大小
app.use(compression({
    level: 6, // 压缩级别 1-9
    threshold: 1024, // 超过 1KB 才压缩
    filter: (req, res) => {
        if (req.headers['x-no-compression']) return false;
        return compression.filter(req, res);
    }
}));

// 中间件
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400 // 预检请求缓存 24 小时
}));
app.use(express.json({ limit: '1mb' }));
app.use(response);

// 请求连接复用 - Keep-Alive
app.use((req, res, next) => {
    res.set('Connection', 'keep-alive');
    res.set('Keep-Alive', 'timeout=5, max=100');
    next();
});

// GET 请求缓存
app.use((req, res, next) => {
    if (req.method === 'GET') {
        res.set('Cache-Control', 'public, max-age=30, stale-while-revalidate=60');
    }
    next();
});

// 请求超时设置
app.use((req, res, next) => {
    req.setTimeout(5000, () => {
        res.status(408).json({ code: 408, message: '请求超时' });
    });
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
