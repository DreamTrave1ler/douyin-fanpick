const app = getApp();

Page({
    data: {
        userInfo: null,
        myWants: [],
        stats: {
            wantCount: 0,
            productCount: 0,
            fansCount: 0
        }
    },

    onLoad() {
        // 触发 LCP 埋点
        this.triggerLCP();

        // 使用缓存数据快速渲染
        this.setData({ userInfo: app.globalData.userInfo });
    },

    // 触发 LCP 埋点
    triggerLCP() {
        setTimeout(() => {
            tt.createSelectorQuery().select('.page-mine').boundingClientRect().exec();
        }, 100);
    },

    onShow() {
        if (app.globalData.token) {
            // 并行请求，提高连接复用率
            app.batchRequest([
                { url: '/auth/user' },
                { url: '/wants/mine', data: { size: 10 } },
                { url: '/user/stats' }
            ]).then(([user, wants, stats]) => {
                // 批量更新
                app.globalData.userInfo = user;
                tt.setStorageSync('userInfo', user);

                const formattedWants = (wants || []).map(w => ({
                    ...w,
                    priceText: (w.price / 100).toFixed(2)
                }));

                this.setData({
                    userInfo: user,
                    myWants: formattedWants,
                    stats: stats || { wantCount: 0, productCount: 0, fansCount: 0 }
                });
            }).catch(() => {});
        }
    },

    // 登录
    doLogin() {
        tt.showLoading({ title: '登录中...' });
        app.login()
            .then(user => {
                tt.hideLoading();
                this.setData({ userInfo: user });
                this.loadMyWants();
                this.loadStats();
                tt.showToast({ title: '登录成功', icon: 'success' });
            })
            .catch(err => {
                tt.hideLoading();
                tt.showToast({ title: '登录失败', icon: 'none' });
            });
    },

    // 成为创作者
    becomeCreator() {
        tt.showModal({
            title: '开通创作者',
            content: '开通后可以管理产品、查看粉丝投票数据',
            success: (res) => {
                if (res.confirm) {
                    app.request({
                        url: '/auth/become-creator',
                        method: 'POST',
                        data: {}
                    }).then(() => {
                        this.loadUserInfo();
                        tt.showToast({ title: '开通成功', icon: 'success' });
                    }).catch(err => {
                        tt.showToast({ title: String(err), icon: 'none' });
                    });
                }
            }
        });
    },

    // 跳转创作者面板
    goCreatorDashboard() {
        tt.navigateTo({ url: '/pages/creator/dashboard/dashboard' });
    },

    goCreatorProducts() {
        tt.navigateTo({ url: '/pages/creator/products/products' });
    },

    goCreatorStats() {
        tt.navigateTo({ url: '/pages/creator/stats/stats' });
    },

    // 跳转商城
    goShop() {
        tt.navigateTo({ url: '/pages/shop/shop' });
    },

    // 跳转搜索
    goSearch() {
        tt.navigateTo({ url: '/pages/search/search' });
    },

    // 跳转排行榜
    goRank() {
        tt.switchTab({ url: '/pages/rank/rank' });
    },

    // 跳转我的投票
    goMyWants() {
        // 可以跳转到专门的页面
    },

    // 跳转详情
    goDetail(e) {
        const id = e.currentTarget.dataset.id;
        tt.navigateTo({ url: `/pages/detail/detail?id=${id}` });
    },

    // 设置
    goSettings() {
        tt.showToast({ title: '开发中', icon: 'none' });
    },

    // 联系客服
    contactService() {
        tt.showToast({ title: '开发中', icon: 'none' });
    },

    // 分享
    shareApp() {
        // 触发分享
    },

    onShareAppMessage() {
        return {
            title: 'FanPick - 帮你选出粉丝最爱的好物',
            path: '/pages/index/index'
        };
    },

    showAbout() {
        tt.showModal({
            title: '关于 FanPick',
            content: 'FanPick 是一款帮助创作者了解粉丝购物偏好的工具。粉丝可以浏览产品并标记"想要"，创作者查看投票数据精准选品。',
            showCancel: false
        });
    }
});
