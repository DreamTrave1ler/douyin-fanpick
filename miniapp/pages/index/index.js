const app = getApp();

// 预设初始数据，避免空状态渲染
const INITIAL_DATA = {
    products: [],
    keyword: '',
    page: 1,
    loading: false,
    noMore: false,
    currentCategory: 'all',
    showBackTop: false,
    showSkeleton: true
};

Page({
    data: { ...INITIAL_DATA },

    onLoad() {
        // 立即触发 LCP 埋点
        this.triggerLCP();

        // 使用缓存数据快速渲染
        const cachedProducts = app.getCachedProducts();
        if (cachedProducts) {
            this.setData({
                products: cachedProducts,
                showSkeleton: false
            });
        }

        // 加载最新数据
        this.loadProducts(true);
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

    onShow() {
        if (this._needRefresh) {
            this._needRefresh = false;
            this.refreshProducts();
        }
    },

    onPullDownRefresh() {
        app.clearCache();
        this.refreshProducts().then(() => tt.stopPullDownRefresh());
    },

    onReachBottom() {
        if (!this.data.loading && !this.data.noMore) {
            this.loadProducts();
        }
    },

    // 页面滚动优化 - 节流
    onPageScroll(e) {
        const showBackTop = e.scrollTop > 500;
        if (showBackTop !== this.data.showBackTop) {
            this.setData({ showBackTop });
        }
    },

    // 加载产品列表
    loadProducts(useCache = false) {
        if (this.data.loading || this.data.noMore) return;
        this.setData({ loading: true });

        app.request({
            url: '/products',
            data: {
                page: this.data.page,
                size: 10,
                category: this.data.currentCategory
            }
        }, useCache).then(data => {
            const list = (data.list || []).map(p => ({
                ...p,
                priceText: (p.price / 100).toFixed(2)
            }));

            // 批量 setData，减少渲染次数
            this.setData({
                products: this.data.products.concat(list),
                page: this.data.page + 1,
                noMore: list.length < 10,
                loading: false,
                showSkeleton: false
            });

            // 缓存产品数据
            app.setCachedProducts(this.data.products);
        }).catch(err => {
            this.setData({ loading: false, showSkeleton: false });
            tt.showToast({ title: String(err), icon: 'none' });
        });
    },

    // 刷新列表
    refreshProducts() {
        this.setData({ products: [], page: 1, noMore: false });
        return this.loadProducts();
    },

    // 切换分类
    switchCategory(e) {
        const category = e.currentTarget.dataset.category;
        if (category === this.data.currentCategory) return;
        this.setData({ currentCategory: category });
        this.refreshProducts();
    },

    // 跳转搜索
    goSearch() {
        tt.navigateTo({ url: '/pages/search/search' });
    },

    // 跳转排行榜
    goRank() {
        tt.switchTab({ url: '/pages/rank/rank' });
    },

    // 跳转创作者
    goCreator() {
        tt.switchTab({ url: '/pages/mine/mine' });
    },

    // 跳转抖音商城
    goShop() {
        tt.navigateTo({ url: '/pages/shop/shop' });
    },

    // 跳转详情
    goDetail(e) {
        const id = e.currentTarget.dataset.id;
        tt.navigateTo({ url: `/pages/detail/detail?id=${id}` });
    },

    // 回到顶部
    backToTop() {
        tt.pageScrollTo({ scrollTop: 0, duration: 300 });
    },

    // 切换"想要" - 防抖处理
    toggleWant(e) {
        const { id, index } = e.currentTarget.dataset;
        const product = this.data.products[index];
        const isWanted = product.is_wanted;

        // 先更新 UI
        const key = `products[${index}].is_wanted`;
        const countKey = `products[${index}].want_count`;
        this.setData({
            [key]: !isWanted,
            [countKey]: product.want_count + (isWanted ? -1 : 1)
        });

        // 震动反馈
        tt.vibrateShort({ type: 'medium' });

        // 防抖请求
        app.debounce(`want_${id}`, () => {
            app.request({
                url: '/wants',
                method: isWanted ? 'DELETE' : 'POST',
                data: { product_id: id }
            }).catch(err => {
                // 回滚 UI
                this.setData({
                    [key]: isWanted,
                    [countKey]: product.want_count
                });
                tt.showToast({ title: String(err), icon: 'none' });
            });
        }, 500);
    }
});
