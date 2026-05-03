Page({
  data: {
    step: 1,
    email: '',
    token: '',
    newPassword: '',
    confirmPassword: '',
    resetToken: ''
  },

  // 邮箱输入
  onEmailInput(e) {
    this.setData({
      email: e.detail.value
    });
  },

  // 令牌输入
  onTokenInput(e) {
    this.setData({
      token: e.detail.value
    });
  },

  // 新密码输入
  onNewPasswordInput(e) {
    this.setData({
      newPassword: e.detail.value
    });
  },

  // 确认密码输入
  onConfirmPasswordInput(e) {
    this.setData({
      confirmPassword: e.detail.value
    });
  },

  // 请求密码重置
  requestReset() {
    const { email } = this.data;
    
    if (!email) {
      wx.showToast({
        title: '请输入邮箱',
        icon: 'none'
      });
      return;
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      wx.showToast({
        title: '请输入正确的邮箱格式',
        icon: 'none'
      });
      return;
    }

    wx.showLoading({
      title: '发送中...'
    });

    wx.request({
      url: 'http://localhost:8000/api/password-reset-request',
      method: 'POST',
      data: { email },
      header: {
        'content-type': 'application/json'
      },
      success: (res) => {
        wx.hideLoading();
        if (res.data.success) {
          wx.showToast({
            title: '重置令牌已生成',
            icon: 'success'
          });
          
          // 进入第二步
          this.setData({
            step: 2,
            resetToken: res.data.token || ''
          });
          
          wx.showModal({
            title: '提示',
            content: '在实际应用中，重置令牌会发送到您的邮箱。开发环境下，令牌已显示在页面上方。',
            showCancel: false
          });
        } else {
          wx.showToast({
            title: res.data.message || '请求失败',
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
        console.error('密码重置请求失败:', err);
      }
    });
  },

  // 确认重置密码
  confirmReset() {
    const { token, newPassword, confirmPassword } = this.data;
    
    if (!token) {
      wx.showToast({
        title: '请输入重置令牌',
        icon: 'none'
      });
      return;
    }
    
    if (!newPassword) {
      wx.showToast({
        title: '请输入新密码',
        icon: 'none'
      });
      return;
    }
    
    if (newPassword.length < 6) {
      wx.showToast({
        title: '密码至少6位',
        icon: 'none'
      });
      return;
    }
    
    if (newPassword !== confirmPassword) {
      wx.showToast({
        title: '两次密码输入不一致',
        icon: 'none'
      });
      return;
    }

    wx.showLoading({
      title: '重置中...'
    });

    wx.request({
      url: 'http://localhost:8000/api/password-reset-confirm',
      method: 'POST',
      data: { 
        token, 
        new_password: newPassword 
      },
      header: {
        'content-type': 'application/json'
      },
      success: (res) => {
        wx.hideLoading();
        if (res.data.success) {
          wx.showToast({
            title: '密码重置成功',
            icon: 'success'
          });
          
          // 重置成功后跳转到登录页
          setTimeout(() => {
            wx.navigateTo({
              url: '/pages/login/login'
            });
          }, 1000);
        } else {
          wx.showToast({
            title: res.data.message || '重置失败',
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
        console.error('密码重置失败:', err);
      }
    });
  },

  // 返回登录页
  goLogin() {
    wx.navigateTo({
      url: '/pages/login/login'
    });
  }
});
