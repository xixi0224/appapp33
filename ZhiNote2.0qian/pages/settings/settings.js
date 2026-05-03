const app = getApp()
import { setDarkMode } from '../../utils/theme'

Page({
  data: {
    darkMode: false,
    reviewReminder: false,
    interval1: false,
    interval3: false,
    interval7: false,
    interval15: false,
    planReminder: false,
    notificationEnabled: false
  },

  onLoad() {
    this.loadSettings()
    
    // 检查深色模式状态
    const darkMode = wx.getStorageSync('darkMode')
    if (darkMode) {
      wx.setPageStyle({
        style: {
          backgroundColor: '#1a1a1a',
          color: '#ffffff'
        }
      })
    }
    
    // 更新导航栏和TabBar样式
    setDarkMode(darkMode)
  },

  // 加载设置
  loadSettings() {
    const that = this
    // 从本地存储加载设置
    wx.getStorage({
      key: 'userSettings',
      success: function(res) {
        const settings = res.data
        that.setData({
          darkMode: settings.darkMode || false,
          reviewReminder: settings.reviewReminder || false,
          interval1: settings.interval1 || false,
          interval3: settings.interval3 || false,
          interval7: settings.interval7 || false,
          interval15: settings.interval15 || false,
          planReminder: settings.planReminder || false,
          notificationEnabled: settings.notificationEnabled || false
        })
      }
    })
  },

  // 保存设置
  saveSettings() {
    const settings = {
      darkMode: this.data.darkMode,
      reviewReminder: this.data.reviewReminder,
      interval1: this.data.interval1,
      interval3: this.data.interval3,
      interval7: this.data.interval7,
      interval15: this.data.interval15,
      planReminder: this.data.planReminder,
      notificationEnabled: this.data.notificationEnabled
    }
    
    // 保存到本地存储
    wx.setStorage({
      key: 'userSettings',
      data: settings
    })
    
    // 调用后端API保存设置
    wx.request({
      url: `${app.globalData.baseUrl}/api/save-settings`,
      method: 'POST',
      data: settings,
      success: function(res) {
        console.log('设置保存成功', res)
      },
      fail: function(res) {
        console.log('设置保存失败', res)
      }
    })
  },

  // 深色模式开关
  onDarkModeChange(e) {
    const darkMode = e.detail.value
    this.setData({
      darkMode: darkMode
    })
    
    // 保存到本地存储
    wx.setStorageSync('darkMode', darkMode)
    
    // 更新页面样式
    if (darkMode) {
      wx.setPageStyle({
        style: {
          backgroundColor: '#1a1a1a',
          color: '#ffffff'
        }
      })
    } else {
      wx.setPageStyle({
        style: {
          backgroundColor: '#f5f5f5',
          color: '#333333'
        }
      })
    }
    
    // 更新导航栏和TabBar样式
    setDarkMode(darkMode)
    
    this.saveSettings()
  },

  // 复习提醒开关
  onReviewReminderChange(e) {
    const that = this
    that.setData({
      reviewReminder: e.detail.value
    })
    
    // 如果关闭复习提醒，关闭所有间隔重复设置
    if (!e.detail.value) {
      that.setData({
        interval1: false,
        interval3: false,
        interval7: false,
        interval15: false
      })
    }
    
    that.saveSettings()
    
    // 如果开启复习提醒，请求通知权限
    if (e.detail.value) {
      wx.requestSubscribeMessage({
        tmplIds: ['复习提醒模板ID'],
        success: function(res) {
          console.log('订阅成功', res)
        },
        fail: function(res) {
          console.log('订阅失败', res)
        }
      })
    }
  },

  // 第1天提醒开关
  onInterval1Change(e) {
    this.setData({
      interval1: e.detail.value
    })
    this.saveSettings()
  },

  // 第3天提醒开关
  onInterval3Change(e) {
    this.setData({
      interval3: e.detail.value
    })
    this.saveSettings()
  },

  // 第7天提醒开关
  onInterval7Change(e) {
    this.setData({
      interval7: e.detail.value
    })
    this.saveSettings()
  },

  // 第15天提醒开关
  onInterval15Change(e) {
    this.setData({
      interval15: e.detail.value
    })
    this.saveSettings()
  },

  // 学习计划提醒开关
  onPlanReminderChange(e) {
    this.setData({
      planReminder: e.detail.value
    })
    this.saveSettings()
  },

  // 通知开关
  onNotificationChange(e) {
    this.setData({
      notificationEnabled: e.detail.value
    })
    this.saveSettings()
    
    // 如果开启通知，请求通知权限
    if (e.detail.value) {
      wx.requestSubscribeMessage({
        tmplIds: ['通知模板ID'],
        success: function(res) {
          console.log('订阅成功', res)
        },
        fail: function(res) {
          console.log('订阅失败', res)
        }
      })
    }
  },

  // 清除缓存
  goCache() {
    wx.showModal({
      title: '清除缓存',
      content: '确定要清除缓存吗？',
      success: function(res) {
        if (res.confirm) {
          wx.clearStorage({
            success: function() {
              wx.showToast({
                title: '缓存已清除',
                icon: 'success'
              })
            }
          })
        }
      }
    })
  },

  // 版本信息
  goVersion() {
    wx.showToast({
      title: '当前版本：v1.0.0',
      icon: 'none'
    })
  }
})