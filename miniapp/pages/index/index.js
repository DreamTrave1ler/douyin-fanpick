const app = getApp();

Page({
    data: {
        products: [],
        keyword: '',
        page: 1,
        loading: false,
        noMore: false
    },

    onLoad() {
        this.loadProducts();
    },

    onShow() {
        // 从详情页返回时可能有投票变化，刷新数据
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

    // 加载产品列表
    loadProducts() {
        if (this.data.loading || this.data.noMore) return;
        this.setData({ loading: true });

        app.request({
            url: '/products',
            data: { page: this.data.page, size: 10 }
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

    // 搜索
    onSearchInput(e) {
        this.setData({ keyword: e.detail.value });
        // 可以加防抖搜索
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

        // 先更新 UI
        const key = `products[${index}].is_wanted`;
        const countKey = `products[${index}].want_count`;
        this.setData({
            [key]: !isWanted,
            [countKey]: product.want_count + (isWanted ? -1 : 1)
        });

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
