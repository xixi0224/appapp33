const app = getApp()

Page({
  data: {
    selectedFile: null,
    showCategorySelect: false,
    showLoading: false,
    categories: [
      { id: '408', name: '计算机408', icon: '💻' },
      { id: 'math', name: '高等数学', icon: '📐' },
      { id: 'english', name: '大学英语', icon: '📚' },
      { id: 'other', name: '其他', icon: '📝' }
    ],
    selectedCategory: null,
    currentPage: 1,
    totalPages: 10
  },

  onLoad() {
  },

  // 选择文件
  chooseFile() {
    const that = this
    wx.chooseMessageFile({
      count: 1,
      type: 'file',
      extension: ['.pdf', '.docx', '.doc'],
      success: function(res) {
        const file = res.tempFiles[0]
        // 检查文件类型
        const fileExt = file.name.split('.').pop().toLowerCase()
        if (fileExt !== 'pdf' && fileExt !== 'docx' && fileExt !== 'doc') {
          wx.showToast({
            title: '请选择PDF、DOCX或DOC文件',
            icon: 'none'
          })
          return
        }
        
        that.setData({
          selectedFile: file
        })
      },
      fail: function(res) {
        console.log('选择文件失败', res)
      }
    })
  },

  // 重新选择文件
  resetFile() {
    this.setData({
      selectedFile: null
    })
  },

  // 下一步，进入分类选择
  nextStep() {
    this.setData({
      showCategorySelect: true
    })
  },

  // 选择课程分类
  selectCategory(e) {
    const categoryId = e.currentTarget.dataset.id
    this.setData({
      selectedCategory: categoryId
    })
  },

  // 开始导入
  startImport() {
    if (!this.data.selectedCategory) {
      wx.showToast({
        title: '请选择课程分类',
        icon: 'none'
      })
      return
    }
    
    const that = this
    that.setData({
      showLoading: true,
      showCategorySelect: false,
      currentPage: 1
    })
    
    // 上传文件到后端
    wx.uploadFile({
      url: `${getApp().globalData.baseUrl}/api/upload`,
      filePath: that.data.selectedFile.path,
      name: 'file',
      formData: {
        course_id: 1
      },
      success: function(res) {
        console.log('上传成功', res)
        const data = JSON.parse(res.data)
        if (data.doc_id) {
          // 解析完成，跳转到AI分析页面
          console.log('开始跳转')
          console.log('文件名称:', that.data.selectedFile.name)
          console.log('分类:', that.data.selectedCategory)
          console.log('文件ID:', data.doc_id)
          
          // 保存参数到本地存储
          wx.setStorageSync('analysisFile', that.data.selectedFile.name)
          wx.setStorageSync('analysisCategory', that.data.selectedCategory)
          wx.setStorageSync('analysisSource', 'file-import')
          wx.setStorageSync('analysisFileId', data.doc_id)
          
          setTimeout(() => {
            console.log('执行跳转')
            wx.switchTab({
              url: '/pages/analysis/analysis',
              success: function(res) {
                console.log('跳转成功', res)
              },
              fail: function(res) {
                console.log('跳转失败', res)
              }
            })
          }, 1000)
        } else {
          wx.showToast({
            title: '上传失败，请重试',
            icon: 'none'
          })
          that.setData({
            showLoading: false
          })
        }
      },
      fail: function(res) {
        console.log('上传失败', res)
        wx.showToast({
          title: '上传失败，请重试',
          icon: 'none'
        })
        that.setData({
          showLoading: false
        })
      }
    })
  },

  // 格式化文件大小
  formatFileSize(size) {
    if (size < 1024) {
      return size + ' B'
    } else if (size < 1024 * 1024) {
      return (size / 1024).toFixed(2) + ' KB'
    } else {
      return (size / (1024 * 1024)).toFixed(2) + ' MB'
    }
  },

  // 预览文档
  previewDocument() {
    if (!this.data.selectedFile) {
      wx.showToast({
        title: '请先选择文件',
        icon: 'none'
      })
      return
    }
    
    wx.showLoading({ title: '加载中...' })
    
    // 使用微信小程序的openDocument API预览文件
    wx.openDocument({
      filePath: this.data.selectedFile.path,
      showMenu: true,
      success: function(res) {
        wx.hideLoading()
        console.log('预览文档成功', res)
      },
      fail: function(res) {
        wx.hideLoading()
        console.log('预览文档失败', res)
        wx.showToast({
          title: '预览失败，请稍后重试',
          icon: 'none'
        })
      }
    })
  }
})