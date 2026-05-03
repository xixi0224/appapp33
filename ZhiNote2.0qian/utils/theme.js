// 主题工具函数

// 设置深色模式
export function setDarkMode(darkMode) {
  if (darkMode) {
    // 设置导航栏样式
    wx.setNavigationBarColor({
      frontColor: '#ffffff',
      backgroundColor: '#1a1a1a',
      animation: {
        duration: 200,
        timingFunc: 'ease-in-out'
      }
    })
    
    // 设置TabBar样式
    wx.setTabBarStyle({
      color: '#999999',
      selectedColor: '#1677ff',
      backgroundColor: '#1a1a1a',
      borderStyle: 'white'
    })
  } else {
    // 设置导航栏样式
    wx.setNavigationBarColor({
      frontColor: '#000000',
      backgroundColor: '#ffffff',
      animation: {
        duration: 200,
        timingFunc: 'ease-in-out'
      }
    })
    
    // 设置TabBar样式
    wx.setTabBarStyle({
      color: '#666666',
      selectedColor: '#1677ff',
      backgroundColor: '#ffffff',
      borderStyle: 'black'
    })
  }
}

// 检查当前是否为深色模式
export function checkDarkMode() {
  return wx.getStorageSync('darkMode') || false
}