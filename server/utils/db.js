const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'data', 'fanpick.db');

// 确保 data 目录存在
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

let db = null;

// 初始化数据库
async function getDb() {
    if (db) return db;

    const SQL = await initSqlJs();

    // 如果数据库文件存在则加载，否则创建新库
    if (fs.existsSync(DB_PATH)) {
        const buffer = fs.readFileSync(DB_PATH);
        db = new SQL.Database(buffer);
    } else {
        db = new SQL.Database();
    }

    return db;
}

// 保存数据库到文件
function saveDb() {
    if (!db) return;
    const data = db.export();
    fs.writeFileSync(DB_PATH, Buffer.from(data));
}

// 查询多条记录
exports.query = async (sql, params = []) => {
    const database = await getDb();
    const stmt = database.prepare(sql);
    stmt.bind(params);
    const results = [];
    while (stmt.step()) {
        results.push(stmt.getAsObject());
    }
    stmt.free();
    return results;
};

// 查询单条记录
exports.queryOne = async (sql, params = []) => {
    const rows = await exports.query(sql, params);
    return rows[0] || null;
};

// 执行写操作
exports.execute = async (sql, params = []) => {
    const database = await getDb();
    database.run(sql, params);
    saveDb();
    // 返回 lastInsertRowid 和 changes
    const info = database.exec('SELECT last_insert_rowid() AS id, changes() AS changes');
    const row = info[0]?.values[0] || [0, 0];
    return { insertId: row[0], changes: row[1] };
};

// 事务
exports.transaction = async (callback) => {
    const database = await getDb();
    database.run('BEGIN TRANSACTION');
    try {
        const result = await callback(database);
        database.run('COMMIT');
        saveDb();
        return result;
    } catch (err) {
        database.run('ROLLBACK');
        throw err;
    }
};

exports.getDb = getDb;
exports.saveDb = saveDb;
