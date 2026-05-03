Page({
  data: {
    username: '',
    password: ''
  },

  onLoad() {
    // 检查是否已登录
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo) {
      wx.switchTab({
        url: '/pages/index/index'
      });
    }
  },

  // 用户名输入
  onUsernameInput(e) {
    this.setData({
      username: e.detail.value
    });
  },

  // 密码输入
  onPasswordInput(e) {
    this.setData({
      password: e.detail.value
    });
  },

  // 登录
  login() {
    const { username, password } = this.data;
    
    if (!username || !password) {
      wx.showToast({
        title: '请输入用户名和密码',
        icon: 'none'
      });
      return;
    }

    // 调用后端API进行登录
    wx.showLoading({
      title: '登录中...'
    });

    wx.request({
      url: `${getApp().globalData.baseUrl}/api/login`,
      method: 'POST',
      data: { username, password },
      header: {
        'content-type': 'application/json'
      },
      success: (res) => {
        wx.hideLoading();
        if (res.data.success) {
          const userInfo = res.data.user;
          const token = res.data.token;
          
          // 保存用户信息和token
          wx.setStorageSync('userInfo', userInfo);
          wx.setStorageSync('token', token);
          
          wx.showToast({ 
            title: '登录成功', 
            icon: 'success' 
          });
          
          // 跳转到首页
          setTimeout(() => {
            wx.switchTab({ 
              url: '/pages/index/index' 
            });
          }, 1000);
        } else {
          wx.showToast({ 
            title: res.data.message || '登录失败', 
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
        console.error('登录失败:', err);
      }
    });
  },

  // 注册新账号
  goRegister() {
    wx.navigateTo({
      url: '/pages/register/register'
    });
  },

  // 忘记密码
  forgotPassword() {
    wx.navigateTo({
      url: '/pages/forgot-password/forgot-password'
    });
  },

  // 微信登录
  loginWithWechat() {
    // 调用微信登录API
    wx.login({
      success: (res) => {
        if (res.code) {
          // 调用后端API进行微信登录
          wx.showLoading({
            title: '微信登录中...'
          });

          // 这里应该调用真实的后端API
          // 例如：
          // wx.request({
          //   url: 'https://api.example.com/wechat/login',
          //   method: 'POST',
          //   data: { code: res.code },
          //   success: (res) => {
          //     wx.hideLoading();
          //     if (res.data.code === 200) {
          //       const userInfo = res.data.data;
          //       wx.setStorageSync('userInfo', userInfo);
          //       wx.showToast({ title: '登录成功', icon: 'success' });
          //       wx.switchTab({ url: '/pages/index/index' });
          //     } else {
          //       wx.showToast({ title: res.data.message || '登录失败', icon: 'none' });
          //     }
          //   },
          //   fail: (err) => {
          //     wx.hideLoading();
          //     wx.showToast({ title: '网络错误，请重试', icon: 'none' });
          //   }
          // });
          
          // 暂时显示提示
          wx.hideLoading();
          wx.showToast({
            title: '微信登录功能开发中',
            icon: 'none'
          });
        } else {
          wx.showToast({
            title: '微信登录失败',
            icon: 'none'
          });
        }
      },
      fail: (err) => {
        wx.showToast({
          title: '微信登录失败',
          icon: 'none'
        });
      }
    });
  },

  // 手机号登录
  loginWithPhone() {
    // 调用微信手机号登录API
    wx.showModal({
      title: '手机号登录',
      content: '请输入您的手机号',
      editable: true,
      placeholderText: '请输入手机号',
      success: (res) => {
        if (res.confirm && res.content) {
          const phone = res.content;
          
          // 验证手机号格式
          if (!/^1[3-9]\d{9}$/.test(phone)) {
            wx.showToast({
              title: '请输入正确的手机号',
              icon: 'none'
            });
            return;
          }
          
          // 发送验证码
          this.sendVerificationCode(phone);
        }
      }
    });
  },

  // 发送验证码
  sendVerificationCode(phone) {
    wx.showLoading({
      title: '发送验证码...'
    });

    // 这里应该调用真实的后端API发送验证码
    // 例如：
    // wx.request({
    //   url: 'https://api.example.com/send/code',
    //   method: 'POST',
    //   data: { phone },
    //   success: (res) => {
    //     wx.hideLoading();
    //     if (res.data.code === 200) {
    //       wx.showModal({
    //         title: '输入验证码',
    //         content: `验证码已发送至 ${phone}`,
    //         editable: true,
    //         placeholderText: '请输入验证码',
    //         success: (res) => {
    //           if (res.confirm && res.content) {
    //             const code = res.content;
    //             this.verifyCode(phone, code);
    //           }
    //         }
    //       });
    //     } else {
    //       wx.showToast({ title: res.data.message || '发送验证码失败', icon: 'none' });
    //     }
    //   },
    //   fail: (err) => {
    //     wx.hideLoading();
    //     wx.showToast({ title: '网络错误，请重试', icon: 'none' });
    //   }
    // });
    
    // 暂时显示提示
    wx.hideLoading();
    wx.showToast({
      title: '发送验证码功能开发中',
      icon: 'none'
    });
  },

  // 验证验证码
  verifyCode(phone, code) {
    wx.showLoading({
      title: '登录中...'
    });

    // 这里应该调用真实的后端API验证验证码
    // 例如：
    // wx.request({
    //   url: 'https://api.example.com/phone/login',
    //   method: 'POST',
    //   data: { phone, code },
    //   success: (res) => {
    //     wx.hideLoading();
    //     if (res.data.code === 200) {
    //       const userInfo = res.data.data;
    //       wx.setStorageSync('userInfo', userInfo);
    //       wx.showToast({ title: '登录成功', icon: 'success' });
    //       wx.switchTab({ url: '/pages/index/index' });
    //     } else {
    //       wx.showToast({ title: res.data.message || '登录失败', icon: 'none' });
    //     }
    //   },
    //   fail: (err) => {
    //     wx.hideLoading();
    //     wx.showToast({ title: '网络错误，请重试', icon: 'none' });
    //   }
    // });
    
    // 暂时显示提示
    wx.hideLoading();
    wx.showToast({
      title: '手机号登录功能开发中',
      icon: 'none'
    });
  }
})