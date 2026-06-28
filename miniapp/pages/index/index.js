const app = getApp();

Page({
    data: {
        products: [],
        keyword: '',
        page: 1,
        loading: false,
        noMore: false,
        currentCategory: 'all',
        showBackTop: false
    },

    onLoad() {
        this.loadProducts();
    },

    onShow() {
        if (this._needRefresh) {
            this._needRefresh = false;
            this.refreshProducts();
        }
    },

    onPullDownRefresh() {
        this.refreshProducts().then(() => tt.stopPullDownRefresh());
    },

    onReachBottom() {
        if (!this.data.loading && !this.data.noMore) {
            this.loadProducts();
        }
    },

    onPageScroll(e) {
        this.setData({
            showBackTop: e.scrollTop > 500
        });
    },

    // 加载产品列表
    loadProducts() {
        if (this.data.loading || this.data.noMore) return;
        this.setData({ loading: true });

        app.request({
            url: '/products',
            data: {
                page: this.data.page,
                size: 10,
                category: this.data.currentCategory
            }
        }).then(data => {
            const list = (data.list || []).map(p => ({
                ...p,
                priceText: (p.price / 100).toFixed(2)
            }));

            this.setData({
                products: this.data.products.concat(list),
                page: this.data.page + 1,
                noMore: list.length < 10,
                loading: false
            });
        }).catch(err => {
            this.setData({ loading: false });
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

    // 切换"想要"
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
    }
});
