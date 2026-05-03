const app = getApp()

Page({
  data: {
    isRecording: false,
    isPaused: false,
    currentTime: '00:00',
    totalTime: '60:00',
    statusText: '点击开始录音',
    micAnimation: '',
    timer: null,
    seconds: 0,
    maxSeconds: 3600, // 60分钟
    tempFilePath: '',
    audioContext: null,
    isPlaying: false
  },

  onLoad() {
    // 初始化录音管理器
    this.recorderManager = wx.getRecorderManager()
    this.initRecorder()
  },

  onUnload() {
    this.stopTimer()
    if (this.data.audioContext) {
      this.data.audioContext.stop()
    }
  },

  // 初始化录音管理器
  initRecorder() {
    const that = this
    
    // 录音开始回调
    this.recorderManager.onStart(() => {
      console.log('录音开始')
      that.setData({
        isRecording: true,
        isPaused: false,
        statusText: '录音中…'
      })
      that.startTimer()
    })

    // 录音结束回调
    this.recorderManager.onStop((res) => {
      console.log('录音结束', res)
      that.stopTimer()
      that.setData({
        isRecording: false,
        isPaused: false,
        tempFilePath: res.tempFilePath,
        statusText: '录音完成'
      })
      
      // 录音完成后自动上传
      that.uploadAudio(res.tempFilePath)
    })

    // 录音暂停回调
    this.recorderManager.onPause(() => {
      console.log('录音暂停')
      that.setData({
        isPaused: true,
        statusText: '已暂停'
      })
      that.stopTimer()
    })

    // 录音继续回调
    this.recorderManager.onResume(() => {
      console.log('录音继续')
      that.setData({
        isPaused: false,
        statusText: '录音中…'
      })
      that.startTimer()
    })

    // 录音错误回调
    this.recorderManager.onError((err) => {
      console.error('录音失败', err)
      that.setData({
        isRecording: false,
        isPaused: false,
        statusText: '录音失败'
      })
      that.stopTimer()
      wx.showToast({
        title: '录音失败',
        icon: 'none'
      })
    })
  },

  // 开始/停止录音
  toggleRecord() {
    if (this.data.isRecording) {
      // 停止录音
      this.recorderManager.stop()
    } else {
      // 开始录音
      const options = {
        duration: this.data.maxSeconds * 1000, // 最长60分钟
        sampleRate: 16000,
        numberOfChannels: 1,
        encodeBitRate: 96000,
        format: 'mp3' // 使用mp3格式
      }
      this.recorderManager.start(options)
    }
  },

  // 暂停录音
  pauseRecord() {
    if (this.data.isRecording && !this.data.isPaused) {
      this.recorderManager.pause()
    }
  },

  // 继续录音
  resumeRecord() {
    if (this.data.isRecording && this.data.isPaused) {
      this.recorderManager.resume()
    }
  },

  // 重录
  restartRecord() {
    const that = this
    wx.showModal({
      title: '确认重录',
      content: '确定要清除当前录音并重新开始吗？',
      success: function(res) {
        if (res.confirm) {
          that.setData({
            tempFilePath: '',
            currentTime: '00:00',
            seconds: 0,
            isRecording: false,
            isPaused: false,
            statusText: '点击开始录音'
          })
          if (that.data.audioContext) {
            that.data.audioContext.stop()
            that.setData({
              audioContext: null,
              isPlaying: false
            })
          }
        }
      }
    })
  },

  // 播放录音
  playAudio() {
    const that = this
    if (!this.data.tempFilePath) {
      wx.showToast({
        title: '没有可播放的录音',
        icon: 'none'
      })
      return
    }

    if (this.data.isPlaying) {
      // 停止播放
      if (this.data.audioContext) {
        this.data.audioContext.stop()
        this.setData({
          isPlaying: false
        })
      }
    } else {
      // 开始播放
      const audioContext = wx.createInnerAudioContext()
      audioContext.src = this.data.tempFilePath
      
      audioContext.onPlay(() => {
        that.setData({ isPlaying: true })
      })
      
      audioContext.onEnded(() => {
        that.setData({ isPlaying: false })
      })
      
      audioContext.onError((err) => {
        console.error('播放失败', err)
        that.setData({ isPlaying: false })
        wx.showToast({
          title: '播放失败',
          icon: 'none'
        })
      })
      
      audioContext.play()
      this.setData({ audioContext: audioContext })
    }
  },

  // 上传录音到服务器
  uploadAudio(filePath) {
    const that = this
    wx.showLoading({ title: '上传中...' })
    
    wx.uploadFile({
      url: `${app.globalData.baseUrl}/api/upload-audio`,
      filePath: filePath,
      name: 'audio',
      formData: {
        filename: `voice_record_${Date.now()}.mp3`
      },
      success: (res) => {
        wx.hideLoading()
        console.log('上传成功:', res)
        if (res.statusCode === 200) {
          try {
            const data = JSON.parse(res.data)
            if (data.code === 0) {
              wx.showToast({
                title: '上传成功',
                icon: 'success'
              })
              // 上传成功后进行语音转文字
              that.transcribeAudio(data.data.audioId)
            } else {
              wx.showToast({
                title: data.detail || '上传失败',
                icon: 'none'
              })
            }
          } catch (e) {
            console.error('处理上传结果时出错:', e)
            wx.showToast({
              title: '处理上传结果时出错',
              icon: 'none'
            })
          }
        } else {
          wx.showToast({
            title: '上传失败',
            icon: 'none'
          })
        }
      },
      fail: (err) => {
        wx.hideLoading()
        console.error('上传失败:', err)
        wx.showToast({
          title: '上传失败',
          icon: 'none'
        })
      }
    })
  },

  // 语音转文字
  transcribeAudio(audioId) {
    const that = this
    wx.showLoading({ title: '转写中...' })
    
    wx.request({
      url: `${app.globalData.baseUrl}/api/asr/convert`,
      method: 'POST',
      data: {
        fileId: audioId
      },
      success: function(res) {
        wx.hideLoading()
        if (res.data.code === 0) {
          const transcript = res.data.data.transcript
          // 将转写结果存储到本地
          wx.setStorageSync('voiceTranscript', transcript)
          wx.setStorageSync('voiceAudioId', audioId)
          
          // 转写成功后跳转到AI分析页面
          wx.showModal({
            title: '转写完成',
            content: '语音已成功转写为文字，是否跳转到AI分析页面？',
            success: function(res) {
              if (res.confirm) {
                // 将参数存储到本地存储，供analysis页面读取
                wx.setStorageSync('analysisNoteTitle', '语音录入')
                wx.setStorageSync('analysisNoteSource', '语音转文字')
                wx.setStorageSync('analysisTranscript', transcript)
                // 跳转到AI分析主界面（tabBar页面必须使用switchTab）
                wx.switchTab({
                  url: '/pages/analysis/analysis'
                })
              } else {
                // 留在当前页面，用户可以预览录音
                that.setData({
                  statusText: '转写完成，可播放预览'
                })
              }
            }
          })
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

  // 开始计时器
  startTimer() {
    const that = this
    this.timer = setInterval(function() {
      let seconds = that.data.seconds + 1
      if (seconds >= that.data.maxSeconds) {
        that.stopTimer()
        that.recorderManager.stop()
        return
      }
      that.setData({
        seconds: seconds,
        currentTime: that.formatTime(seconds)
      })
    }, 1000)
  },

  // 停止计时器
  stopTimer() {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
  },

  // 格式化时间
  formatTime(seconds) {
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
})