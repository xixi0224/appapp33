App({
  globalData: {
    baseUrl: 'http://119.29.219.148:8080',
    userInfoUpdated: false
  },
  
  // 全局方法：刷新用户信息
  refreshUserInfo() {
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo) {
      this.globalData.userInfo = userInfo;
      this.globalData.userInfoUpdated = false;
    }
  }
})