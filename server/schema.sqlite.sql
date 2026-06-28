-- FanPick SQLite 数据库结构

-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    openid      TEXT    NOT NULL UNIQUE,
    nickname    TEXT    DEFAULT '',
    avatar      TEXT    DEFAULT '',
    role        TEXT    NOT NULL DEFAULT 'fan' CHECK(role IN ('fan','creator')),
    douyin_uid  TEXT    DEFAULT '',
    created_at  TEXT    NOT NULL DEFAULT (datetime('now','localtime')),
    updated_at  TEXT    NOT NULL DEFAULT (datetime('now','localtime'))
);

CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_douyin_uid ON users(douyin_uid);

-- 产品表
CREATE TABLE IF NOT EXISTS products (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    creator_id  INTEGER NOT NULL,
    product_id  TEXT    NOT NULL,
    title       TEXT    NOT NULL DEFAULT '',
    image       TEXT    NOT NULL DEFAULT '',
    price       INTEGER NOT NULL DEFAULT 0,
    detail_url  TEXT    DEFAULT '',
    status      TEXT    NOT NULL DEFAULT 'active' CHECK(status IN ('active','inactive')),
    want_count  INTEGER NOT NULL DEFAULT 0,
    sort_order  INTEGER NOT NULL DEFAULT 0,
    created_at  TEXT    NOT NULL DEFAULT (datetime('now','localtime')),
    updated_at  TEXT    NOT NULL DEFAULT (datetime('now','localtime')),
    UNIQUE(creator_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_products_creator_status ON products(creator_id, status);
CREATE INDEX IF NOT EXISTS idx_products_want_count ON products(want_count DESC);

-- 投票表
CREATE TABLE IF NOT EXISTS wants (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER NOT NULL,
    product_id  INTEGER NOT NULL,
    created_at  TEXT    NOT NULL DEFAULT (datetime('now','localtime')),
    UNIQUE(user_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_wants_product ON wants(product_id);
CREATE INDEX IF NOT EXISTS idx_wants_user ON wants(user_id);

-- 创作者橱窗关联表
CREATE TABLE IF NOT EXISTS creator_showcases (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    creator_id    INTEGER NOT NULL,
    showcase_id   TEXT    NOT NULL,
    showcase_name TEXT    DEFAULT '',
    synced_at     TEXT    DEFAULT NULL,
    created_at    TEXT    NOT NULL DEFAULT (datetime('now','localtime')),
    UNIQUE(creator_id, showcase_id)
);
