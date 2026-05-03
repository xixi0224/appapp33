Page({
  data: {
    userInfo: {
      username: '',
      nickname: '',
      email: '',
      phone: '',
      avatar: ''
    }
  },

  onLoad() {
    // 获取用户信息
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo) {
      // 确保nickname字段存在
      if (!userInfo.nickname) {
        userInfo.nickname = userInfo.username;
      }
      this.setData({ userInfo });
    }
  },

  onShow() {
    // 每次显示时刷新用户信息
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo) {
      // 确保nickname字段存在
      if (!userInfo.nickname) {
        userInfo.nickname = userInfo.username;
      }
      this.setData({ userInfo });
    }
  },

  // 用户名输入
  onUsernameInput(e) {
    this.setData({
      'userInfo.username': e.detail.value
    });
  },

  // 昵称输入
  onNicknameInput(e) {
    this.setData({
      'userInfo.nickname': e.detail.value
    });
  },

  // 邮箱输入
  onEmailInput(e) {
    this.setData({
      'userInfo.email': e.detail.value
    });
  },

  // 手机号输入
  onPhoneInput(e) {
    this.setData({
      'userInfo.phone': e.detail.value
    });
  },

  // 选择头像
  chooseAvatar() {
    wx.showToast({
      title: '选择头像功能开发中',
      icon: 'none'
    });
  },

  // 保存个人资料
  saveProfile() {
    const userInfo = this.data.userInfo;
    
    if (!userInfo || !userInfo.id) {
      wx.showToast({
        title: '用户信息不完整',
        icon: 'none'
      });
      return;
    }

    // 验证邮箱格式
    if (userInfo.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userInfo.email)) {
      wx.showToast({
        title: '邮箱格式不正确',
        icon: 'none'
      });
      return;
    }

    // 验证手机号格式
    if (userInfo.phone && !/^1[3-9]\d{9}$/.test(userInfo.phone)) {
      wx.showToast({
        title: '手机号格式不正确',
        icon: 'none'
      });
      return;
    }
    
    wx.showLoading({
      title: '保存中...'
    });

    // 准备要保存的数据
    const saveData = {
      nickname: userInfo.nickname || userInfo.username || null,
      email: userInfo.email || null,
      phone: userInfo.phone || null
    };

    console.log('保存的数据:', saveData);

    // 调用后端API更新用户信息
    wx.request({
      url: `${getApp().globalData.baseUrl}/api/user/profile/${userInfo.id}`,
      method: 'PUT',
      data: saveData,
      header: {
        'content-type': 'application/json'
      },
      success: (res) => {
        wx.hideLoading();
        console.log('后端返回:', res.data);
        
        if (res.statusCode === 200) {
          // 更新本地存储 - 使用后端返回的最新数据
          const updatedUserInfo = {
            id: userInfo.id,
            username: userInfo.username,
            nickname: res.data.nickname || userInfo.nickname || userInfo.username,
            email: res.data.email || userInfo.email,
            phone: res.data.phone || userInfo.phone,
            avatar_url: res.data.avatar_url || userInfo.avatar,
            created_at: res.data.created_at || userInfo.created_at,
            last_login: res.data.last_login || userInfo.last_login
          };
          
          console.log('更新本地存储:', updatedUserInfo);
          wx.setStorageSync('userInfo', updatedUserInfo);
          
          wx.showToast({ 
            title: '保存成功', 
            icon: 'success' 
          });
          
          // 发送事件通知其他页面刷新
          getApp().globalData.userInfoUpdated = true;
          
          // 返回上一页
          setTimeout(() => {
            wx.navigateBack();
          }, 1000);
        } else {
          wx.showToast({ 
            title: res.data.detail || '保存失败', 
            icon: 'none' 
          });
        }
      },
      fail: (err) => {
        wx.hideLoading();
        wx.showToast({ 
          title: '网络错误，请检查后端是否运行', 
          icon: 'none' 
        });
        console.error('保存个人资料失败:', err);
      }
    });
  },

  // 退出登录
  logout() {
    wx.showModal({
      title: '退出登录',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          // 清除本地存储的用户信息
          wx.removeStorageSync('userInfo');
          wx.removeStorageSync('token');
          
          wx.showToast({
            title: '已退出登录',
            icon: 'success'
          });
          
          // 跳转到登录页
          setTimeout(() => {
            wx.navigateTo({
              url: '/pages/login/login'
            });
          }, 1000);
        }
      }
    });
  },

  // 返回上一页
  goBack() {
    wx.navigateBack();
  }
})