const app = getApp();

Page({
    data: {
        top3: [],
        rankList: [],
        loading: false,
        page: 1,
        noMore: false
    },

    onLoad() {
        // 触摸触发 LCP 埋点
        this.triggerLCP();
        this.loadRank();
    },

    // 触摸触发 LCP 埋点
    triggerLCP() {
        // 监听触摸事件触发 LCP 上报
        this._lcpTriggered = false;
    },

    // 触摸事件 - 触发 LCP 上报
    onTouchStart() {
        if (!this._lcpTriggered) {
            this._lcpTriggered = true;
            // 触发页面重绘以上报 LCP
            this.setData({ _lcp: Date.now() });
        }
    },

    onShow() {
        if (this._needRefresh) {
            this._needRefresh = false;
            this.refreshRank();
        }
    },

    onPullDownRefresh() {
        this.refreshRank().then(() => tt.stopPullDownRefresh());
    },

    onReachBottom() {
        if (!this.data.loading && !this.data.noMore) {
            this.loadRank();
        }
    },

    loadRank() {
        if (this.data.loading || this.data.noMore) return;
        this.setData({ loading: true });

        app.request({
            url: '/wants/rank',
            data: { page: this.data.page, size: 20 }
        }).then(list => {
            const items = list.map((item, i) => ({
                ...item,
                rank: (this.data.page - 1) * 20 + i + 1,
                priceText: (item.price / 100).toFixed(2)
            }));

            if (this.data.page === 1) {
                const top3 = items.slice(0, 3);
                const rankList = items.slice(3);
                this.setData({
                    top3,
                    rankList: this.data.rankList.concat(rankList),
                    page: 2,
                    noMore: items.length < 20,
                    loading: false
                });
            } else {
                this.setData({
                    rankList: this.data.rankList.concat(items),
                    page: this.data.page + 1,
                    noMore: items.length < 20,
                    loading: false
                });
            }
        }).catch(err => {
            this.setData({ loading: false });
            tt.showToast({ title: String(err), icon: 'none' });
        });
    },

    refreshRank() {
        this.setData({ top3: [], rankList: [], page: 1, noMore: false });
        return this.loadRank();
    },

    goDetail(e) {
        const id = e.currentTarget.dataset.id;
        tt.navigateTo({ url: `/pages/detail/detail?id=${id}` });
    },

    toggleWant(e) {
        const { id, index } = e.currentTarget.dataset;
        const product = this.data.rankList[index];
        if (!product) return;

        const isWanted = product.is_wanted;
        const key = `rankList[${index}].is_wanted`;
        const countKey = `rankList[${index}].want_count`;

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
                this.setData({ [key]: isWanted, [countKey]: product.want_count });
                tt.showToast({ title: String(err), icon: 'none' });
            });
        }, 500);
    }
});
