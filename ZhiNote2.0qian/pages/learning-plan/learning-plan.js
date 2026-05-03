const app = getApp()
import { setDarkMode, checkDarkMode } from '../../utils/theme'

Page({
  data: {
    examDate: '',
    dailyHours: 2,
    pendingTasks: '',
    examSubject: '',
    hasPlan: false,
    planData: [],
    remainingDays: 0,
    totalProgress: 0,
    generating: false
  },

  onLoad() {
    // 检查深色模式状态并更新样式
    const darkMode = checkDarkMode()
    setDarkMode(darkMode)
    
    // 先从本地缓存快速加载
    this.loadPlan()
    // 再从服务器加载最新数据
    this.loadPlanFromServer()
  },

  onShow() {
    // 每次显示页面时重新从服务器加载
    this.loadPlanFromServer()
  },

  // 选择考试日期
  onExamDateChange(e) {
    this.setData({
      examDate: e.detail.value
    })
  },

  // 设置每日可用时间
  onDailyHoursChange(e) {
    this.setData({
      dailyHours: e.detail.value
    })
  },

  // 输入待完成任务
  onPendingTasksInput(e) {
    this.setData({
      pendingTasks: e.detail.value
    })
  },

  // 输入考试科目
  onExamSubjectInput(e) {
    this.setData({
      examSubject: e.detail.value
    })
  },

  // 生成学习计划
  generatePlan() {
    const { examDate, dailyHours, pendingTasks, examSubject, generating } = this.data
    
    // 防止重复提交
    if (generating) return
    
    if (!examDate) {
      wx.showToast({ title: '请选择考试日期', icon: 'none' })
      return
    }
    
    if (!examSubject) {
      wx.showToast({ title: '请输入考试科目', icon: 'none' })
      return
    }
    
    this.setData({ generating: true })
    
    wx.showLoading({ title: 'AI生成中...', mask: true })
    
    // 调用后端API生成学习计划
    wx.request({
      url: `${app.globalData.baseUrl}/api/learning-plan/generate`,
      method: 'POST',
      data: {
        examDate: examDate,
        dailyHours: Number(dailyHours),
        pendingTasks: pendingTasks,
        examSubject: examSubject
      },
      timeout: 60000, // AI生成需要较长时间
      success: (res) => {
        wx.hideLoading()
        this.setData({ generating: false })
        
        if (res.statusCode === 200 && res.data.code === 0) {
          this.setData({
            hasPlan: true,
            planData: res.data.data.planData,
            remainingDays: res.data.data.remainingDays,
            totalProgress: res.data.data.totalProgress || 0
          })
          // 保存计划到本地存储
          wx.setStorageSync('learningPlan', this.data.planData)
          wx.showToast({ title: '计划生成成功', icon: 'success' })
        } else {
          const errMsg = res.data?.detail || res.data?.message || '计划生成失败，请重试'
          wx.showToast({ title: errMsg, icon: 'none', duration: 3000 })
        }
      },
      fail: () => {
        wx.hideLoading()
        this.setData({ generating: false })
        wx.showToast({ title: '网络异常，请检查后端是否启动', icon: 'none', duration: 3000 })
      }
    })
  },

  // 重新生成计划
  regeneratePlan() {
    wx.showModal({
      title: '重新生成计划',
      content: '确定要重新生成学习计划吗？当前进度将被清除。',
      success: (res) => {
        if (res.confirm) {
          this.setData({
            hasPlan: false,
            planData: [],
            remainingDays: 0,
            totalProgress: 0
          })
          // 清除本地存储的计划
          wx.removeStorageSync('learningPlan')
        }
      }
    })
  },

  // 从本地缓存加载已保存的计划
  loadPlan() {
    const savedPlan = wx.getStorageSync('learningPlan')
    if (savedPlan && savedPlan.length > 0) {
      this.setData({
        hasPlan: true,
        planData: savedPlan
      })
      this.calculateProgress()
    }
  },

  // 从服务器加载计划
  loadPlanFromServer() {
    wx.request({
      url: `${app.globalData.baseUrl}/api/learning-plan/get`,
      method: 'GET',
      timeout: 10000,
      success: (res) => {
        if (res.statusCode === 200 && res.data.code === 0 && res.data.data.hasPlan) {
          this.setData({
            hasPlan: true,
            planData: res.data.data.planData,
            remainingDays: res.data.data.remainingDays,
            totalProgress: res.data.data.totalProgress || 0
          })
          // 同步更新本地缓存
          wx.setStorageSync('learningPlan', res.data.data.planData)
        }
      },
      fail: (err) => {
        console.error('加载服务器计划失败:', err)
      }
    })
  },

  // 切换任务完成状态
  toggleTask(e) {
    const { date, taskid } = e.currentTarget.dataset
    const { planData } = this.data
    
    // 找到对应的日期和任务
    for (let i = 0; i < planData.length; i++) {
      if (planData[i].date === date) {
        for (let j = 0; j < planData[i].tasks.length; j++) {
          if (planData[i].tasks[j].id === taskid) {
            planData[i].tasks[j].completed = !planData[i].tasks[j].completed
            
            // 检查当天所有任务是否完成
            const allCompleted = planData[i].tasks.every(task => task.completed)
            if (allCompleted) {
              planData[i].status = 'completed'
            } else if (this.isToday(date)) {
              planData[i].status = 'today'
            }
            
            break
          }
        }
        break
      }
    }
    
    this.setData({
      planData: planData
    })
    
    // 保存更新后的计划
    wx.setStorageSync('learningPlan', planData)
    
    // 重新计算进度
    this.calculateProgress()
    
    // 调用后端API保存进度
    this.saveProgress()
  },

  // 计算总进度
  calculateProgress() {
    const { planData } = this.data
    if (!planData || planData.length === 0) return
    
    let totalTasks = 0
    let completedTasks = 0
    
    for (let i = 0; i < planData.length; i++) {
      for (let j = 0; j < planData[i].tasks.length; j++) {
        totalTasks++
        if (planData[i].tasks[j].completed) {
          completedTasks++
        }
      }
    }
    
    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
    
    this.setData({
      totalProgress: progress
    })
  },

  // 保存进度到后端
  saveProgress() {
    wx.request({
      url: `${app.globalData.baseUrl}/api/learning-plan/save-progress`,
      method: 'POST',
      data: {
        planData: this.data.planData,
        totalProgress: this.data.totalProgress
      },
      timeout: 10000,
      success: (res) => {
        if (res.data && res.data.code === 0) {
          console.log('进度保存成功')
        }
      },
      fail: (err) => {
        console.error('进度保存失败:', err)
      }
    })
  },

  // 学习打卡
  checkIn() {
    const { planData } = this.data
    
    // 计算今天完成的任务数
    const today = new Date().toISOString().split('T')[0]
    const todayPlan = planData.find(day => day.date === today)
    const completedTasks = todayPlan ? todayPlan.tasks.filter(task => task.completed).length : 0
    
    if (completedTasks === 0) {
      wx.showToast({ title: '请先完成至少一个任务', icon: 'none' })
      return
    }
    
    // 计算学习时长（每个任务约30分钟）
    const studyDuration = completedTasks * 30
    
    wx.showLoading({ title: '打卡中...' })
    
    wx.request({
      url: `${app.globalData.baseUrl}/api/study-stats/check-in`,
      method: 'POST',
      data: {
        studyDuration: studyDuration,
        taskCount: completedTasks
      },
      timeout: 10000,
      success: (res) => {
        wx.hideLoading()
        if (res.statusCode === 200 && res.data && res.data.code === 0) {
          wx.showToast({ title: '打卡成功！', icon: 'success' })
        } else {
          wx.showToast({ title: '打卡失败', icon: 'none' })
        }
      },
      fail: () => {
        wx.hideLoading()
        wx.showToast({ title: '网络错误', icon: 'none' })
      }
    })
  },

  // 判断是否为今天
  isToday(dateStr) {
    const today = new Date()
    const date = new Date(dateStr)
    return today.toDateString() === date.toDateString()
  }
})