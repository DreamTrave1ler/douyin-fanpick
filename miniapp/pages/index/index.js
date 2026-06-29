const app = getApp();

Page({
    data: {
        products: [],
        page: 1,
        loading: false,
        noMore: false,
        currentCategory: 'all',
        showSkeleton: true
    },

    onLoad() {
        // 不在 onLoad 发请求，等 onReady 后再加载
    },

    onReady() {
        // 首屏渲染完成后再加载数据
        this.loadProducts();
    },

    // 触摸事件 - 触发 LCP 上报
    onTouchStart() {
        if (!this._lcpTriggered) {
            this._lcpTriggered = true;
            this.setData({ _touch: true });
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
            this.loadMore();
        }
    },

    // 加载产品列表
    loadProducts() {
        if (this.data.loading) return;
        this.setData({ loading: true });

        app.request({
            url: '/products',
            data: {
                page: 1,
                size: 6,
                category: this.data.currentCategory
            }
        }).then(data => {
            const list = (data.list || []).map(p => ({
                ...p,
                priceText: (p.price / 100).toFixed(2)
            }));

            this.setData({
                products: list,
                page: 2,
                noMore: list.length < 6,
                loading: false,
                showSkeleton: false
            });
        }).catch(err => {
            this.setData({ loading: false, showSkeleton: false });
            tt.showToast({ title: '加载失败', icon: 'none' });
        });
    },

    // 加载更多
    loadMore() {
        if (this.data.loading || this.data.noMore) return;
        this.setData({ loading: true });

        app.request({
            url: '/products',
            data: {
                page: this.data.page,
                size: 6,
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
                noMore: list.length < 6,
                loading: false
            });
        }).catch(err => {
            this.setData({ loading: false });
        });
    },

    // 刷新列表
    refreshProducts() {
        this.setData({ products: [], page: 1, noMore: false, showSkeleton: true });
        return this.loadProducts();
    },

    // 切换分类
    switchCategory(e) {
        const category = e.currentTarget.dataset.category;
        if (category === this.data.currentCategory) return;
        this.setData({ currentCategory: category, products: [], page: 1, noMore: false, showSkeleton: true });
        this.loadProducts();
    },

    // 跳转搜索
    goSearch() {
        tt.navigateTo({ url: '/pages/search/search' });
    },

    // 跳转排行榜
    goRank() {
        tt.switchTab({ url: '/pages/rank/rank' });
    },

    // 跳转详情
    goDetail(e) {
        const id = e.currentTarget.dataset.id;
        tt.navigateTo({ url: `/pages/detail/detail?id=${id}` });
    },

    // 切换"想要"
    toggleWant(e) {
        const { id, index } = e.currentTarget.dataset;
        const product = this.data.products[index];
        if (!product) return;

        const isWanted = product.is_wanted;
        const key = `products[${index}].is_wanted`;
        const countKey = `products[${index}].want_count`;

        this.setData({
            [key]: !isWanted,
            [countKey]: product.want_count + (isWanted ? -1 : 1)
        });

        tt.vibrateShort({ type: 'medium' });

        app.request({
            url: '/wants',
            method: isWanted ? 'DELETE' : 'POST',
            data: { product_id: id }
        }).catch(err => {
            this.setData({ [key]: isWanted, [countKey]: product.want_count });
        });
    }
});
