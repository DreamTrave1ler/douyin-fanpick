/**
 * API 请求封装
 * 统一管理所有接口地址
 */

const BASE_URL = 'https://your-server.com/api'; // 替换为实际服务端地址

const API = {
    // 认证
    LOGIN: '/auth/login',
    USER_INFO: '/auth/user',
    BECOME_CREATOR: '/auth/become-creator',

    // 产品
    PRODUCTS: '/products',
    PRODUCT_DETAIL: '/products/',

    // 投票
    WANTS: '/wants',
    WANTS_RANK: '/wants/rank',
    WANTS_MINE: '/wants/mine',

    // 创作者
    CREATOR_DASHBOARD: '/creator/dashboard',
    CREATOR_TREND: '/creator/trend',
    CREATOR_PRODUCTS: '/creator/products',
    CREATOR_VOTES: '/creator/votes/'
};

module.exports = { BASE_URL, API };
