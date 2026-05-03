const app = getApp()
import { setDarkMode, checkDarkMode } from '../../utils/theme'

Page({
  data: {
    userInfo: null,
    studyStats: {
      totalDuration: 0,
      totalTasks: 0,
      totalReviews: 0
    }
  },

  onLoad() {
    // 检查深色模式状态并更新样式
    const darkMode = checkDarkMode()
    setDarkMode(darkMode)
    
    // 检查登录状态
    this.checkLoginStatus()
    
    // 加载学习统计数据
    this.loadStudyStats()
  },

  onShow() {
    // 每次显示页面时都检查登录状态（从登录页返回时更新）
    const app = getApp();
      
    // 检查是否有用户信息更新
    if (app.globalData.userInfoUpdated) {
      app.refreshUserInfo();
    }
      
    this.checkLoginStatus();
  },
  
  // 检查登录状态
  checkLoginStatus() {
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo) {
      // 确保nickname字段存在
      if (!userInfo.nickname) {
        userInfo.nickname = userInfo.username;
      }
      this.setData({ userInfo });
    }
    // 不再自动跳转到登录页，只在用户点击时跳转
  },
  
  // 加载学习统计数据
  loadStudyStats() {
    wx.request({
      url: `${app.globalData.baseUrl}/api/study-stats/summary`,
      method: 'GET',
      success: (res) => {
        if (res.data.code === 0) {
          this.setData({
            studyStats: {
              totalDuration: Math.round(res.data.data.totalDuration / 60), // 转换为小时
              totalTasks: res.data.data.totalNotes, // 使用真实笔记数量
              totalReviews: res.data.data.totalReviews
            }
          })
        }
      },
      fail: (err) => {
        console.error('加载学习统计失败:', err)
      }
    })
  },
  
  // 点击用户信息区域，跳转到个人资料页或登录页
  goUserProfile() {
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo) {
      wx.navigateTo({
        url: '/pages/profile/profile'
      });
    } else {
      wx.navigateTo({
        url: '/pages/login/login'
      });
    }
  },

  // 番茄钟
  goPomodoro() {
    wx.navigateTo({
      url: '/pages/pomodoro/pomodoro'
    })
  },

  // 单词卡片
  goWordCard() {
    wx.navigateTo({
      url: '/pages/word-card/word-card'
    })
  },

  // PDF 阅读器
  goPdfReader() {
    wx.navigateTo({
      url: '/pages/pdf-reader/pdf-reader'
    })
  },

  // 计算器
  goCalculator() {
    wx.navigateTo({
      url: '/pages/calculator/calculator'
    })
  },

  // 学习计划
  goLearningPlan() {
    wx.navigateTo({
      url: '/pages/learning-plan/learning-plan'
    })
  },

  // 导出 PDF 完整笔记
  exportPdf() {
    wx.showToast({
      title: '导出 PDF 功能开发中',
      icon: 'none'
    })
  },

  // 导出图谱截图
  exportGraph() {
    wx.showToast({
      title: '导出图谱截图功能开发中',
      icon: 'none'
    })
  },

  // 微信分享卡片
  shareWechat() {
    wx.showToast({
      title: '微信分享功能开发中',
      icon: 'none'
    })
  },

  // 生成小程序码
  generateQrCode() {
    wx.showToast({
      title: '生成小程序码功能开发中',
      icon: 'none'
    })
  },

  // 系统设置
  goSettings() {
    wx.navigateTo({
      url: '/pages/settings/settings'
    })
  },

  // 关于我们
  goAbout() {
    wx.navigateTo({
      url: '/pages/about/about'
    })
  },

  // 意见反馈
  goFeedback() {
    wx.navigateTo({
      url: '/pages/feedback/feedback'
    })
  },

  // 退出登录
  logout() {
    wx.showModal({
      title: '确认退出',
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
          
          // 更新页面状态
          this.setData({
            userInfo: null
          });
        }
      }
    });
  }
})