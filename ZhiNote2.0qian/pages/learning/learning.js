const app = getApp()

Page({
  data: {
    notes: [],
    filteredNotes: [],
    selectedTag: '',
    loading: false,
    hasPlan: false,
    planData: {
      examSubject: '',
      remainingDays: 0,
      totalProgress: 0,
      todayTasks: []
    },
    // 知识图谱预览
    hasGraph: false,
    graphNodes: []
  },
  
  onLoad() {
    this.loadNotes()
  },

  onShow() {
    this.loadLearningPlan()
    this.loadKnowledgeGraph()
  },

  // 加载知识图谱预览数据
  loadKnowledgeGraph() {
    const app = getApp()
    wx.request({
      url: `${app.globalData.baseUrl}/api/global-knowledge-graph`,
      method: 'GET',
      success: (res) => {
        if (res.data.code === 0) {
          const data = res.data.data
          if (data.nodes && data.nodes.length > 0) {
            // 只取前8个节点用于预览
            const previewNodes = data.nodes.slice(0, 8).map(node => {
              const colorMap = {
                'theme': '#1677ff',
                'chapter': '#52c41a',
                'concept': '#faad14',
                'exam_point': '#ff4d4f'
              }
              const typeMap = {
                'theme': '主题',
                'chapter': '章节',
                'concept': '知识点',
                'exam_point': '考点'
              }
              return {
                id: node.id,
                name: node.name,
                color: colorMap[node.category] || '#999',
                typeLabel: typeMap[node.category] || node.category,
                isExamPoint: node.category === 'exam_point',
                isTheme: node.category === 'theme'
              }
            })
            this.setData({
              hasGraph: true,
              graphNodes: previewNodes
            })
          }
        }
      }
    })
  },

  // 加载笔记数据
  loadNotes() {
    this.setData({ loading: true })
    wx.request({
      url: `${app.globalData.baseUrl}/api/notes-list`,
      method: 'GET',
      data: {
        limit: 5  // 默认显示5条最近的笔记
      },
      success: (res) => {
        this.setData({ loading: false })
        if (res.data.code === 0) {
          this.setData({
            notes: res.data.data.notes,
            filteredNotes: res.data.data.notes
          })
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

  // 加载学习计划
  loadLearningPlan() {
    wx.request({
      url: `${app.globalData.baseUrl}/api/learning-plan/get`,
      method: 'GET',
      success: (res) => {
        console.log('[学习中心] 学习计划接口返回:', JSON.stringify(res.data))
        if (res.data.code === 0 && res.data.data.hasPlan) {
          const data = res.data.data
          // 直接使用后端返回的todayTasks，不再前端匹配日期
          const todayTasks = data.todayTasks || []
          console.log('[学习中心] 今日任务数:', todayTasks, '后端返回todayTasks:', JSON.stringify(todayTasks))
          
          this.setData({
            hasPlan: true,
            planData: {
              examSubject: data.examSubject || '',
              remainingDays: data.remainingDays,
              totalProgress: data.totalProgress,
              todayTasks: todayTasks
            }
          })
        }
      },
      fail: (err) => {
        console.error('加载学习计划失败:', err)
      }
    })
  },

  // 按标签筛选
  filterByTag(e) {
    const tag = e.currentTarget.dataset.tag
    this.setData({
      selectedTag: tag
    })
    this.applyFilter(tag)
  },
  
  // 应用筛选
  applyFilter(tag) {
    if (!tag) {
      this.setData({
        filteredNotes: this.data.notes
      })
      return
    }
    
    const filtered = this.data.notes.filter(note => {
      return note.tags && note.tags.some(t => t.name === tag)
    })
    
    this.setData({
      filteredNotes: filtered
    })
  },
  
  // 查看全部笔记
  goAllNotes() {
    wx.navigateTo({
      url: '/pages/notes/notes'
    })
  },
  
  // 进入笔记详情（跳转到AI分析）
  goNoteDetail(e) {
    const id = e.currentTarget.dataset.id
    const title = e.currentTarget.dataset.title
    // 将参数存储到本地存储，供analysis页面读取
    wx.setStorageSync('analysisNoteId', id)
    wx.setStorageSync('analysisNoteTitle', title)
    wx.setStorageSync('analysisNoteSource', '学习中心')
    // 跳转到AI分析页面
    wx.switchTab({
      url: '/pages/analysis/analysis'
    })
  },
  
  // 进入知识图谱
  goKnowledgeGraph() {
    wx.navigateTo({
      url: '/pages/chart/chart'
    })
  },
  
  // 进入学习计划
  goLearningPlan() {
    wx.navigateTo({
      url: '/pages/learning-plan/learning-plan'
    })
  }
});