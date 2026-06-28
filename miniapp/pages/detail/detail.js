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

    onShareAppMessage() {
        return {
            title: `快来看看这个商品：${this.data.product.title}`,
            path: `/pages/detail/detail?id=${this.data.product.id}`,
            imageUrl: this.data.product.image
        };
    },

    // 加载产品详情
    loadProduct(id) {
        this.setData({ loading: true });

        app.request({
            url: `/products/${id}`
        }).then(data => {
            this.setData({
                product: data,
                priceText: (data.price / 100).toFixed(2),
                loading: false
            });
        }).catch(err => {
            this.setData({ loading: false });
            tt.showToast({ title: '加载失败', icon: 'none' });
            setTimeout(() => tt.navigateBack(), 1500);
        });
    },

    // 预览图片
    previewImage() {
        tt.previewImage({
            urls: [this.data.product.image],
            current: this.data.product.image
        });
    },

    // 切换想要
    toggleWant() {
        const product = this.data.product;
        const isWanted = product.is_wanted;

        this.setData({
            'product.is_wanted': !isWanted,
            'product.want_count': product.want_count + (isWanted ? -1 : 1)
        });

        tt.vibrateShort({ type: 'medium' });

        app.request({
            url: '/wants',
            method: isWanted ? 'DELETE' : 'POST',
            data: { product_id: product.id }
        }).catch(err => {
            this.setData({
                'product.is_wanted': isWanted,
                'product.want_count': product.want_count
            });
            tt.showToast({ title: String(err), icon: 'none' });
        });
    },

    // 跳转抖音商城
    goDouyinShop() {
        const url = this.data.product.detail_url;
        if (url) {
            tt.navigateTo({ url: `/pages/webview/webview?url=${encodeURIComponent(url)}` });
        }
    },

    // 跳转商城
    goShop() {
        tt.navigateTo({ url: '/pages/shop/shop' });
    }
});
