const app = getApp();

Page({
    data: {
        userInfo: null,
        myWants: []
    },

    onLoad() {
        this.setData({ userInfo: app.globalData.userInfo });
    },

    onShow() {
        if (app.globalData.token) {
            this.loadUserInfo();
            this.loadMyWants();
        }
    },

    // 加载用户信息
    loadUserInfo() {
        app.request({ url: '/auth/user' })
            .then(user => {
                app.globalData.userInfo = user;
                tt.setStorageSync('userInfo', user);
                this.setData({ userInfo: user });
            })
            .catch(() => {});
    },

    // 加载我的投票
    loadMyWants() {
        app.request({ url: '/wants/mine', data: { size: 10 } })
            .then(list => {
                this.setData({ myWants: list });
            })
            .catch(() => {});
    },

    // 登录
    doLogin() {
        tt.showLoading({ title: '登录中...' });
        app.login()
            .then(user => {
                tt.hideLoading();
                this.setData({ userInfo: user });
                this.loadMyWants();
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

    // 跳转详情
    goDetail(e) {
        const id = e.currentTarget.dataset.id;
        tt.navigateTo({ url: `/pages/detail/detail?id=${id}` });
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
