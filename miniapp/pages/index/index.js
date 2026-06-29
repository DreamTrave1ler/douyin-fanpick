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
        // 立即显示骨架屏，延迟加载数据
        this.setData({ showSkeleton: true });

        // 延迟 100ms 加载数据，让骨架屏先渲染
        setTimeout(() => {
            this.loadProducts();
        }, 100);
    },

    // 触摸事件 - 触发 LCP 上报
    onTouchStart() {
        if (!this._lcpTriggered) {
            this._lcpTriggered = true;
            // 触发重绘
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
            this.loadProducts();
        }
    },

    // 加载产品列表 - 减少首次加载数量
    loadProducts() {
        if (this.data.loading || this.data.noMore) return;
        this.setData({ loading: true });

        app.request({
            url: '/products',
            data: {
                page: this.data.page,
                size: 6, // 减少首次加载数量
                category: this.data.currentCategory
            }
        }, true).then(data => {
            const list = (data.list || []).map(p => ({
                ...p,
                priceText: (p.price / 100).toFixed(2)
            }));

            this.setData({
                products: this.data.products.concat(list),
                page: this.data.page + 1,
                noMore: list.length < 6,
                loading: false,
                showSkeleton: false
            });
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

    // 跳转详情
    goDetail(e) {
        const id = e.currentTarget.dataset.id;
        tt.navigateTo({ url: `/pages/detail/detail?id=${id}` });
    },

    // 切换"想要"
    toggleWant(e) {
        const { id, index } = e.currentTarget.dataset;
        const product = this.data.products[index];
        const isWanted = product.is_wanted;

        const key = `products[${index}].is_wanted`;
        const countKey = `products[${index}].want_count`;
        this.setData({
            [key]: !isWanted,
            [countKey]: product.want_count + (isWanted ? -1 : 1)
        });

        tt.vibrateShort({ type: 'medium' });

        app.debounce(`want_${id}`, () => {
            app.request({
                url: '/wants',
                method: isWanted ? 'DELETE' : 'POST',
                data: { product_id: id }
            }).catch(err => {
                this.setData({
                    [key]: isWanted,
                    [countKey]: product.want_count
                });
                tt.showToast({ title: String(err), icon: 'none' });
            });
        }, 500);
    }
});
