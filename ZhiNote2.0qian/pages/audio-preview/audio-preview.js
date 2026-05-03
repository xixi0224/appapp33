const app = getApp()

Page({
  data: {
    audioInfo: {
      name: '',
      size: '',
      duration: '',
      path: '',
      audioId: ''
    },
    isPlaying: false,
    currentTime: '00:00',
    totalDuration: '00:00',
    progress: 0
  },

  onLoad(options) {
    console.log('接收到的参数:', options)
    this.setData({
      audioInfo: {
        name: options.name || '未知音频',
        size: options.size || '未知大小',
        duration: options.duration || '未知时长',
        path: options.filePath,
        audioId: options.audioId || 1
      }
    })
    this.initAudio()
  },

  onUnload() {
    if (this.audioContext) {
      this.audioContext.stop()
      this.audioContext.destroy()
    }
  },

  // 初始化音频上下文
  initAudio() {
    const that = this
    this.audioContext = wx.createInnerAudioContext()
    this.audioContext.src = this.data.audioInfo.path
    
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
        totalDuration: that.formatTime(duration),
        progress: progress
      })
    })

    this.audioContext.onLoadedData(() => {
      that.setData({
        totalDuration: that.formatTime(this.audioContext.duration)
      })
    })

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
    if (this.data.isPlaying) {
      this.audioContext.pause()
    } else {
      this.audioContext.play()
    }
  },

  // 跳转到语音转文字
  goToTranscribe() {
    wx.redirectTo({
      url: `/pages/voice-transcribe/voice-transcribe?filePath=${encodeURIComponent(this.data.audioInfo.path)}&audioId=${this.data.audioInfo.audioId}`
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