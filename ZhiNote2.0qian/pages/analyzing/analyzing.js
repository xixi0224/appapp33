const app = getApp()

Page({
  data: {
    doc_id: null
  },

  onLoad(options) {
    const doc_id = options.doc_id
    this.setData({ doc_id })
    this.analyze(doc_id)
  },

  analyze(doc_id) {
    wx.showLoading({ title: '分析中' })
    wx.request({
      url: `${app.globalData.baseUrl}/api/analyze/${doc_id}`,
      method: 'POST',
      success: () => {
        wx.hideLoading()
        wx.redirectTo({ url: `/pages/notes/notes?doc_id=${doc_id}` })
      },
      fail: () => {
        wx.hideLoading()
        wx.showToast({ title: '分析失败', icon: 'none' })
      }
    })
  }
})