// 统一响应格式中间件
module.exports = (req, res, next) => {
    res.success = (data, message = 'ok') => {
        res.json({ code: 0, message, data });
    };

    res.error = (message = '服务器错误', code = 500) => {
        res.status(typeof code === 'number' ? code : 500).json({
            code: typeof code === 'number' ? code : 500,
            message,
            data: null
        });
    };

    next();
};
