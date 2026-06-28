const db = require('../utils/db');

// 点击"想要"
exports.addWant = async (req, res) => {
    try {
        const { product_id } = req.body;
        if (!product_id) return res.error('缺少产品ID', 400);

        // 检查产品是否存在
        const product = await db.queryOne('SELECT id FROM products WHERE id = ? AND status = ?', [product_id, 'active']);
        if (!product) return res.error('产品不存在', 404);

        // 检查是否已投票
        const existing = await db.queryOne('SELECT id FROM wants WHERE user_id = ? AND product_id = ?', [req.userId, product_id]);
        if (existing) return res.error('已经投过票了', 409);

        // 插入投票记录
        await db.execute('INSERT INTO wants (user_id, product_id) VALUES (?, ?)', [req.userId, product_id]);

        // 更新产品计数
        await db.execute('UPDATE products SET want_count = want_count + 1 WHERE id = ?', [product_id]);

        res.success(null, '投票成功');
    } catch (err) {
        console.error('投票失败:', err.message);
        res.error('投票失败', 500);
    }
};

// 取消"想要"
exports.removeWant = async (req, res) => {
    try {
        const { product_id } = req.body;
        if (!product_id) return res.error('缺少产品ID', 400);

        const existing = await db.queryOne('SELECT id FROM wants WHERE user_id = ? AND product_id = ?', [req.userId, product_id]);
        if (!existing) return res.error('尚未投票', 404);

        await db.execute('DELETE FROM wants WHERE user_id = ? AND product_id = ?', [req.userId, product_id]);
        await db.execute('UPDATE products SET want_count = GREATEST(want_count - 1, 0) WHERE id = ?', [product_id]);

        res.success(null, '取消成功');
    } catch (err) {
        res.error('取消失败', 500);
    }
};

// 获取排行榜
exports.getRank = async (req, res) => {
    try {
        const { creator_id, page = 1, size = 20 } = req.query;
        const offset = (page - 1) * size;

        let sql = 'SELECT p.*, u.nickname AS creator_name FROM products p JOIN users u ON p.creator_id = u.id WHERE p.status = ?';
        const params = ['active'];

        if (creator_id) {
            sql += ' AND p.creator_id = ?';
            params.push(creator_id);
        }

        sql += ' ORDER BY p.want_count DESC, p.created_at ASC LIMIT ? OFFSET ?';
        params.push(Number(size), Number(offset));

        const products = await db.query(sql, params);

        // 标记是否已投票
        if (req.userId) {
            const productIds = products.map(p => p.id);
            if (productIds.length) {
                const wants = await db.query(
                    `SELECT product_id FROM wants WHERE user_id = ? AND product_id IN (${productIds.map(() => '?').join(',')})`,
                    [req.userId, ...productIds]
                );
                const wantSet = new Set(wants.map(w => w.product_id));
                products.forEach((p, i) => {
                    p.is_wanted = wantSet.has(p.id);
                    p.rank = offset + i + 1;
                });
            }
        }

        res.success(products);
    } catch (err) {
        res.error('获取排行榜失败', 500);
    }
};

// 获取我投过票的产品
exports.getMyWants = async (req, res) => {
    try {
        const { page = 1, size = 20 } = req.query;
        const offset = (page - 1) * size;

        const products = await db.query(
            `SELECT p.*, u.nickname AS creator_name, w.created_at AS want_time
             FROM wants w
             JOIN products p ON w.product_id = p.id
             JOIN users u ON p.creator_id = u.id
             WHERE w.user_id = ?
             ORDER BY w.created_at DESC LIMIT ? OFFSET ?`,
            [req.userId, Number(size), Number(offset)]
        );

        res.success(products);
    } catch (err) {
        res.error('获取我的投票失败', 500);
    }
};
