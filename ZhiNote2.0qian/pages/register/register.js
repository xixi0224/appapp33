Page({
  data: {
    username: '',
    password: '',
    confirmPassword: '',
    email: '',
    phone: ''
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

  // 确认密码输入
  onConfirmPasswordInput(e) {
    this.setData({
      confirmPassword: e.detail.value
    });
  },

  // 邮箱输入
  onEmailInput(e) {
    this.setData({
      email: e.detail.value
    });
  },

  // 手机号输入
  onPhoneInput(e) {
    this.setData({
      phone: e.detail.value
    });
  },

  // 注册
  register() {
    const { username, password, confirmPassword } = this.data;
    
    if (!username) {
      wx.showToast({
        title: '请输入用户名',
        icon: 'none'
      });
      return;
    }
    
    if (!password) {
      wx.showToast({
        title: '请输入密码',
        icon: 'none'
      });
      return;
    }
    
    if (password.length < 6) {
      wx.showToast({
        title: '密码至少6位',
        icon: 'none'
      });
      return;
    }
    
    if (password !== confirmPassword) {
      wx.showToast({
        title: '两次密码输入不一致',
        icon: 'none'
      });
      return;
    }

    // 调用后端API进行注册
    wx.showLoading({
      title: '注册中...'
    });

    wx.request({
      url: 'http://localhost:8000/api/register',
      method: 'POST',
      data: { 
        username, 
        password,
        email: this.data.email || null,
        phone: this.data.phone || null
      },
      header: {
        'content-type': 'application/json'
      },
      success: (res) => {
        wx.hideLoading();
        if (res.data.success) {
          wx.showToast({ 
            title: '注册成功', 
            icon: 'success' 
          });
          // 注册成功后跳转到登录页
          setTimeout(() => {
            wx.navigateTo({ 
              url: '/pages/login/login' 
            });
          }, 1000);
        } else {
          wx.showToast({ 
            title: res.data.message || '注册失败', 
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
        console.error('注册失败:', err);
      }
    });
  },

  // 跳转到登录页
  goLogin() {
    wx.navigateTo({
      url: '/pages/login/login'
    });
  }
})