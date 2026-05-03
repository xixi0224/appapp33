Page({
  data: {
    feedbackTypes: [
      { id: 'bug', name: '功能异常' },
      { id: 'suggestion', name: '功能建议' },
      { id: 'experience', name: '体验问题' },
      { id: 'other', name: '其他' }
    ],
    selectedType: '',
    content: '',
    contact: '',
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
  },

  // 选择反馈类型
  selectType(e) {
    const typeId = e.currentTarget.dataset.id
    this.setData({
      selectedType: typeId
    })
  },

  // 输入反馈内容
  inputContent(e) {
    this.setData({
      content: e.detail.value
    })
  },

  // 输入联系方式
  inputContact(e) {
    this.setData({
      contact: e.detail.value
    })
  },

  // 提交反馈
  submitFeedback() {
    const { selectedType, content } = this.data
    
    if (!selectedType) {
      wx.showToast({
        title: '请选择反馈类型',
        icon: 'none'
      })
      return
    }
    
    if (!content) {
      wx.showToast({
        title: '请输入反馈内容',
        icon: 'none'
      })
      return
    }
    
    // 调用后端API提交反馈
    wx.request({
      url: `${getApp().globalData.baseUrl}/api/feedback`,
      method: 'POST',
      data: {
        type: selectedType,
        content: content,
        contact: this.data.contact
      },
      success: function(res) {
        if (res.data.code === 0) {
          wx.showToast({
            title: '反馈提交成功，感谢您的参与！',
            icon: 'success',
            duration: 2000
          })
          // 清空表单
          this.setData({
            selectedType: '',
            content: '',
            contact: ''
          })
        } else {
          wx.showToast({
            title: '反馈提交失败，请重试',
            icon: 'none'
          })
        }
      }.bind(this),
      fail: function() {
        wx.showToast({
          title: '网络异常，请重试',
          icon: 'none'
        })
      }
    })
  }
})