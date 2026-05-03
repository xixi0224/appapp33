const app = getApp()

Page({
  data: {
    fileInfo: null,
    isUploading: false,
    uploadProgress: 0
  },

  onLoad() {
    const darkMode = wx.getStorageSync('darkMode') || false
    wx.setNavigationBarColor({
      frontColor: darkMode ? '#ffffff' : '#000000',
      backgroundColor: darkMode ? '#1f1f1f' : '#ffffff'
    })
  },

  chooseAudio() {
    wx.chooseMessageFile({
      count: 1,
      type: 'file',
      extension: ['mp3', 'wav', 'm4a'],
      success: (res) => {
        const file = res.tempFiles[0]
        this.setData({
          fileInfo: {
            name: file.name,
            size: this.formatFileSize(file.size),
            path: file.path
          }
        })
        this.getAudioDuration(file.path)
      },
      fail: (err) => {
        console.log('选择文件失败:', err)
        wx.showToast({
          title: '选择文件失败',
          icon: 'none'
        })
      }
    })
  },

  getAudioDuration(filePath) {
    console.log('获取音频时长，文件路径:', filePath)
    const audioContext = wx.createInnerAudioContext()
    audioContext.src = filePath
    
    // 尝试播放音频，测试是否能正常加载
    audioContext.onPlay(() => {
      console.log('音频开始播放')
    })
    
    // 修复：使用正确的事件名称 onLoadedMetadata
    audioContext.onLoadedMetadata(() => {
      const duration = audioContext.duration
      console.log('音频加载成功，时长:', duration)
      this.setData({
        'fileInfo.duration': this.formatTime(duration)
      })
      audioContext.destroy()
    })
    
    audioContext.onError((res) => {
      console.log('音频加载错误:', res)
      this.setData({
        'fileInfo.duration': '未知'
      })
      audioContext.destroy()
    })
    
    // 尝试加载音频
    audioContext.load()
  },

  rechooseFile() {
    this.setData({
      fileInfo: null
    })
  },

  startUpload() {
    if (!this.data.fileInfo) return

    this.setData({
      isUploading: true,
      uploadProgress: 0
    })

    const that = this
    const filePath = this.data.fileInfo.path
    const fileName = this.data.fileInfo.name
    const fileSize = this.data.fileInfo.size
    const duration = this.data.fileInfo.duration

    console.log('开始上传，文件路径:', filePath)
    console.log('文件信息:', { fileName, fileSize, duration })

    // 真实上传音频文件到后端
    wx.uploadFile({
      url: `${app.globalData.baseUrl}/api/upload-audio`,
      filePath: filePath,
      name: 'audio',
      formData: {
        filename: fileName
      },
      success: (res) => {
        console.log('上传成功:', res)
        if (res.statusCode === 200) {
          try {
            const data = JSON.parse(res.data)
            console.log('解析后的响应数据:', data)
            if (data.code === 0) {
              that.setData({
                uploadProgress: 100
              })
              wx.showToast({
                title: '上传成功',
                icon: 'success'
              })
              console.log('准备跳转到语音转文字页面')
              setTimeout(() => {
                wx.redirectTo({
                  url: `/pages/voice-transcribe/voice-transcribe?filePath=${encodeURIComponent(data.data.filePath)}&audioId=${data.data.audioId}`
                })
              }, 1000)
            } else {
              wx.showToast({
                title: data.detail || '上传失败',
                icon: 'none'
              })
              that.setData({
                isUploading: false
              })
            }
          } catch (e) {
            console.error('处理上传结果时出错:', e)
            wx.showToast({
              title: '处理上传结果时出错',
              icon: 'none'
            })
            that.setData({
              isUploading: false
            })
          }
        } else {
          wx.showToast({
            title: '上传失败',
            icon: 'none'
          })
          that.setData({
            isUploading: false
          })
        }
      },
      fail: (err) => {
        console.log('上传失败:', err)
        wx.showToast({
          title: '上传失败，请检查网络',
          icon: 'none'
        })
        that.setData({
          isUploading: false
        })
      }
    })
  },

  formatFileSize(size) {
    if (size < 1024) {
      return size + ' B'
    } else if (size < 1024 * 1024) {
      return (size / 1024).toFixed(2) + ' KB'
    } else {
      return (size / (1024 * 1024)).toFixed(2) + ' MB'
    }
  },

  formatTime(seconds) {
    if (isNaN(seconds)) return '00:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
})