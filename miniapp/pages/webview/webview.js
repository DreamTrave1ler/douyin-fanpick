Page({
    data: {
        url: ''
    },

    onLoad(options) {
        if (options.url) {
            this.setData({
                url: decodeURIComponent(options.url)
            });
        }
    },

    onMessage(e) {
        console.log('WebView message:', e.detail.data);
    }
});
