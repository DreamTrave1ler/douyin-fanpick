const app = getApp();

Page({
    data: {
        product: null,
        priceText: '0.00',
        loading: true
    },

    onLoad(options) {
        if (options.id) {
            this.loadProduct(options.id);
        }
    },

    loadProduct(id) {
        this.setData({ loading: true });
        app.request({ url: `/products/${id}` })
            .then(product => {
                this.setData({
                    product,
                    priceText: (product.price / 100).toFixed(2),
                    loading: false
                });
            })
            .catch(err => {
                this.setData({ loading: false });
                tt.showToast({ title: String(err), icon: 'none' });
                setTimeout(() => tt.navigateBack(), 1500);
            });
    },

    // 切换"想要"
    toggleWant() {
        const product = this.data.product;
        if (!product) return;

        const isWanted = product.is_wanted;
        // 先更新 UI
        this.setData({
            'product.is_wanted': !isWanted,
            'product.want_count': product.want_count + (isWanted ? -1 : 1)
        });

        app.request({
            url: '/wants',
            method: isWanted ? 'DELETE' : 'POST',
            data: { product_id: product.id }
        }).catch(err => {
            // 回滚
            this.setData({
                'product.is_wanted': isWanted,
                'product.want_count': product.want_count
            });
            tt.showToast({ title: String(err), icon: 'none' });
        });
    },

    // 跳转抖音商城
    goShop() {
        const url = this.data.product?.detail_url;
        if (url) {
            tt.navigateTo({ url });
        } else {
            tt.showToast({ title: '暂无商城链接', icon: 'none' });
        }
    },

    // 分享
    onShareAppMessage() {
        const product = this.data.product;
        return {
            title: `帮我选！${product?.title || '好物推荐'}`,
            path: `/pages/detail/detail?id=${product?.id}`,
            imageUrl: product?.image
        };
    }
});
