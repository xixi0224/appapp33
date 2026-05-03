const app = getApp()

Page({
  data: {
    pdfList: [],
    currentPdf: null,
    showToolPanel: false
  },

  onLoad() {
    this.loadPdfList()
  },

  // 加载PDF列表
  loadPdfList() {
    const that = this
    // 从后端获取PDF列表
    wx.request({
      url: `${app.globalData.baseUrl}/api/pdf-list`,
      method: 'GET',
      success: function(res) {
        if (res.data.code === 0) {
          that.setData({
            pdfList: res.data.data
          })
        }
      },
      fail: function(res) {
        console.log('获取PDF列表失败', res)
      }
    })
  },

  // 打开PDF
  openPdf(e) {
    const pdfId = e.currentTarget.dataset.id
    const that = this
    
    // 从PDF列表中找到对应的PDF
    const pdf = that.data.pdfList.find(item => item.id === pdfId)
    if (pdf) {
      that.setData({
        currentPdf: pdf
      })
    }
  },

  // 关闭PDF
  closePdf() {
    this.setData({
      currentPdf: null,
      showToolPanel: false
    })
  },

  // 显示工具栏
  showTools() {
    this.setData({
      showToolPanel: !this.data.showToolPanel
    })
  },

  // 画线
  drawLine() {
    wx.showToast({
      title: '画线功能开发中',
      icon: 'none'
    })
  },

  // 高亮
  highlight() {
    wx.showToast({
      title: '高亮功能开发中',
      icon: 'none'
    })
  },

  // 添加备注
  addNote() {
    wx.showToast({
      title: '添加备注功能开发中',
      icon: 'none'
    })
  }
})