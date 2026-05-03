const app = getApp()

Page({
  data: {
    title: '',
    content: '',
    wordCount: 0,
    showAiTip: false,
    mode: '',
    noteId: ''
  },

  onLoad(options) {
    const { mode, noteId, title } = options
    
    this.setData({
      mode,
      noteId
    })
    
    if (mode === 'edit' && noteId) {
      // 编辑模式，加载笔记内容
      wx.showLoading({ title: '加载中...' })
      wx.request({
        url: `${app.globalData.baseUrl}/api/notes/${noteId}`,
        success: (res) => {
          wx.hideLoading()
          if (res.data.code === 0) {
            this.setData({
              title: res.data.data.title || title || '',
              content: res.data.data.content || '',
              wordCount: (res.data.data.content || '').length
            })
          } else {
            wx.showToast({ title: '加载失败', icon: 'none' })
          }
        },
        fail: () => {
          wx.hideLoading()
          wx.showToast({ title: '网络错误', icon: 'none' })
        }
      })
    }
  },

  // 返回
  goBack() {
    wx.navigateBack()
  },


  // 标题输入
  onTitleInput(e) {
    this.setData({
      title: e.detail.value
    })
  },

  // 内容输入
  onContentInput(e) {
    const content = e.detail.value
    const wordCount = content.length
    
    this.setData({
      content: content,
      wordCount: wordCount
    })
    
    // 检测长文本，显示AI提示
    if (wordCount > 500 && !this.data.showAiTip) {
      this.setData({
        showAiTip: true
      })
    }
  },

  // 插入标题
  insertHeading() {
    this.setData({
      content: this.data.content + '\n# 标题\n'
    })
    this.updateWordCount()
  },

  // 插入列表
  insertList() {
    this.setData({
      content: this.data.content + '\n- 列表项\n'
    })
    this.updateWordCount()
  },

  // 插入加粗
  insertBold() {
    this.setData({
      content: this.data.content + '**加粗文本**'
    })
    this.updateWordCount()
  },

  // 取消AI提示
  cancelAiTip() {
    this.setData({
      showAiTip: false
    })
  },

  // 确认AI智能分段
  confirmAiTip() {
    const that = this
    wx.showLoading({ title: 'AI智能分段中...' })
    
    // 调用后端API进行智能分段
    wx.request({
      url: `${app.globalData.baseUrl}/api/segment-text`,
      method: 'POST',
      data: {
        text: that.data.content
      },
      success: function(res) {
        wx.hideLoading()
        if (res.data.code === 0) {
          that.setData({
            content: res.data.data,
            showAiTip: false
          })
          that.updateWordCount()
        } else {
          wx.showToast({
            title: '分段失败',
            icon: 'none'
          })
        }
      },
      fail: function() {
        wx.hideLoading()
        wx.showToast({
          title: '网络错误',
          icon: 'none'
        })
      }
    })
  },

  // 更新字数统计
  updateWordCount() {
    this.setData({
      wordCount: this.data.content.length
    })
  },

  // 保存笔记
  saveNote() {
    const that = this
    if (!this.data.content) {
      wx.showToast({
        title: '请输入笔记内容',
        icon: 'none'
      })
      return
    }
    
    // 生成笔记标题
    let noteTitle = this.data.title
    if (!noteTitle) {
      // 使用默认标题加上当前日期，避免使用内容的前20个字符导致乱码
      const now = new Date()
      const dateStr = now.getFullYear() + '-' + (now.getMonth() + 1) + '-' + now.getDate()
      noteTitle = '文本笔记 ' + dateStr
    }
    
    wx.showLoading({ title: '保存中...' })
    
    // 根据模式选择保存或更新
    const { mode, noteId } = this.data
    const url = mode === 'edit' && noteId 
      ? `${app.globalData.baseUrl}/api/notes/${noteId}` 
      : `${app.globalData.baseUrl}/api/save-note`
    const method = mode === 'edit' && noteId ? 'PUT' : 'POST'
    
    // 调用后端API保存笔记
    wx.request({
      url: url,
      method: method,
      data: {
        title: noteTitle,
        content: that.data.content
      },
      success: function(res) {
        wx.hideLoading()
        console.log('保存笔记返回结果:', res)
        if (res.data.code === 0) {
          const noteId = res.data.data.noteId
          console.log('保存成功，noteId:', noteId)
          
          // 保存参数到本地存储
          wx.setStorageSync('analysisNoteId', noteId)
          wx.setStorageSync('analysisNoteTitle', noteTitle)
          wx.setStorageSync('analysisNoteSource', 'text-input')
          
          // 显示保存成功提示
          wx.showToast({
            title: '保存成功，正在跳转到分析页面',
            icon: 'success'
          })
          
          // 跳转到分析页面（使用switchTab，因为analysis是tabbar页面）
          setTimeout(() => {
            console.log('准备跳转到分析页面')
            wx.switchTab({
              url: '/pages/analysis/analysis',
              success: function() {
                console.log('跳转成功')
              },
              fail: function(e) {
                console.log('跳转失败:', e)
                wx.showToast({
                  title: '跳转失败，请手动进入分析页面',
                  icon: 'none'
                })
              }
            })
          }, 1500)
        } else {
          console.log('保存失败:', res.data)
          wx.showToast({
            title: '保存失败',
            icon: 'none'
          })
        }
      },
      fail: function(e) {
        console.log('网络错误:', e)
        wx.hideLoading()
        wx.showToast({
          title: '网络错误',
          icon: 'none'
        })
      }
    })
  }
})