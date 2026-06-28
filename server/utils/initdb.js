const fs = require('fs');
const path = require('path');
const { getDb, saveDb } = require('./db');

async function initDatabase() {
    const db = await getDb();

    const schemaPath = path.join(__dirname, '..', 'schema.sqlite.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');

    // 按分号分割并逐条执行
    const statements = schema
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0);

    for (const stmt of statements) {
        try {
            db.run(stmt);
        } catch (err) {
            if (!err.message.includes('already exists')) {
                console.error('初始化 SQL 执行失败:', err.message);
            }
        }
    }

    saveDb();
    console.log('✅ 数据库初始化完成');
}

module.exports = { initDatabase };
