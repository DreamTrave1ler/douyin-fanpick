App({
    globalData: {
        token: '',
        userInfo: null,
        baseUrl: 'https://douyin-fanpick-production.up.railway.app/api',
        // 请求缓存
        cache: {},
        // 产品缓存
        productCache: null,
        // 防抖定时器
        debounceTimers: {}
    },

    onLaunch() {
        // 从本地缓存读取登录态
        const token = tt.getStorageSync('token');
        const userInfo = tt.getStorageSync('userInfo');
        if (token) {
            this.globalData.token = token;
            this.globalData.userInfo = userInfo;
        }

        // 从本地存储恢复产品缓存
        this.restoreProductCache();
    },

    // 恢复产品缓存
    restoreProductCache() {
        try {
            const cached = tt.getStorageSync('productCache');
            if (cached && Date.now() - cached.time < 300000) { // 5分钟有效
                this.globalData.productCache = cached.data;
            }
        } catch (e) {}
    },

    // 获取缓存的产品
    getCachedProducts() {
        return this.globalData.productCache;
    },

    // 设置产品缓存
    setCachedProducts(products) {
        this.globalData.productCache = products;
        try {
            tt.setStorageSync('productCache', {
                data: products,
                time: Date.now()
            });
        } catch (e) {}
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

    // 统一请求方法（带缓存 + 连接复用）
    request(options, useCache = false) {
        const cacheKey = `${options.url}_${JSON.stringify(options.data || {})}`;

        // 检查缓存
        if (useCache && this.globalData.cache[cacheKey]) {
            const cached = this.globalData.cache[cacheKey];
            if (Date.now() - cached.time < 30000) { // 30秒缓存
                return Promise.resolve(cached.data);
            }
        }

        return new Promise((resolve, reject) => {
            const startTime = Date.now();

            tt.request({
                url: `${this.globalData.baseUrl}${options.url}`,
                method: options.method || 'GET',
                data: options.data,
                header: {
                    'Content-Type': 'application/json',
                    'Authorization': this.globalData.token ? `Bearer ${this.globalData.token}` : ''
                },
                success: (res) => {
                    const duration = Date.now() - startTime;

                    // 性能监控
                    if (duration > 500) {
                        console.warn(`请求耗时过长: ${options.url} ${duration}ms`);
                    }

                    if (res.data.code === 0) {
                        // 存入缓存
                        if (useCache) {
                            this.globalData.cache[cacheKey] = {
                                data: res.data.data,
                                time: Date.now()
                            };
                        }
                        resolve(res.data.data);
                    } else if (res.data.code === 401) {
                        this.globalData.token = '';
                        tt.removeStorageSync('token');
                        reject('登录已过期');
                    } else {
                        reject(res.data.message);
                    }
                },
                fail: (err) => {
                    console.error(`请求失败: ${options.url}`, err);
                    reject(err);
                }
            });
        });
    },

    // 批量请求（并行执行，提高连接复用率）
    batchRequest(requests) {
        return Promise.all(requests.map(req => this.request(req)));
    },

    // 清除缓存
    clearCache(key) {
        if (key) {
            delete this.globalData.cache[key];
        } else {
            this.globalData.cache = {};
        }
    },

    // 防抖
    debounce(key, fn, delay = 300) {
        if (this.globalData.debounceTimers[key]) {
            clearTimeout(this.globalData.debounceTimers[key]);
        }
        this.globalData.debounceTimers[key] = setTimeout(() => {
            fn();
            delete this.globalData.debounceTimers[key];
        }, delay);
    },

    // 节流
    throttle(key, fn, delay = 300) {
        if (this.globalData.debounceTimers[key]) return;

        fn();
        this.globalData.debounceTimers[key] = setTimeout(() => {
            delete this.globalData.debounceTimers[key];
        }, delay);
    }
});
