// 必须登录
exports.requireAuth = (req, res, next) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.error('请先登录', 401);

    const session = (global.sessions || {})[token];
    if (!session) return res.error('登录已过期', 401);

    req.userId = session.userId;
    req.openid = session.openid;
    next();
};

// 可选登录（未登录也能访问，但登录后有额外数据）
exports.optionalAuth = (req, res, next) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (token) {
        const session = (global.sessions || {})[token];
        if (session) {
            req.userId = session.userId;
            req.openid = session.openid;
        }
    }
    next();
};

// 必须是创作者
exports.requireCreator = async (req, res, next) => {
    const db = require('../utils/db');
    const user = await db.queryOne('SELECT role FROM users WHERE id = ?', [req.userId]);
    if (!user || user.role !== 'creator') {
        return res.error('需要创作者身份', 403);
    }
    next();
};
