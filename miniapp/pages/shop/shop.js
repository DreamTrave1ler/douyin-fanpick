const app = getApp();

Page({
    data: {
        categories: [
            { id: 'all', name: '全部', icon: '🔥' },
            { id: 'food', name: '美食', icon: '🍜' },
            { id: 'beauty', name: '美妆', icon: '💄' },
            { id: 'digital', name: '数码', icon: '📱' },
            { id: 'clothing', name: '服饰', icon: '👗' },
            { id: 'home', name: '家居', icon: '🏠' },
            { id: 'sports', name: '运动', icon: '⚽' }
        ],
        currentCategory: 'all',
        shopProducts: [],
        loading: false,
        page: 1,
        noMore: false
    },

    onLoad() {
        // 触发 LCP 埋点
        this.triggerLCP();
        this.loadShopProducts();
    },

    // 触发 LCP 埋点
    triggerLCP() {
        this._lcpTriggered = false;
    },

    // 触摸事件 - 触发 LCP 上报
    onTouchStart() {
        if (!this._lcpTriggered) {
            this._lcpTriggered = true;
            this.setData({ _lcp: Date.now() });
        }
    },

    onPullDownRefresh() {
        this.refreshProducts().then(() => tt.stopPullDownRefresh());
    },

    onReachBottom() {
        if (!this.data.loading && !this.data.noMore) {
            this.loadShopProducts();
        }
    },

    // 加载商城商品
    loadShopProducts() {
        if (this.data.loading || this.data.noMore) return;
        this.setData({ loading: true });

        app.request({
            url: '/products/shop',
            data: {
                category: this.data.currentCategory,
                page: this.data.page,
                size: 10
            }
        }).then(data => {
            const list = (data.list || []).map(p => ({
                ...p,
                priceText: (p.price / 100).toFixed(2),
                originalPrice: p.original_price ? (p.original_price / 100).toFixed(2) : '',
                salesText: this.formatSales(p.sales || 0)
            }));

            this.setData({
                shopProducts: this.data.shopProducts.concat(list),
                page: this.data.page + 1,
                noMore: list.length < 10,
                loading: false
            });
        }).catch(err => {
            this.setData({ loading: false });
            tt.showToast({ title: '加载失败', icon: 'none' });
        });
    },

    // 刷新商品
    refreshProducts() {
        this.setData({ shopProducts: [], page: 1, noMore: false });
        return this.loadShopProducts();
    },

    // 切换分类
    switchCategory(e) {
        const category = e.currentTarget.dataset.category;
        if (category === this.data.currentCategory) return;
        this.setData({ currentCategory: category });
        this.refreshProducts();
    },

    // 格式化销量
    formatSales(num) {
        if (num >= 10000) {
            return (num / 10000).toFixed(1) + '万';
        }
        return num.toString();
    },

    // 跳转详情
    goDetail(e) {
        const id = e.currentTarget.dataset.id;
        tt.navigateTo({ url: `/pages/detail/detail?id=${id}` });
    },

    // 跳转抖音商城
    goDouyinShop(e) {
        const url = e.currentTarget.dataset.url;
        if (url) {
            tt.navigateTo({ url: `/pages/webview/webview?url=${encodeURIComponent(url)}` });
        } else {
            tt.showToast({ title: '暂无链接', icon: 'none' });
        }
    },

    // 添加到选品
    addToVote(e) {
        const { id, item } = e.currentTarget.dataset;

        tt.showModal({
            title: '添加到选品',
            content: `确定将"${item.title}"添加到选品列表吗？`,
            success: (res) => {
                if (res.confirm) {
                    app.request({
                        url: '/products',
                        method: 'POST',
                        data: {
                            product_id: item.product_id || id,
                            title: item.title,
                            image: item.image,
                            price: item.price,
                            detail_url: item.detail_url || ''
                        }
                    }).then(() => {
                        tt.showToast({ title: '添加成功', icon: 'success' });
                    }).catch(err => {
                        tt.showToast({ title: String(err), icon: 'none' });
                    });
                }
            }
        });
    }
});
