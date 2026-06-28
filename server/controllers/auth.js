const axios = require('axios');
const db = require('../utils/db');

// 抖音小程序登录 code2session
exports.login = async (req, res) => {
    try {
        const { code, nickname, avatar } = req.body;
        if (!code) return res.error('缺少登录凭证', 400);

        // 调用抖音 code2session 接口
        const ttRes = await axios.get('https://developer.toutiao.com/api/apps/v2/jscode2session', {
            params: {
                appid: process.env.TT_APP_ID,
                secret: process.env.TT_APP_SECRET,
                code
            }
        });

        const { openid, session_key } = ttRes.data;
        if (!openid) return res.error('登录失败：无法获取openid', 401);

        // 查找或创建用户
        let user = await db.queryOne('SELECT * FROM users WHERE openid = ?', [openid]);
        if (!user) {
            const result = await db.execute(
                'INSERT INTO users (openid, nickname, avatar) VALUES (?, ?, ?)',
                [openid, nickname || '', avatar || '']
            );
            user = { id: result.insertId, openid, nickname, avatar, role: 'fan' };
        }

        // 生成简单 token（生产环境建议用 JWT）
        const token = Buffer.from(`${user.id}:${openid}:${Date.now()}`).toString('base64');

        // 存储 session
        global.sessions = global.sessions || {};
        global.sessions[token] = { userId: user.id, openid, session_key };

        res.success({ token, user: { id: user.id, nickname: user.nickname, avatar: user.avatar, role: user.role } });
    } catch (err) {
        console.error('登录失败:', err.message);
        res.error('登录失败', 500);
    }
};

// 获取当前用户信息
exports.getUserInfo = async (req, res) => {
    try {
        const user = await db.queryOne('SELECT id, nickname, avatar, role, douyin_uid FROM users WHERE id = ?', [req.userId]);
        if (!user) return res.error('用户不存在', 404);
        res.success(user);
    } catch (err) {
        res.error('获取用户信息失败', 500);
    }
};

// 切换为创作者角色
exports.becomeCreator = async (req, res) => {
    try {
        const { douyin_uid } = req.body;
        await db.execute('UPDATE users SET role = ?, douyin_uid = ? WHERE id = ?',
            ['creator', douyin_uid || '', req.userId]);
        res.success(null, '已切换为创作者');
    } catch (err) {
        res.error('切换失败', 500);
    }
};
