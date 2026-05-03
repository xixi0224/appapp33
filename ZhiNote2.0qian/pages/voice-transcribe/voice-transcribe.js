const app = getApp()

Page({
  data: {
    filePath: '',
    audioId: '',
    isPlaying: false,
    currentTime: '00:00',
    duration: '00:00',
    progress: 0,
    speed: 1.0,
    speeds: [0.5, 0.75, 1.0, 1.25, 1.5, 2.0],
    showSpeedOptions: false,
    transcript: []
  },

  onLoad(options) {
    console.log('接收到的参数:', options)
    this.setData({
      filePath: options.filePath,
      audioId: options.audioId || 1
    })
    console.log('设置的文件路径:', this.data.filePath)
    // 初始化音频
    this.initAudio()
    this.fetchTranscript()
  },

  onUnload() {
    if (this.audioContext) {
      this.audioContext.stop()
    }
  },

  // 初始化音频上下文
  initAudio() {
    const that = this
    // 使用 InnerAudioContext 来实现更灵活的音频控制
    this.audioContext = wx.createInnerAudioContext()
    // 构建完整的音频URL
    const baseUrl = app.globalData.baseUrl
    const audioUrl = this.data.filePath.startsWith('http') ? this.data.filePath : `${baseUrl}${this.data.filePath}`
    console.log('音频URL:', audioUrl)
    this.audioContext.src = audioUrl
    
    wx.setInnerAudioOption({
      obeyMuteSwitch: false
    })

    this.audioContext.onPlay(() => {
      that.setData({ isPlaying: true })
    })

    this.audioContext.onPause(() => {
      that.setData({ isPlaying: false })
    })

    this.audioContext.onEnded(() => {
      that.setData({ isPlaying: false })
    })

    this.audioContext.onTimeUpdate(() => {
      const currentTime = this.audioContext.currentTime
      const duration = this.audioContext.duration
      const progress = duration > 0 ? (currentTime / duration) * 100 : 0
      
      that.setData({
        currentTime: that.formatTime(currentTime),
        duration: that.formatTime(duration),
        progress: progress
      })
    })
    
    // 错误处理
    this.audioContext.onError((res) => {
      console.log('音频加载错误:', res)
      wx.showToast({
        title: '音频加载失败',
        icon: 'none'
      })
    })
  },

  // 切换播放/暂停
  togglePlay() {
    if (!this.audioContext) {
      wx.showToast({
        title: '音频加载失败',
        icon: 'none'
      })
      return
    }
    if (this.data.isPlaying) {
      this.audioContext.pause()
    } else {
      this.audioContext.play()
    }
  },

  // 显示倍速选项
  showSpeedOptions() {
    this.setData({
      showSpeedOptions: !this.data.showSpeedOptions
    })
  },

  // 设置播放速度
  setSpeed(e) {
    const speed = e.currentTarget.dataset.speed
    this.setData({
      speed: speed,
      showSpeedOptions: false
    })
    // InnerAudioContext 支持 setPlaybackRate 方法
    if (this.audioContext) {
      this.audioContext.playbackRate = speed
    }
  },

  // 跳转到指定时间
  seekTo(e) {
    const timeStr = e.currentTarget.dataset.time
    const [minutes, seconds] = timeStr.split(':').map(Number)
    const time = minutes * 60 + seconds
    if (this.audioContext) {
      this.audioContext.seek(time)
    }
  },

  // 获取转写结果
  fetchTranscript() {
    const that = this
    wx.showLoading({ title: '正在转写...' })
    // 调用后端API获取转写结果
    wx.request({
      url: `${app.globalData.baseUrl}/api/asr/convert`,
      method: 'POST',
      data: {
        fileId: parseInt(that.data.audioId)
      },
      success: function(res) {
        wx.hideLoading()
        if (res.data.code === 0) {
          // 处理转写结果格式
          const transcript = res.data.data.transcript
          that.setData({ transcript: transcript })
        } else {
          wx.showToast({
            title: '转写失败',
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

  // 保存为笔记
  saveAsNote() {
    const that = this
    wx.showLoading({ title: '保存中...' })
    // 构建笔记内容
    const transcriptText = that.data.transcript.map(item => item.text).join('\n')
    const content = `[音频转文字]\n${transcriptText}\n\n[音频链接]\n${that.data.filePath}`
    
    // 从文件路径中提取文件名作为标题
    let title = '音频转文字笔记'
    const filePath = that.data.filePath
    if (filePath) {
      // 从路径中提取文件名
      const pathParts = filePath.split('/')
      if (pathParts.length > 0) {
        let fileName = pathParts[pathParts.length - 1]
        // 解码URL编码的文件名
        try {
          fileName = decodeURIComponent(fileName)
        } catch (e) {
          console.log('解码文件名失败:', e)
        }
        // 移除文件扩展名
        const nameParts = fileName.split('.')
        if (nameParts.length > 1) {
          nameParts.pop() // 移除扩展名
          title = nameParts.join('.')
        } else {
          title = fileName
        }
        // 限制标题长度
        if (title.length > 50) {
          title = title.substring(0, 50) + '...'
        }
      }
    }
    
    // 调用后端API保存笔记
    wx.request({
      url: `${app.globalData.baseUrl}/api/save-note`,
      method: 'POST',
      data: {
        title: title,
        content: content
      },
      success: function(res) {
        wx.hideLoading()
        if (res.data.code === 0) {
          const noteId = res.data.data.noteId
          // 显示保存成功提示，并提供跳转到AI分析的选项
          wx.showModal({
            title: '保存成功',
            content: '是否跳转到AI分析页面？',
            success: function(res) {
              if (res.confirm) {
                // 将参数存储到本地存储，供analysis页面读取
                wx.setStorageSync('analysisNoteId', noteId)
                wx.setStorageSync('analysisNoteTitle', title)
                wx.setStorageSync('analysisNoteSource', '语音转文字')
                // 跳转到AI分析主界面（tabBar页面必须使用switchTab）
                wx.switchTab({
                  url: '/pages/analysis/analysis'
                })
              } else if (res.cancel) {
                // 跳回首页
                wx.switchTab({
                  url: '/pages/index/index'
                })
              }
            }
          })
        } else {
          wx.showToast({
            title: '保存失败',
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

  // 格式化时间
  formatTime(seconds) {
    if (isNaN(seconds)) return '00:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
})