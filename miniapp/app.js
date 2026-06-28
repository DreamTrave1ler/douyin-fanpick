App({
    globalData: {
        token: '',
        userInfo: null,
        baseUrl: 'https://your-server.com/api'  // 替换为你的服务端地址
    },

    onLaunch() {
        // 从本地缓存读取登录态
        const token = tt.getStorageSync('token');
        const userInfo = tt.getStorageSync('userInfo');
        if (token) {
            this.globalData.token = token;
            this.globalData.userInfo = userInfo;
        }
    },

    // 登录方法
    login() {
        return new Promise((resolve, reject) => {
            tt.login({
                success: (res) => {
                    const code = res.code;
                    tt.request({
                        url: `${this.globalData.baseUrl}/auth/login`,
                        method: 'POST',
                        data: { code },
                        success: (resp) => {
                            if (resp.data.code === 0) {
                                const { token, user } = resp.data.data;
                                this.globalData.token = token;
                                this.globalData.userInfo = user;
                                tt.setStorageSync('token', token);
                                tt.setStorageSync('userInfo', user);
                                resolve(user);
                            } else {
                                reject(resp.data.message);
                            }
                        },
                        fail: reject
                    });
                },
                fail: reject
            });
        });
    },

    // 统一请求方法
    request(options) {
        return new Promise((resolve, reject) => {
            tt.request({
                url: `${this.globalData.baseUrl}${options.url}`,
                method: options.method || 'GET',
                data: options.data,
                header: {
                    'Content-Type': 'application/json',
                    'Authorization': this.globalData.token ? `Bearer ${this.globalData.token}` : ''
                },
                success: (res) => {
                    if (res.data.code === 0) {
                        resolve(res.data.data);
                    } else if (res.data.code === 401) {
                        // 登录过期，重新登录
                        this.globalData.token = '';
                        tt.removeStorageSync('token');
                        reject('登录已过期');
                    } else {
                        reject(res.data.message);
                    }
                },
                fail: reject
            });
        });
    }
});
