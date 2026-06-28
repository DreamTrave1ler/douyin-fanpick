const db = require('../utils/db');

// 获取产品列表（粉丝端）
exports.getProducts = async (req, res) => {
    try {
        const { creator_id, page = 1, size = 20 } = req.query;
        const offset = (page - 1) * size;

        let sql = 'SELECT p.*, u.nickname AS creator_name FROM products p JOIN users u ON p.creator_id = u.id WHERE p.status = ?';
        const params = ['active'];

        if (creator_id) {
            sql += ' AND p.creator_id = ?';
            params.push(creator_id);
        }

        sql += ' ORDER BY p.want_count DESC, p.created_at DESC LIMIT ? OFFSET ?';
        params.push(Number(size), Number(offset));

        const products = await db.query(sql, params);

        // 标记当前用户是否已投票
        if (req.userId) {
            const productIds = products.map(p => p.id);
            if (productIds.length) {
                const wants = await db.query(
                    `SELECT product_id FROM wants WHERE user_id = ? AND product_id IN (${productIds.map(() => '?').join(',')})`,
                    [req.userId, ...productIds]
                );
                const wantSet = new Set(wants.map(w => w.product_id));
                products.forEach(p => { p.is_wanted = wantSet.has(p.id); });
            }
        }

        // 获取总数
        let countSql = 'SELECT COUNT(*) AS total FROM products WHERE status = ?';
        const countParams = ['active'];
        if (creator_id) {
            countSql += ' AND creator_id = ?';
            countParams.push(creator_id);
        }
        const { total } = await db.queryOne(countSql, countParams);

        res.success({ list: products, total, page: Number(page), size: Number(size) });
    } catch (err) {
        console.error('获取产品列表失败:', err.message);
        res.error('获取产品列表失败', 500);
    }
};

// 获取产品详情
exports.getProductDetail = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await db.queryOne(
            'SELECT p.*, u.nickname AS creator_name FROM products p JOIN users u ON p.creator_id = u.id WHERE p.id = ?',
            [id]
        );
        if (!product) return res.error('产品不存在', 404);

        // 检查当前用户是否已投票
        if (req.userId) {
            const want = await db.queryOne('SELECT id FROM wants WHERE user_id = ? AND product_id = ?', [req.userId, id]);
            product.is_wanted = !!want;
        }

        res.success(product);
    } catch (err) {
        res.error('获取详情失败', 500);
    }
};

// 创作者添加产品
exports.addProduct = async (req, res) => {
    try {
        const { product_id, title, image, price, detail_url } = req.body;
        if (!product_id || !title) return res.error('缺少必要参数', 400);

        const existing = await db.queryOne(
            'SELECT id FROM products WHERE creator_id = ? AND product_id = ?',
            [req.userId, product_id]
        );
        if (existing) return res.error('该产品已存在', 409);

        const result = await db.execute(
            'INSERT INTO products (creator_id, product_id, title, image, price, detail_url) VALUES (?, ?, ?, ?, ?, ?)',
            [req.userId, product_id, title, image || '', price || 0, detail_url || '']
        );

        res.success({ id: result.insertId }, '添加成功');
    } catch (err) {
        console.error('添加产品失败:', err.message);
        res.error('添加产品失败', 500);
    }
};

// 创作者批量导入产品
exports.batchAddProducts = async (req, res) => {
    try {
        const { products } = req.body;
        if (!Array.isArray(products) || !products.length) return res.error('缺少产品数据', 400);

        let added = 0;
        for (const p of products) {
            try {
                await db.execute(
                    'INSERT IGNORE INTO products (creator_id, product_id, title, image, price, detail_url) VALUES (?, ?, ?, ?, ?, ?)',
                    [req.userId, p.product_id, p.title, p.image || '', p.price || 0, p.detail_url || '']
                );
                added++;
            } catch (e) { /* skip duplicates */ }
        }

        res.success({ added, total: products.length }, `成功导入 ${added} 个产品`);
    } catch (err) {
        res.error('批量导入失败', 500);
    }
};

// 创作者更新产品状态
exports.updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, title, image } = req.body;

        const product = await db.queryOne('SELECT id FROM products WHERE id = ? AND creator_id = ?', [id, req.userId]);
        if (!product) return res.error('产品不存在或无权操作', 404);

        const updates = [];
        const params = [];
        if (status) { updates.push('status = ?'); params.push(status); }
        if (title) { updates.push('title = ?'); params.push(title); }
        if (image) { updates.push('image = ?'); params.push(image); }

        if (!updates.length) return res.error('没有需要更新的字段', 400);

        params.push(id);
        await db.execute(`UPDATE products SET ${updates.join(', ')} WHERE id = ?`, params);

        res.success(null, '更新成功');
    } catch (err) {
        res.error('更新失败', 500);
    }
};

// 创作者删除产品
exports.deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await db.queryOne('SELECT id FROM products WHERE id = ? AND creator_id = ?', [id, req.userId]);
        if (!product) return res.error('产品不存在或无权操作', 404);

        await db.execute('DELETE FROM wants WHERE product_id = ?', [id]);
        await db.execute('DELETE FROM products WHERE id = ?', [id]);

        res.success(null, '删除成功');
    } catch (err) {
        res.error('删除失败', 500);
    }
};
