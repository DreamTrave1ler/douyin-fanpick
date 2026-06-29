const app = getApp();

Page({
    data: {
        keyword: '',
        searchResults: [],
        searching: false,
        sortBy: 'default',
        hotKeywords: ['零食', '护肤品', '手机壳', '口红', '零食大礼包', '面膜', '耳机', '衣服'],
        searchHistory: []
    },

    onLoad() {
        // 触发 LCP 埋点
        this.triggerLCP();
        this.loadHistory();
    },

    // 触发 LCP 埋点
    triggerLCP() {
        setTimeout(() => {
            tt.createSelectorQuery().select('.page-search').boundingClientRect().exec();
        }, 100);
    },

    // 加载搜索历史
    loadHistory() {
        const history = tt.getStorageSync('searchHistory') || [];
        this.setData({ searchHistory: history });
    },

    // 保存搜索历史
    saveHistory(keyword) {
        let history = tt.getStorageSync('searchHistory') || [];
        history = history.filter(h => h !== keyword);
        history.unshift(keyword);
        history = history.slice(0, 10);
        tt.setStorageSync('searchHistory', history);
        this.setData({ searchHistory: history });
    },

    // 输入事件 - 节流处理
    onInput(e) {
        this.setData({ keyword: e.detail.value });
    },

    // 清空关键词
    clearKeyword() {
        this.setData({ keyword: '', searchResults: [] });
    },

    // 清空历史
    clearHistory() {
        tt.removeStorageSync('searchHistory');
        this.setData({ searchHistory: [] });
    },

    // 热门搜索
    searchHot(e) {
        const keyword = e.currentTarget.dataset.keyword;
        this.setData({ keyword });
        this.doSearch();
    },

    // 历史搜索
    searchHistory(e) {
        const keyword = e.currentTarget.dataset.keyword;
        this.setData({ keyword });
        this.doSearch();
    },

    // 执行搜索 - 防抖处理
    doSearch() {
        const keyword = this.data.keyword.trim();
        if (!keyword) return;

        this.saveHistory(keyword);
        this.setData({ searching: true, searchResults: [] });

        // 使用防抖
        app.debounce('search', () => {
            app.request({
                url: '/products/search',
                data: { keyword }
            }).then(data => {
                const results = (data.list || []).map(p => ({
                    ...p,
                    priceText: (p.price / 100).toFixed(2),
                    salesText: this.formatSales(p.sales || 0),
                    is_douyin: !!p.detail_url
                }));

                this.setData({
                    searchResults: results,
                    searching: false
                });
            }).catch(err => {
                this.setData({ searching: false });
                tt.showToast({ title: '搜索失败', icon: 'none' });
            });
        }, 300);
    },

    // 格式化销量
    formatSales(num) {
        if (num >= 10000) {
            return (num / 10000).toFixed(1) + '万';
        }
        return num.toString();
    },

    // 切换排序
    changeSort(e) {
        const sort = e.currentTarget.dataset.sort;
        this.setData({ sortBy: sort });
        // 重新排序结果
        this.sortResults();
    },

    // 排序结果
    sortResults() {
        let results = [...this.data.searchResults];
        const sort = this.data.sortBy;

        if (sort === 'sales') {
            results.sort((a, b) => (b.sales || 0) - (a.sales || 0));
        } else if (sort === 'price') {
            results.sort((a, b) => a.price - b.price);
        }

        this.setData({ searchResults: results });
    },

    // 跳转详情
    goDetail(e) {
        const id = e.currentTarget.dataset.id;
        tt.navigateTo({ url: `/pages/detail/detail?id=${id}` });
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
