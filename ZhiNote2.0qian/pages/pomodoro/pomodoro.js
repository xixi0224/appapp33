const app = getApp()

Page({
  data: {
    remainingTime: 25 * 60,
    totalTime: 25 * 60,
    isRunning: false,
    timerStatus: '准备开始',
    selectedNoise: null,
    selectedTime: 25 * 60,
    noiseList: [
      { id: 'forest', name: '森林', icon: '🌲' },
      { id: 'rain', name: '雨声', icon: '🌧️' },
      { id: 'ocean', name: '海浪', icon: '🌊' },
      { id: 'cafe', name: '咖啡馆', icon: '☕' }
    ],
    timeOptions: [
      { label: '15分钟', value: 15 * 60 },
      { label: '25分钟', value: 25 * 60 },
      { label: '30分钟', value: 30 * 60 },
      { label: '45分钟', value: 45 * 60 }
    ],
    timer: null,
    audioContext: null,
    formattedTime: '25:00',
    todayTotalMinutes: 0,  // 今日总学习时长（分钟）
    elapsedMinutes: 0  // 已经专注的时间（分钟）
  },

  onLoad() {
    this.setData({
      audioContext: wx.createInnerAudioContext(),
      formattedTime: this.formatTime(this.data.remainingTime)
    })
    
    // 加载今日总学习时长
    this.loadTodayTotal()
  },

  onUnload() {
    if (this.data.timer) {
      clearInterval(this.data.timer)
    }
    if (this.data.audioContext) {
      this.data.audioContext.stop()
    }
  },

  onShow() {
    // 每次显示页面时刷新今日总时长
    this.loadTodayTotal()
  },

  // 格式化时间
  formatTime(seconds) {
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  },

  // 格式化时长为小时:分钟
  formatDuration(minutes) {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}小时${mins}分钟`
    }
    return `${mins}分钟`
  },

  // 加载今日总学习时长
  loadTodayTotal() {
    const app = getApp()
    wx.request({
      url: `${app.globalData.baseUrl}/api/study-stats/stats?days=1`,
      method: 'GET',
      success: (res) => {
        if (res.statusCode === 200 && res.data.code === 0) {
          const totalMinutes = Math.round(res.data.data.totalDuration / 60)
          this.setData({
            todayTotalMinutes: totalMinutes
          })
          console.log('今日总学习时长:', totalMinutes, '分钟')
        }
      },
      fail: (err) => {
        console.error('加载今日总时长失败:', err)
      }
    })
  },

  // 开始计时
  startTimer() {
    const that = this
    if (this.data.isRunning) return
    
    this.setData({
      isRunning: true,
      timerStatus: '专注中...'
    })
    
    // 播放白噪音
    if (this.data.selectedNoise) {
      this.playNoise()
    }
    
    this.data.timer = setInterval(() => {
      if (that.data.remainingTime > 0) {
        const newTime = that.data.remainingTime - 1
        const elapsedSec = that.data.totalTime - newTime
        const elapsedMin = Math.floor(elapsedSec / 60)
        that.setData({
          remainingTime: newTime,
          formattedTime: that.formatTime(newTime),
          elapsedMinutes: elapsedMin  // 实时更新已专注时间
        })
      } else {
        // 时间到
        that.timerComplete()
      }
    }, 1000)
  },

  // 暂停计时
  pauseTimer() {
    if (this.data.timer) {
      clearInterval(this.data.timer)
      this.setData({
        isRunning: false,
        timerStatus: '已暂停'
      })
    }
    
    // 停止白噪音
    if (this.data.audioContext) {
      this.data.audioContext.stop()
    }
    
    // 计算已经专注的时间
    const elapsedSeconds = this.data.totalTime - this.data.remainingTime
    const elapsedMinutes = Math.floor(elapsedSeconds / 60)
    
    // 如果专注时间超过1分钟，询问是否保存
    if (elapsedMinutes >= 1) {
      const timeStr = this.formatDuration(elapsedMinutes)
      wx.showModal({
        title: '💡 提示',
        content: `已经专注了 ${timeStr}\n是否记录本次学习时长？`,
        confirmText: '记录',
        cancelText: '不记录',
        success: (res) => {
          if (res.confirm) {
            // 用户选择记录，保存到后端
            this.savePomodoroRecord(elapsedMinutes)
          }
        }
      })
    }
  },

  // 重置计时
  resetTimer() {
    if (this.data.timer) {
      clearInterval(this.data.timer)
    }
    
    // 停止白噪音
    if (this.data.audioContext) {
      this.data.audioContext.stop()
    }
    
    this.setData({
      remainingTime: this.data.selectedTime,
      totalTime: this.data.selectedTime,
      isRunning: false,
      timerStatus: '准备开始',
      formattedTime: this.formatTime(this.data.selectedTime),
      elapsedMinutes: 0  // 清零已专注时间
    })
  },

  // 计时完成
  timerComplete() {
    if (this.data.timer) {
      clearInterval(this.data.timer)
    }
    
    // 停止白噪音
    if (this.data.audioContext) {
      this.data.audioContext.stop()
    }
    
    // 计算实际专注的时间
    const elapsedSeconds = this.data.totalTime - this.data.remainingTime
    const elapsedMinutes = Math.floor(elapsedSeconds / 60)
    
    this.setData({
      isRunning: false,
      timerStatus: '完成！'
    })
    
    // 播放完成铃声
    this.playAlarm()
    
    wx.showToast({
      title: '番茄钟完成，休息一下吧！',
      icon: 'none',
      duration: 3000
    })
    
    // 记录学习时长到后端（使用真实时间）
    if (elapsedMinutes >= 1) {
      this.savePomodoroRecord(elapsedMinutes)
    }
  },

  // 选择白噪音
  selectNoise(e) {
    const noiseId = e.currentTarget.dataset.id
    this.setData({
      selectedNoise: noiseId
    })
  },

  // 播放白噪音
  playNoise() {
    // 这里应该播放实际的白噪音文件
    // 由于没有实际文件，这里只是示例
    if (this.data.audioContext) {
      // this.data.audioContext.src = '/assets/noise/' + this.data.selectedNoise + '.mp3'
      // this.data.audioContext.play()
    }
  },

  // 选择时间
  selectTime(e) {
    const timeValue = e.currentTarget.dataset.value
    this.setData({
      selectedTime: timeValue,
      remainingTime: timeValue,
      totalTime: timeValue,  // 更新总时间
      formattedTime: this.formatTime(timeValue)
    })
  },

  // 播放完成铃声
  playAlarm() {
    // 这里应该播放实际的铃声文件
    // 由于没有实际文件，这里只是示例
    if (this.data.audioContext) {
      // this.data.audioContext.src = '/assets/alarm.mp3'
      // this.data.audioContext.play()
    }
  },

  // 保存番茄钟记录到后端
  savePomodoroRecord(forceMinutes = null) {
    // 计算实际完成的时长（分钟）
    let completedMinutes = forceMinutes
    if (completedMinutes === null) {
      completedMinutes = Math.floor((this.data.totalTime - this.data.remainingTime) / 60)
    }
    
    // 如果时长小于1分钟，不记录
    if (completedMinutes < 1) {
      console.log('时长不足1分钟，不记录')
      return
    }

    console.log('准备保存番茄钟记录:', completedMinutes, '分钟')

    wx.request({
      url: `${app.globalData.baseUrl}/api/tools/pomodoro/complete`,
      method: 'POST',
      data: {
        duration: completedMinutes,
        user_id: 1  // 暂时默认为1，后续可以从登录信息获取
      },
      header: {
        'content-type': 'application/json'
      },
      success: (res) => {
        console.log('后端响应:', res)
        
        if (res.statusCode === 200 && res.data && res.data.success) {
          console.log('番茄钟记录成功:', res.data)
          
          // 更新今日总时长
          this.setData({
            todayTotalMinutes: res.data.total_today
          })
          
          // 显示今日总学习时长
          const timeStr = this.formatDuration(res.data.total_today)
          wx.showToast({
            title: `✅ 已记录${completedMinutes}分钟`,
            icon: 'success',
            duration: 2000
          })
          
          // 重新加载今日总时长（确保数据同步）
          setTimeout(() => {
            this.loadTodayTotal()
          }, 1000)
        } else {
          console.error('番茄钟记录失败:', res.data)
          wx.showToast({
            title: '记录失败，请重试',
            icon: 'none'
          })
        }
      },
      fail: (err) => {
        console.error('番茄钟记录网络错误:', err)
        wx.showToast({
          title: '网络错误，请检查后端',
          icon: 'none'
        })
      }
    })
  }
})