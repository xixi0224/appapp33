Page({
  data: {
    isDarkMode: false
  },

  onLoad() {
    // 检查当前是否为深色模式
    const darkMode = wx.getStorageSync('darkMode')
    this.setData({
      isDarkMode: darkMode
    })
    
    // 设置页面主题
    if (darkMode) {
      wx.setPageStyle({
        style: {
          backgroundColor: '#1a1a1a',
          color: '#ffffff'
        }
      })
    }
  }
})