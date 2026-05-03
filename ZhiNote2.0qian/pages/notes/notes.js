const app = getApp()

Page({
  data: {
    doc_id: null,
    notes: [],
    allNotes: [],
    showSharePanel: false,
    showMagicModal: false,
    showRenameModal: false,
    renameValue: '',
    currentNoteId: null,
    isListMode: false,
    loading: false,
    pageData: {
      title: '结构化笔记',
      sharePath: '/pages/notes/notes'
    }
  },

  onLoad(options) {
    const doc_id = options.doc_id
    const isListMode = !doc_id
    
    this.setData({ 
      doc_id,
      isListMode,
      pageData: {
        title: isListMode ? '我的笔记' : '结构化笔记',
        sharePath: isListMode ? '/pages/notes/notes' : `/pages/notes/notes?doc_id=${doc_id}`,
        scene: doc_id ? `doc_id=${doc_id}` : ''
      }
    })
    
    if (isListMode) {
      this.loadAllNotes()
    } else {
      this.loadNotes()
    }
  },

  // 加载所有笔记（列表模式）
  loadAllNotes() {
    this.setData({ loading: true })
    wx.request({
      url: `${app.globalData.baseUrl}/api/notes-list`,
      method: 'GET',
      success: (res) => {
        this.setData({ loading: false })
        if (res.data.code === 0) {
          this.setData({ allNotes: res.data.data.notes })
        } else {
          console.error('获取笔记列表失败:', res.data.message)
        }
      },
      fail: (err) => {
        this.setData({ loading: false })
        console.error('网络错误:', err)
      }
    })
  },

  // 进入笔记详情（跳转到AI分析）
  goNoteDetail(e) {
    const id = e.currentTarget.dataset.id
    const title = e.currentTarget.dataset.title
    // 将参数存储到本地存储，供analysis页面读取
    wx.setStorageSync('analysisNoteId', id)
    wx.setStorageSync('analysisNoteTitle', title)
    wx.setStorageSync('analysisNoteSource', '笔记列表')
    // 跳转到AI分析页面
    wx.switchTab({
      url: '/pages/analysis/analysis'
    })
  },

  // 显示分享面板
  showSharePanel() {
    this.setData({ showSharePanel: true })
  },
  
  // 关闭分享面板
  closeSharePanel() {
    this.setData({ showSharePanel: false })
  },

  onShow() {
    if (this.data.doc_id) this.loadNotes(this.data.doc_id)
  },

  loadNotes(doc_id) {
    const id = doc_id || this.data.doc_id
    if (!id) return
    wx.request({
      url: `${app.globalData.baseUrl}/api/notes/${id}`,
      success: (res) => {
        this.setData({ notes: res.data.notes || [] })
      },
      fail: () => wx.showToast({ title: '加载失败', icon: 'none' })
    })
  },

  goChart() {
    wx.navigateTo({ url: `/pages/chart/chart?doc_id=${this.data.doc_id}` })
  },
  
  // 显示魔法选项弹窗
  showMagicOptions() {
    this.setData({ showMagicModal: true })
  },
  
  // 关闭魔法选项弹窗
  closeMagicModal() {
    this.setData({ showMagicModal: false })
  },
  
  // 生成完整笔记
  generateCompleteNote() {
    const { doc_id } = this.data
    
    // 关闭弹窗
    this.closeMagicModal()
    
    // 显示加载动画
    wx.showLoading({
      title: '生成中...',
      mask: true
    })
    
    // 调用后端API生成完整笔记
    wx.request({
      url: `${app.globalData.baseUrl}/api/generate-complete-note`,
      method: 'POST',
      data: {
        docId: doc_id
      },
      success: (res) => {
        wx.hideLoading()
        if (res.data.code === 0) {
          // 跳转到笔记编辑器页面
          wx.navigateTo({
            url: `/pages/text-input/text-input?mode=edit&noteId=${res.data.data.noteId}&title=${res.data.data.title}`
          })
        } else {
          wx.showToast({
            title: '生成失败，请重试',
            icon: 'none'
          })
        }
      },
      fail: () => {
        wx.hideLoading()
        wx.showToast({
          title: '网络异常，请重试',
          icon: 'none'
        })
      }
    })
  },

  // 显示重命名弹窗
  showRenameModal(e) {
    const noteId = e.currentTarget.dataset.noteId
    const noteTitle = e.currentTarget.dataset.noteTitle
    
    this.setData({
      showRenameModal: true,
      currentNoteId: noteId,
      renameValue: noteTitle
    })
  },

  // 关闭重命名弹窗
  closeRenameModal() {
    this.setData({
      showRenameModal: false,
      currentNoteId: null,
      renameValue: ''
    })
  },

  // 输入新名称
  onRenameInput(e) {
    this.setData({
      renameValue: e.detail.value
    })
  },

  // 确认重命名
  confirmRename() {
    const { currentNoteId, renameValue } = this.data
    
    // 验证输入
    if (!renameValue || !renameValue.trim()) {
      wx.showToast({
        title: '请输入笔记名称',
        icon: 'none'
      })
      return
    }
    
    const newTitle = renameValue.trim()
    
    wx.showLoading({
      title: '保存中...',
      mask: true
    })
    
    // 调用后端API更新笔记名称
    wx.request({
      url: `${app.globalData.baseUrl}/api/notes/${currentNoteId}/title`,
      method: 'PUT',
      data: {
        title: newTitle
      },
      success: (res) => {
        wx.hideLoading()
        if (res.data.code === 0) {
          wx.showToast({
            title: '修改成功',
            icon: 'success'
          })
          
          // 关闭弹窗
          this.closeRenameModal()
          
          // 重新加载笔记列表
          this.loadAllNotes()
        } else {
          wx.showToast({
            title: res.data.message || '修改失败',
            icon: 'none'
          })
        }
      },
      fail: () => {
        wx.hideLoading()
        wx.showToast({
          title: '网络错误',
          icon: 'none'
        })
      }
    })
  }
})