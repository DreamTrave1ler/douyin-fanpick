const db = require('../utils/db');

// 获取产品列表（粉丝端）- 优化版
exports.getProducts = async (req, res) => {
    try {
        const { creator_id, page = 1, size = 20, category } = req.query;
        const offset = (page - 1) * size;

        // 构建查询条件
        let whereClause = 'WHERE p.status = ?';
        const params = ['active'];

        if (creator_id) {
            whereClause += ' AND p.creator_id = ?';
            params.push(creator_id);
        }

        if (category && category !== 'all') {
            whereClause += ' AND p.category = ?';
            params.push(category);
        }

        // 单次查询获取产品和用户信息
        const sql = `
            SELECT p.*, u.nickname AS creator_name
            FROM products p
            JOIN users u ON p.creator_id = u.id
            ${whereClause}
            ORDER BY p.want_count DESC, p.created_at DESC
            LIMIT ? OFFSET ?
        `;
        params.push(Number(size), Number(offset));

        const products = await db.query(sql, params);

        // 批量检查投票状态（单次查询）
        if (req.userId && products.length > 0) {
            const productIds = products.map(p => p.id);
            const placeholders = productIds.map(() => '?').join(',');
            const wants = await db.query(
                `SELECT product_id FROM wants WHERE user_id = ? AND product_id IN (${placeholders})`,
                [req.userId, ...productIds]
            );
            const wantSet = new Set(wants.map(w => w.product_id));
            products.forEach(p => { p.is_wanted = wantSet.has(p.id); });
        }

        // 获取总数（使用缓存友好的查询）
        const countSql = `SELECT COUNT(*) AS total FROM products ${whereClause}`;
        const countParams = params.slice(0, -2); // 去掉 LIMIT 和 OFFSET
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

        // 单次查询获取产品和用户信息
        const product = await db.queryOne(
            'SELECT p.*, u.nickname AS creator_name, u.avatar AS creator_avatar FROM products p JOIN users u ON p.creator_id = u.id WHERE p.id = ?',
            [id]
        );
        if (!product) return res.error('产品不存在', 404);

        // 检查当前用户是否已投票
        if (req.userId) {
            const want = await db.queryOne('SELECT id FROM wants WHERE user_id = ? AND product_id = ?', [req.userId, id]);
            product.is_wanted = !!want;
        }

        // 异步增加浏览量（不阻塞响应）
        db.execute('UPDATE products SET view_count = view_count + 1 WHERE id = ?', [id]).catch(() => {});

        res.success(product);
    } catch (err) {
        res.error('获取详情失败', 500);
    }
};

// 搜索产品
exports.searchProducts = async (req, res) => {
    try {
        const { keyword, page = 1, size = 20 } = req.query;
        const offset = (page - 1) * size;

        if (!keyword) return res.success({ list: [], total: 0 });

        const sql = `
            SELECT p.*, u.nickname AS creator_name
            FROM products p
            JOIN users u ON p.creator_id = u.id
            WHERE p.status = 'active' AND (p.title LIKE ? OR p.description LIKE ?)
            ORDER BY p.want_count DESC
            LIMIT ? OFFSET ?
        `;
        const searchPattern = `%${keyword}%`;
        const products = await db.query(sql, [searchPattern, searchPattern, Number(size), Number(offset)]);

        res.success({ list: products, total: products.length });
    } catch (err) {
        res.error('搜索失败', 500);
    }
};

// 创作者添加产品
exports.addProduct = async (req, res) => {
    try {
        const { product_id, title, image, price, detail_url, category } = req.body;
        if (!product_id || !title) return res.error('缺少必要参数', 400);

        const existing = await db.queryOne(
            'SELECT id FROM products WHERE creator_id = ? AND product_id = ?',
            [req.userId, product_id]
        );
        if (existing) return res.error('该产品已存在', 409);

        const result = await db.execute(
            'INSERT INTO products (creator_id, product_id, title, image, price, detail_url, category) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [req.userId, product_id, title, image || '', price || 0, detail_url || '', category || '']
        );

        res.success({ id: result.insertId }, '添加成功');
    } catch (err) {
        console.error('添加产品失败:', err.message);
        res.error('添加产品失败', 500);
    }
};

// 创作者批量导入产品（使用事务）
exports.batchAddProducts = async (req, res) => {
    try {
        const { products } = req.body;
        if (!Array.isArray(products) || !products.length) return res.error('缺少产品数据', 400);

        // 构建批量操作
        const operations = products.map(p => ({
            sql: 'INSERT OR IGNORE INTO products (creator_id, product_id, title, image, price, detail_url, category) VALUES (?, ?, ?, ?, ?, ?, ?)',
            params: [req.userId, p.product_id, p.title, p.image || '', p.price || 0, p.detail_url || '', p.category || '']
        }));

        const results = await db.batchExecute(operations);
        const added = results.filter(r => r.changes > 0).length;

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

        // 使用事务批量删除
        await db.transaction(async (database) => {
            database.run('DELETE FROM wants WHERE product_id = ?', [id]);
            database.run('DELETE FROM products WHERE id = ?', [id]);
        });

        res.success(null, '删除成功');
    } catch (err) {
        res.error('删除失败', 500);
    }
};
