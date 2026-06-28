-- FanPick 数据库结构
CREATE DATABASE IF NOT EXISTS fanpick DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE fanpick;

-- 用户表
CREATE TABLE users (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    openid      VARCHAR(64)  NOT NULL UNIQUE COMMENT '抖音用户openid',
    nickname    VARCHAR(100) DEFAULT '' COMMENT '昵称',
    avatar      VARCHAR(500) DEFAULT '' COMMENT '头像URL',
    role        ENUM('fan','creator') NOT NULL DEFAULT 'fan' COMMENT '角色',
    douyin_uid  VARCHAR(64)  DEFAULT '' COMMENT '抖音创作者UID',
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_role (role),
    INDEX idx_douyin_uid (douyin_uid)
) ENGINE=InnoDB;

-- 产品表
CREATE TABLE products (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    creator_id  INT          NOT NULL COMMENT '关联创作者 user.id',
    product_id  VARCHAR(100) NOT NULL COMMENT '抖音商品ID',
    title       VARCHAR(200) NOT NULL DEFAULT '' COMMENT '商品名称',
    image       VARCHAR(500) NOT NULL DEFAULT '' COMMENT '商品主图',
    price       INT          NOT NULL DEFAULT 0 COMMENT '价格（分）',
    detail_url  VARCHAR(500) DEFAULT '' COMMENT '商品详情链接',
    status      ENUM('active','inactive') NOT NULL DEFAULT 'active',
    want_count  INT          NOT NULL DEFAULT 0 COMMENT '想要数（冗余计数）',
    sort_order  INT          NOT NULL DEFAULT 0 COMMENT '排序权重',
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_creator_product (creator_id, product_id),
    INDEX idx_creator_status (creator_id, status),
    INDEX idx_want_count (want_count DESC)
) ENGINE=InnoDB;

-- 投票表（想要）
CREATE TABLE wants (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    user_id     INT      NOT NULL COMMENT '投票用户',
    product_id  INT      NOT NULL COMMENT '投票产品',
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_user_product (user_id, product_id),
    INDEX idx_product (product_id),
    INDEX idx_user (user_id)
) ENGINE=InnoDB;

-- 创作者橱窗关联表
CREATE TABLE creator_showcases (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    creator_id    INT          NOT NULL COMMENT '关联创作者 user.id',
    showcase_id   VARCHAR(100) NOT NULL COMMENT '抖音橱窗ID',
    showcase_name VARCHAR(200) DEFAULT '' COMMENT '橱窗名称',
    synced_at     DATETIME     DEFAULT NULL COMMENT '最近同步时间',
    created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_creator_showcase (creator_id, showcase_id)
) ENGINE=InnoDB;
