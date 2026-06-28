const db = require('../utils/db');

// 获取创作者数据概览
exports.getDashboard = async (req, res) => {
    try {
        const creatorId = req.userId;

        // 产品总数
        const { product_count } = await db.queryOne(
            'SELECT COUNT(*) AS product_count FROM products WHERE creator_id = ?', [creatorId]
        );

        // 总投票数
        const { total_wants } = await db.queryOne(
            `SELECT COALESCE(SUM(p.want_count), 0) AS total_wants
             FROM products p WHERE p.creator_id = ?`, [creatorId]
        );

        // 参与投票的粉丝数
        const { fan_count } = await db.queryOne(
            `SELECT COUNT(DISTINCT w.user_id) AS fan_count
             FROM wants w JOIN products p ON w.product_id = p.id
             WHERE p.creator_id = ?`, [creatorId]
        );

        // 今日新增投票
        const { today_wants } = await db.queryOne(
            `SELECT COUNT(*) AS today_wants
             FROM wants w JOIN products p ON w.product_id = p.id
             WHERE p.creator_id = ? AND DATE(w.created_at) = CURDATE()`, [creatorId]
        );

        // Top 5 产品
        const topProducts = await db.query(
            `SELECT id, title, image, price, want_count
             FROM products WHERE creator_id = ? AND status = 'active'
             ORDER BY want_count DESC LIMIT 5`, [creatorId]
        );

        res.success({
            product_count,
            total_wants,
            fan_count,
            today_wants,
            top_products: topProducts
        });
    } catch (err) {
        console.error('获取数据概览失败:', err.message);
        res.error('获取数据概览失败', 500);
    }
};

// 获取投票趋势数据（最近7天）
exports.getTrend = async (req, res) => {
    try {
        const creatorId = req.userId;

        const trend = await db.query(
            `SELECT DATE(w.created_at) AS date, COUNT(*) AS count
             FROM wants w JOIN products p ON w.product_id = p.id
             WHERE p.creator_id = ? AND w.created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
             GROUP BY DATE(w.created_at)
             ORDER BY date ASC`, [creatorId]
        );

        res.success(trend);
    } catch (err) {
        res.error('获取趋势数据失败', 500);
    }
};

// 获取粉丝投票详情
exports.getFanVotes = async (req, res) => {
    try {
        const { product_id } = req.params;

        // 验证产品归属
        const product = await db.queryOne('SELECT id FROM products WHERE id = ? AND creator_id = ?', [product_id, req.userId]);
        if (!product) return res.error('产品不存在', 404);

        const votes = await db.query(
            `SELECT u.id, u.nickname, u.avatar, w.created_at
             FROM wants w JOIN users u ON w.user_id = u.id
             WHERE w.product_id = ?
             ORDER BY w.created_at DESC`, [product_id]
        );

        res.success(votes);
    } catch (err) {
        res.error('获取粉丝投票详情失败', 500);
    }
};

// 获取我的产品列表（创作者）
exports.getMyProducts = async (req, res) => {
    try {
        const { status, page = 1, size = 20 } = req.query;
        const offset = (page - 1) * size;

        let sql = 'SELECT * FROM products WHERE creator_id = ?';
        const params = [req.userId];

        if (status) {
            sql += ' AND status = ?';
            params.push(status);
        }

        sql += ' ORDER BY want_count DESC, created_at DESC LIMIT ? OFFSET ?';
        params.push(Number(size), Number(offset));

        const products = await db.query(sql, params);
        res.success(products);
    } catch (err) {
        res.error('获取产品列表失败', 500);
    }
};
