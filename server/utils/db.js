const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'data', 'fanpick.db');

// 确保 data 目录存在
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

let db = null;
let saveTimer = null;
let isDirty = false;

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

    // 启用 WAL 模式提升性能
    db.run('PRAGMA journal_mode=WAL');
    db.run('PRAGMA synchronous=NORMAL');
    db.run('PRAGMA cache_size=1000');

    return db;
}

// 延迟批量保存（防抖）
function scheduleSave() {
    isDirty = true;
    if (saveTimer) return;

    saveTimer = setTimeout(() => {
        if (isDirty) {
            saveDb();
            isDirty = false;
        }
        saveTimer = null;
    }, 100); // 100ms 内的多次写入合并为一次
}

// 保存数据库到文件
function saveDb() {
    if (!db) return;
    const data = db.export();
    fs.writeFileSync(DB_PATH, Buffer.from(data));
}

// 查询多条记录（带内存缓存）
const queryCache = new Map();
const CACHE_TTL = 5000; // 5秒缓存

exports.query = async (sql, params = []) => {
    const database = await getDb();

    // 对只读查询使用缓存
    const isReadonly = sql.trim().toUpperCase().startsWith('SELECT');
    const cacheKey = isReadonly ? `${sql}_${JSON.stringify(params)}` : null;

    if (cacheKey && queryCache.has(cacheKey)) {
        const cached = queryCache.get(cacheKey);
        if (Date.now() - cached.time < CACHE_TTL) {
            return cached.data;
        }
    }

    const stmt = database.prepare(sql);
    stmt.bind(params);
    const results = [];
    while (stmt.step()) {
        results.push(stmt.getAsObject());
    }
    stmt.free();

    // 缓存查询结果
    if (cacheKey) {
        queryCache.set(cacheKey, { data: results, time: Date.now() });

        // 清理过期缓存
        if (queryCache.size > 100) {
            const now = Date.now();
            for (const [key, value] of queryCache) {
                if (now - value.time > CACHE_TTL) {
                    queryCache.delete(key);
                }
            }
        }
    }

    return results;
};

// 查询单条记录
exports.queryOne = async (sql, params = []) => {
    const rows = await exports.query(sql, params);
    return rows[0] || null;
};

// 执行写操作（延迟保存）
exports.execute = async (sql, params = []) => {
    const database = await getDb();
    database.run(sql, params);

    // 清除相关缓存
    queryCache.clear();

    // 延迟保存
    scheduleSave();

    // 返回 lastInsertRowid 和 changes
    const info = database.exec('SELECT last_insert_rowid() AS id, changes() AS changes');
    const row = info[0]?.values[0] || [0, 0];
    return { insertId: row[0], changes: row[1] };
};

// 批量执行（事务）
exports.batchExecute = async (operations) => {
    const database = await getDb();
    database.run('BEGIN TRANSACTION');

    try {
        const results = [];
        for (const { sql, params } of operations) {
            database.run(sql, params);
            const info = database.exec('SELECT last_insert_rowid() AS id, changes() AS changes');
            const row = info[0]?.values[0] || [0, 0];
            results.push({ insertId: row[0], changes: row[1] });
        }

        database.run('COMMIT');

        // 清除缓存
        queryCache.clear();

        // 延迟保存
        scheduleSave();

        return results;
    } catch (err) {
        database.run('ROLLBACK');
        throw err;
    }
};

// 事务
exports.transaction = async (callback) => {
    const database = await getDb();
    database.run('BEGIN TRANSACTION');
    try {
        const result = await callback(database);
        database.run('COMMIT');

        // 清除缓存
        queryCache.clear();

        // 延迟保存
        scheduleSave();

        return result;
    } catch (err) {
        database.run('ROLLBACK');
        throw err;
    }
};

// 强制保存
exports.flush = () => {
    if (saveTimer) {
        clearTimeout(saveTimer);
        saveTimer = null;
    }
    if (isDirty) {
        saveDb();
        isDirty = false;
    }
};

exports.getDb = getDb;
exports.saveDb = saveDb;

// 进程退出时保存
process.on('exit', () => exports.flush());
process.on('SIGINT', () => { exports.flush(); process.exit(); });
process.on('SIGTERM', () => { exports.flush(); process.exit(); });
