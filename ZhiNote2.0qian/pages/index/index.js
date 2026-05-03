const app = getApp()
import { setDarkMode, checkDarkMode } from '../../utils/theme'

Page({
  data: {
    lastUpload: null,
    recentNotes: [],
    loading: false,
    isLoggedIn: false,
    userInfo: null
  },

  onLoad() {
    // 检查深色模式状态并更新样式
    const darkMode = checkDarkMode()
    setDarkMode(darkMode)
    // 检查登录状态
    this.checkLoginStatus()
    // 加载最近学习记录
    this.loadRecentNotes()
  },

  onShow() {
    // 每次显示页面时都检查登录状态
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
    const token = wx.getStorageSync('token');
    if (userInfo && token) {
      // 确保nickname字段存在
      if (!userInfo.nickname) {
        userInfo.nickname = userInfo.username;
      }
      this.setData({ 
        isLoggedIn: true,
        userInfo: userInfo
      });
    } else {
      this.setData({ 
        isLoggedIn: false,
        userInfo: null
      });
    }
  },

  // 加载最近学习记录
  loadRecentNotes() {
    this.setData({ loading: true })
    wx.request({
      url: `${app.globalData.baseUrl}/api/recent-notes`,
      method: 'GET',
      success: (res) => {
        this.setData({ loading: false })
        if (res.data.code === 0) {
          this.setData({ recentNotes: res.data.data.recent_notes })
        } else {
          console.error('获取最近学习记录失败:', res.data.message)
        }
      },
      fail: (err) => {
        this.setData({ loading: false })
        console.error('网络错误:', err)
      }
    })
  },

  // 点击最近学习记录项
  onRecentNoteTap(e) {
    const noteId = e.currentTarget.dataset.noteId
    const title = e.currentTarget.dataset.title
    // 将参数存储到本地存储，供analysis页面读取
    wx.setStorageSync('analysisNoteId', noteId)
    wx.setStorageSync('analysisNoteTitle', title)
    wx.setStorageSync('analysisNoteSource', '最近学习')
    // 跳转到AI分析页面
    wx.switchTab({
      url: '/pages/analysis/analysis'
    })
  },

  // 快速入口点击事件
  goVoiceInput() {
    wx.navigateTo({
      url: '/pages/voice-record/voice-record'
    })
  },

  goAudioUpload() {
    wx.navigateTo({
      url: '/pages/audio-upload/audio-upload'
    })
  },

  goTextInput() {
    wx.navigateTo({
      url: '/pages/text-input/text-input'
    })
  },

  goFileImport() {
    wx.navigateTo({
      url: '/pages/file-import/file-import'
    })
  },

  chooseFile() {
    wx.chooseMessageFile({
      count: 1,
      type: 'file',
      success: (res) => {
        const file = res.tempFiles[0]
        wx.showLoading({ title: '上传中' })
        wx.uploadFile({
          url: `${app.globalData.baseUrl}/api/upload`,
          filePath: file.path,
          name: 'file',
          formData: { course_id: 1 },
          success: (r) => {
            wx.hideLoading()
            const data = JSON.parse(r.data)
            this.setData({ lastUpload: data })
            wx.navigateTo({ url: `/pages/analyzing/analyzing?doc_id=${data.doc_id}` })
          },
          fail: () => {
            wx.hideLoading()
            wx.showToast({ title: '上传失败', icon: 'none' })
          }
        })
      }
    })
  },

  goNotes() {
    const doc_id = this.data.lastUpload?.doc_id || 1
    wx.navigateTo({ url: `/pages/notes/notes?doc_id=${doc_id}` })
  }
})