// pages/chart/chart.js
import * as echarts from '../ec-canvas/echarts';

let chart = null;
let demoCanvas = null;
let animationFrame = null;

// 清空模拟数据
let graphData = {
  nodes: [],  // 清空模拟数据
  links: [],   // 清空模拟数据
  categories: []  // 清空模拟数据
};

function initChart(canvas, width, height, dpr) {
  console.log('[ec-canvas] initChart 尺寸:', width, height, dpr)
  chart = echarts.init(canvas, null, {
    width,
    height,
    devicePixelRatio: dpr
  });
  canvas.setChart(chart);

  const option = {
    backgroundColor: '#1a1a1a',
    title: {
      text: '知识图谱',
      left: 'center',
      textStyle: { color: '#ffffff' }
    },
    series: [{
      name: '知识图谱',
      type: 'graph',
      layout: 'force',
      data: graphData.nodes,
      links: graphData.links,
      categories: graphData.categories,
      roam: true,
      label: { show: true, color: '#ffffff' },
      lineStyle: { color: 'source', curveness: 0.3 },
      force: { repulsion: 1000, edgeLength: [80, 120] }
    }]
  };

  chart.setOption(option);
  return chart;
}

Page({
  data: {
    ec: {
      onInit: initChart
    },
    searchKeyword: '',
    showDetailPanel: false,
    selectedNode: {
      name: '',
      definition: '',
      relatedNotes: [],
      mastery: 0
    },
    showSharePanel: false,
    pageData: {
      title: '知识图谱'
    },
    chartData: graphData,
    showDemoCanvas: false,
    isDemoAvailable: false,
    isPlaying: false,
    demoStep: 0,
    demoDescription: '',
    showAddNodePanel: false,
    newNodeName: '',
    newNodeTypeIndex: 0,
    newNodeDefinition: '',
    nodeTypes: [
      { label: '主题', value: 'theme' },
      { label: '章节', value: 'chapter' },
      { label: '知识点', value: 'concept' },
      { label: '考点', value: 'exam_point' }
    ],
    isLoading: false,
    hasData: false,
    noteList: [],
    selectedNoteIndex: 0,
    selectedNoteId: null,
    graphMode: 'global',
    panelOpen: false
  },

  // 检查是否有任何面板处于打开状态
  checkPanelOpen() {
    const { showDetailPanel, showDemoCanvas, showAddNodePanel, showSharePanel } = this.data
    const isOpen = showDetailPanel || showDemoCanvas || showAddNodePanel || showSharePanel
    this.setData({ panelOpen: isOpen })
  },

  onLoad() {
    // 加载笔记列表，供单笔记模式选择
    this.loadNoteList()
  },

  onReady() {
    // ec-canvas 组件初始化完成后再获取数据，避免图表实例为 null
    this.fetchKnowledgeGraphData()
  },

  // 加载笔记列表
  loadNoteList() {
    const app = getApp()
    wx.request({
      url: `${app.globalData.baseUrl}/api/notes-list?limit=50`,
      method: 'GET',
      success: (res) => {
        if (res.data.code === 0) {
          const notes = res.data.data.notes || []
          this.setData({
            noteList: notes,
            selectedNoteIndex: notes.length > 0 ? 0 : -1,
            selectedNoteId: notes.length > 0 ? notes[0].id : null
          })
        }
      }
    })
  },

  // 选择笔记
  onNoteSelect(e) {
    const index = parseInt(e.detail.value)
    const note = this.data.noteList[index]
    this.setData({
      selectedNoteIndex: index,
      selectedNoteId: note ? note.id : null
    })
  },

  // 为选中的笔记生成知识图谱
  generateNoteGraph() {
    const { selectedNoteId, noteList, selectedNoteIndex } = this.data
    if (!selectedNoteId) {
      wx.showToast({ title: '请先选择笔记', icon: 'none' })
      return
    }
    const noteTitle = noteList[selectedNoteIndex].title
    wx.showModal({
      title: '生成知识图谱',
      content: `确定要为「${noteTitle}」生成知识图谱吗？`,
      success: (res) => {
        if (res.confirm) {
          this.doGenerateNoteGraph(selectedNoteId)
        }
      }
    })
  },

  doGenerateNoteGraph(noteId) {
    const app = getApp()
    wx.showLoading({ title: 'AI生成中...' })
    wx.request({
      url: `${app.globalData.baseUrl}/api/knowledge-graph/generate/${noteId}`,
      method: 'POST',
      success: (res) => {
        wx.hideLoading()
        if (res.data.success) {
          wx.showToast({ title: '生成成功', icon: 'success' })
          this.setData({ graphMode: 'single' })
          this.fetchNoteGraph(noteId)
        } else {
          wx.showToast({ title: res.data.message || '生成失败', icon: 'none' })
        }
      },
      fail: () => {
        wx.hideLoading()
        wx.showToast({ title: '网络异常', icon: 'none' })
      }
    })
  },

  // 获取单笔记知识图谱
  fetchNoteGraph(noteId) {
    const app = getApp()
    this.setData({ isLoading: true })
    wx.request({
      url: `${app.globalData.baseUrl}/api/knowledge-graph/${noteId}`,
      method: 'GET',
      success: (res) => {
        this.setData({ isLoading: false })
        if (res.data.code === 0 || res.data.nodes) {
          const data = res.data.code === 0 ? res.data.data : res.data
          if (!data.nodes || data.nodes.length === 0) {
            wx.showToast({ title: '该笔记暂无知识图谱', icon: 'none' })
            this.setData({ hasData: false })
            return
          }
          graphData = {
            nodes: data.nodes.map(n => ({
              id: String(n.id),
              name: n.content || n.name,
              category: n.node_type || 'concept',
              definition: n.definition || '',
              importance: n.importance || '⭐',
              symbolSize: n.node_type === 'theme' ? 70 : (n.node_type === 'chapter' ? 55 : 40),
              draggable: true
            })),
            links: (data.edges || []).map(e => ({
              source: String(e.source_node_id),
              target: String(e.target_node_id),
              value: e.relationship_type,
              name: e.relationship_type
            })),
            categories: [
              { name: 'theme' },
              { name: 'chapter' },
              { name: 'concept' },
              { name: 'exam_point' }
            ]
          }
          this.setData({
            chartData: graphData,
            hasData: true,
            graphMode: 'single'
          })
          this.updateChart()
        }
      },
      fail: () => {
        this.setData({ isLoading: false })
        wx.showToast({ title: '获取失败', icon: 'none' })
      }
    })
  },

  // 获取全局知识图谱数据
  fetchKnowledgeGraphData() {
    const app = getApp()
    this.setData({ isLoading: true })

    wx.request({
      url: `${app.globalData.baseUrl}/api/global-knowledge-graph`,
      method: 'GET',
      success: (res) => {
        this.setData({ isLoading: false })
        if (res.data.code === 0) {
          const data = res.data.data
          console.log('[知识图谱] 获取数据:', data)
          console.log(`[知识图谱] 节点数: ${data.nodes ? data.nodes.length : 0}, 关系数: ${data.links ? data.links.length : 0}`)

          if (!data.nodes || data.nodes.length === 0) {
            this.setData({ hasData: false })
            wx.showModal({
              title: '知识图谱未生成',
              content: '暂无全局知识图谱数据，是否立即生成？',
              success: (modalRes) => {
                if (modalRes.confirm) {
                  this.generateGlobalGraph()
                }
              }
            })
            return
          }

          graphData = {
            nodes: data.nodes,
            links: data.links,
            categories: data.categories
          }
          this.setData({
            chartData: graphData,
            hasData: true,
            graphMode: 'global'
          })
          this.updateChart()
        }
      },
      fail: () => {
        this.setData({ isLoading: false })
        wx.showToast({
          title: '获取知识图谱失败',
          icon: 'none'
        })
      }
    })
  },
  
  // 触发全局知识图谱生成
  generateGlobalGraph() {
    const app = getApp()
    wx.showLoading({ title: 'AI生成中...' })
    
    wx.request({
      url: `${app.globalData.baseUrl}/api/global-knowledge-graph/generate`,
      method: 'POST',
      success: (res) => {
        wx.hideLoading()
        if (res.data.code === 0) {
          wx.showToast({ title: '生成成功', icon: 'success' })
          this.fetchKnowledgeGraphData()
        } else {
          wx.showToast({ title: res.data.detail || '生成失败', icon: 'none' })
        }
      },
      fail: () => {
        wx.hideLoading()
        wx.showToast({ title: '网络异常', icon: 'none' })
      }
    })
  },
  
  // 节点类型颜色映射
  getNodeColor(nodeType) {
    const colorMap = {
      'theme': '#1677ff',      // 主题 - 蓝色
      'chapter': '#52c41a',    // 章节 - 绿色
      'concept': '#faad14',    // 知识点 - 橙色
      'exam_point': '#ff4d4f'  // 考点 - 红色
    }
    return colorMap[nodeType] || '#999999'
  },

  // 更新图表
  updateChart() {
    if (!chart) return
    
    // 为节点添加颜色
    const coloredNodes = graphData.nodes.map(node => {
      return {
        ...node,
        itemStyle: {
          color: this.getNodeColor(node.category)
        },
        label: {
          show: true,
          color: '#ffffff',
          fontSize: node.category === 'theme' ? 16 : (node.category === 'exam_point' ? 14 : 12)
        }
      }
    })
    
    const option = {
      backgroundColor: '#1a1a1a',
      tooltip: {
        show: true,
        formatter: (params) => {
          if (params.dataType === 'node') {
            const typeMap = {
              'theme': '主题',
              'chapter': '章节',
              'concept': '知识点',
              'exam_point': '考点'
            }
            return `${params.name}<br/>类型: ${typeMap[params.data.category] || params.data.category}<br/>重要度: ${params.data.importance || '⭐'}`
          }
          return params.name
        }
      },
      legend: {
        data: ['theme', 'chapter', 'concept', 'exam_point'],
        textStyle: { color: '#ffffff' },
        bottom: 10,
        formatter: (name) => {
          const nameMap = { 'theme': '主题', 'chapter': '章节', 'concept': '知识点', 'exam_point': '考点' }
          return nameMap[name] || name
        }
      },
      series: [{
        name: '知识图谱',
        type: 'graph',
        layout: 'force',
        data: coloredNodes,
        links: graphData.links,
        categories: [
          { name: 'theme', itemStyle: { color: '#1677ff' } },
          { name: 'chapter', itemStyle: { color: '#52c41a' } },
          { name: 'concept', itemStyle: { color: '#faad14' } },
          { name: 'exam_point', itemStyle: { color: '#ff4d4f' } }
        ],
        roam: true,
        label: { show: true, color: '#ffffff' },
        lineStyle: { color: 'source', curveness: 0.3, opacity: 0.6 },
        force: { 
          repulsion: 2000, 
          edgeLength: [60, 150],
          gravity: 0.1
        },
        emphasis: {
          focus: 'adjacency',
          lineStyle: { width: 4, opacity: 1 },
          itemStyle: { shadowBlur: 20, shadowColor: 'rgba(0,0,0,0.5)' }
        },
        edgeSymbol: ['none', 'arrow'],
        edgeSymbolSize: [0, 8]
      }]
    }
    
    // 先清空再重新渲染，确保新节点能正确显示
    chart.clear()
    chart.setOption(option, true)
    
    // 添加点击事件
    chart.off('click')
    chart.on('click', (params) => {
      if (params.dataType === 'node') {
        this.showDetailPanel(params.data)
      }
    })
  },

  // 搜索输入
  onSearchInput(e) {
    this.setData({
      searchKeyword: e.detail.value
    });
    this.searchNodes(e.detail.value);
  },

  // 清除搜索
  clearSearch() {
    this.setData({
      searchKeyword: ''
    });
    this.resetGraph();
  },

  // 搜索节点
  searchNodes(keyword) {
    if (!chart) return;
    
    // 这里应该实现搜索逻辑
    // 暂时为空，等待后端接入
  },

  // 重置图谱
  resetGraph() {
    if (!chart) return;
    
    // 这里应该实现重置逻辑
    // 暂时为空，等待后端接入
  },

  // 显示详情面板
  showDetailPanel(node) {
    // 检查节点是否有演示可用
    const isDemoAvailable = this.isNodeDemoAvailable(node.name);

    this.setData({
      showDetailPanel: true,
      selectedNode: {
        id: node.id,
        name: node.name,
        definition: node.definition || '暂无定义',
        relatedNotes: [],
        mastery: 0
      },
      isDemoAvailable: isDemoAvailable
    });

    // 隐藏 ECharts tooltip，避免干扰详情面板
    if (chart) {
      chart.dispatchAction({ type: 'hideTip' });
      chart.dispatchAction({ type: 'downplay' });
    }

    this.checkPanelOpen()

    // 从后端获取关联笔记
    this.fetchNodeRelatedNotes(node.id)
  },
  
  // 获取节点关联笔记
  fetchNodeRelatedNotes(nodeId) {
    const app = getApp()
    wx.request({
      url: `${app.globalData.baseUrl}/api/knowledge-graph/node/${nodeId}/notes`,
      method: 'GET',
      success: (res) => {
        if (res.data.code === 0) {
          const notes = res.data.data.notes || []
          this.setData({
            'selectedNode.relatedNotes': notes
          })
        }
      }
    })
  },
  
  // 跳转到笔记详情
  goToNoteDetail(e) {
    const noteId = e.currentTarget.dataset.id
    const noteTitle = e.currentTarget.dataset.title
    wx.setStorageSync('analysisNoteId', noteId)
    wx.setStorageSync('analysisNoteTitle', noteTitle)
    wx.setStorageSync('analysisNoteSource', '知识图谱')
    wx.switchTab({
      url: '/pages/analysis/analysis'
    })
  },

  // 关闭详情面板
  closeDetailPanel() {
    this.setData({
      showDetailPanel: false
    });
    // 恢复 ECharts 交互
    if (chart) {
      chart.dispatchAction({ type: 'downplay' });
    }
    this.checkPanelOpen()
  },

  // 关闭演示画布
  closeDemoCanvas() {
    this.setData({
      showDemoCanvas: false,
      isPlaying: false
    });
    // 清除动画
    if (animationFrame) {
      cancelAnimationFrame(animationFrame);
      animationFrame = null;
    }
    // 清除画布引用
    demoCanvas = null;
    this.checkPanelOpen()
  },

  // 关闭添加节点面板
  closeAddNodePanel() {
    this.setData({
      showAddNodePanel: false
    });
    this.checkPanelOpen()
  },

  // 关闭分享面板
  closeSharePanel() {
    this.setData({
      showSharePanel: false
    });
    this.checkPanelOpen()
  },

  // 显示分享面板
  showSharePanel() {
    this.setData({
      showSharePanel: true
    });
    this.checkPanelOpen()
  },

  // 显示演示画布
  showDemoCanvas() {
    this.setData({
      showDemoCanvas: true,
      demoStep: 0,
      isPlaying: false,
      demoDescription: `${this.data.selectedNode.name}的基本操作演示`
    });
    // 延迟初始化画布，确保DOM已经渲染
    setTimeout(() => {
      this.initDemoCanvas();
    }, 100);
    this.checkPanelOpen()
  },

  // 显示添加节点面板
  showAddNodePanel() {
    this.setData({
      showAddNodePanel: true,
      newNodeName: '',
      newNodeTypeIndex: 0,
      newNodeDefinition: ''
    });
    this.checkPanelOpen()
  },

  // 检查节点是否有演示可用
  isNodeDemoAvailable(nodeName) {
    // 这里应该根据节点类型判断是否有演示
    // 暂时返回true，实际应该根据节点类型判断
    const demoNodes = ['栈', '队列', '二叉树', '链表', '堆', '图'];
    return demoNodes.includes(nodeName);
  },

  // 初始化演示画布
  initDemoCanvas() {
    demoCanvas = wx.createCanvasContext('demoCanvas');
    this.drawDemo();
  },

  // 绘制演示
  drawDemo() {
    if (!demoCanvas) return;
    
    // 清空画布
    demoCanvas.clearRect(0, 0, 600, 400);
    
    // 设置背景
    demoCanvas.setFillStyle('#0a0a0a');
    demoCanvas.fillRect(0, 0, 600, 400);
    
    // 根据当前步骤绘制不同内容
    const nodeName = this.data.selectedNode.name;
    const step = this.data.demoStep;
    
    switch (nodeName) {
      case '栈':
        this.drawStackDemo(step);
        break;
      case '队列':
        this.drawQueueDemo(step);
        break;
      case '二叉树':
        this.drawTreeDemo(step);
        break;
      default:
        this.drawDefaultDemo();
    }
    
    demoCanvas.draw();
  },

  // 绘制栈演示
  drawStackDemo(step) {
    const canvas = wx.createCanvasContext('demoCanvas');
    
    // 绘制栈的基础结构
    canvas.setFillStyle('#0a0a0a');
    canvas.fillRect(0, 0, 600, 400);
    
    // 绘制栈框
    canvas.setStrokeStyle('#1677ff');
    canvas.setLineWidth(3);
    canvas.strokeRect(200, 50, 200, 300);
    
    // 绘制栈底
    canvas.setFillStyle('#1677ff');
    canvas.fillRect(200, 350, 200, 3);
    
    // 根据步骤绘制不同内容
    switch (step) {
      case 0:
        // 初始状态
        canvas.setFillStyle('#ffffff');
        canvas.setFontSize(24);
        canvas.fillText('栈的初始状态', 250, 200);
        canvas.fillText('空栈', 280, 230);
        break;
        
      case 1:
        // 入栈操作
        canvas.setFillStyle('#52c41a');
        canvas.fillRect(220, 320, 160, 30);
        canvas.setFillStyle('#ffffff');
        canvas.setFontSize(20);
        canvas.fillText('数据A', 280, 342);
        canvas.fillText('入栈操作: push(数据A)', 220, 80);
        break;
        
      case 2:
        // 入栈完成
        canvas.setFillStyle('#52c41a');
        canvas.fillRect(220, 320, 160, 30);
        canvas.setFillStyle('#ffffff');
        canvas.setFontSize(20);
        canvas.fillText('数据A', 280, 342);
        canvas.fillText('入栈完成', 280, 80);
        break;
        
      case 3:
        // 出栈操作
        canvas.setFillStyle('#52c41a');
        canvas.fillRect(220, 320, 160, 30);
        canvas.setFillStyle('#ffffff');
        canvas.setFontSize(20);
        canvas.fillText('数据A', 280, 342);
        canvas.fillText('出栈操作: pop()', 220, 80);
        break;
        
      case 4:
        // 出栈完成
        canvas.setFillStyle('#ffffff');
        canvas.setFontSize(24);
        canvas.fillText('栈的最终状态', 250, 200);
        canvas.fillText('空栈', 280, 230);
        canvas.fillText('出栈完成', 280, 80);
        break;
    }
    
    canvas.draw();
  },

  // 绘制队列演示
  drawQueueDemo(step) {
    const canvas = wx.createCanvasContext('demoCanvas');
    
    // 绘制队列的基础结构
    canvas.setFillStyle('#0a0a0a');
    canvas.fillRect(0, 0, 600, 400);
    
    // 绘制队列框
    canvas.setStrokeStyle('#1677ff');
    canvas.setLineWidth(3);
    canvas.strokeRect(100, 150, 400, 100);
    
    // 绘制队头和队尾标识
    canvas.setFillStyle('#ffffff');
    canvas.setFontSize(20);
    canvas.fillText('队头', 80, 200);
    canvas.fillText('队尾', 520, 200);
    
    // 根据步骤绘制不同内容
    switch (step) {
      case 0:
        // 初始状态
        canvas.setFillStyle('#ffffff');
        canvas.setFontSize(24);
        canvas.fillText('队列的初始状态', 250, 100);
        canvas.fillText('空队列', 280, 200);
        break;
        
      case 1:
        // 入队操作
        canvas.setFillStyle('#52c41a');
        canvas.fillRect(400, 170, 80, 60);
        canvas.setFillStyle('#ffffff');
        canvas.setFontSize(20);
        canvas.fillText('数据A', 425, 205);
        canvas.fillText('入队操作: enqueue(数据A)', 200, 80);
        break;
        
      case 2:
        // 入队完成
        canvas.setFillStyle('#52c41a');
        canvas.fillRect(400, 170, 80, 60);
        canvas.setFillStyle('#ffffff');
        canvas.setFontSize(20);
        canvas.fillText('数据A', 425, 205);
        canvas.fillText('入队完成', 280, 80);
        break;
        
      case 3:
        // 出队操作
        canvas.setFillStyle('#52c41a');
        canvas.fillRect(400, 170, 80, 60);
        canvas.setFillStyle('#ffffff');
        canvas.setFontSize(20);
        canvas.fillText('数据A', 425, 205);
        canvas.fillText('出队操作: dequeue()', 200, 80);
        break;
        
      case 4:
        // 出队完成
        canvas.setFillStyle('#ffffff');
        canvas.setFontSize(24);
        canvas.fillText('队列的最终状态', 250, 100);
        canvas.fillText('空队列', 280, 200);
        canvas.fillText('出队完成', 280, 80);
        break;
    }
    
    canvas.draw();
  },

  // 绘制二叉树演示
  drawTreeDemo(step) {
    const canvas = wx.createCanvasContext('demoCanvas');
    
    // 绘制二叉树的基础结构
    canvas.setFillStyle('#0a0a0a');
    canvas.fillRect(0, 0, 600, 400);
    
    // 根据步骤绘制不同内容
    switch (step) {
      case 0:
        // 初始状态
        canvas.setFillStyle('#ffffff');
        canvas.setFontSize(24);
        canvas.fillText('二叉树的初始状态', 230, 100);
        canvas.fillText('空树', 280, 200);
        break;
        
      case 1:
        // 插入根节点
        canvas.setFillStyle('#1677ff');
        canvas.beginPath();
        canvas.arc(300, 100, 40, 0, 2 * Math.PI);
        canvas.fill();
        canvas.setFillStyle('#ffffff');
        canvas.setFontSize(20);
        canvas.fillText('A', 295, 105);
        canvas.fillText('插入根节点A', 250, 80);
        break;
        
      case 2:
        // 插入左子节点
        canvas.setFillStyle('#1677ff');
        canvas.beginPath();
        canvas.arc(300, 100, 40, 0, 2 * Math.PI);
        canvas.fill();
        canvas.beginPath();
        canvas.arc(200, 200, 30, 0, 2 * Math.PI);
        canvas.fill();
        canvas.setStrokeStyle('#ffffff');
        canvas.setLineWidth(2);
        canvas.beginPath();
        canvas.moveTo(260, 120);
        canvas.lineTo(230, 180);
        canvas.stroke();
        canvas.setFillStyle('#ffffff');
        canvas.setFontSize(20);
        canvas.fillText('A', 295, 105);
        canvas.fillText('B', 195, 205);
        canvas.fillText('插入左子节点B', 230, 80);
        break;
        
      case 3:
        // 插入右子节点
        canvas.setFillStyle('#1677ff');
        canvas.beginPath();
        canvas.arc(300, 100, 40, 0, 2 * Math.PI);
        canvas.fill();
        canvas.beginPath();
        canvas.arc(200, 200, 30, 0, 2 * Math.PI);
        canvas.fill();
        canvas.beginPath();
        canvas.arc(400, 200, 30, 0, 2 * Math.PI);
        canvas.fill();
        canvas.setStrokeStyle('#ffffff');
        canvas.setLineWidth(2);
        canvas.beginPath();
        canvas.moveTo(260, 120);
        canvas.lineTo(230, 180);
        canvas.stroke();
        canvas.beginPath();
        canvas.moveTo(340, 120);
        canvas.lineTo(370, 180);
        canvas.stroke();
        canvas.setFillStyle('#ffffff');
        canvas.setFontSize(20);
        canvas.fillText('A', 295, 105);
        canvas.fillText('B', 195, 205);
        canvas.fillText('C', 395, 205);
        canvas.fillText('插入右子节点C', 230, 80);
        break;
    }
    
    canvas.draw();
  },

  // 绘制默认演示
  drawDefaultDemo() {
    const canvas = wx.createCanvasContext('demoCanvas');
    
    canvas.setFillStyle('#0a0a0a');
    canvas.fillRect(0, 0, 600, 400);
    
    canvas.setFillStyle('#ffffff');
    canvas.setFontSize(24);
    canvas.fillText('暂无演示', 260, 200);
    
    canvas.draw();
  },

  // 上一步
  prevStep() {
    let step = this.data.demoStep;
    if (step > 0) {
      step--;
      this.setData({
        demoStep: step
      });
      this.updateDemoDescription(step);
      this.drawDemo();
    }
  },

  // 下一步
  nextStep() {
    let step = this.data.demoStep;
    const maxSteps = this.getMaxSteps();
    if (step < maxSteps) {
      step++;
      this.setData({
        demoStep: step
      });
      this.updateDemoDescription(step);
      this.drawDemo();
    }
  },

  // 播放/暂停
  togglePlay() {
    const isPlaying = !this.data.isPlaying;
    this.setData({
      isPlaying: isPlaying
    });
    
    if (isPlaying) {
      this.playAnimation();
    }
  },

  // 播放动画
  playAnimation() {
    if (!this.data.isPlaying) return;
    
    const step = this.data.demoStep;
    const maxSteps = this.getMaxSteps();
    
    if (step < maxSteps) {
      setTimeout(() => {
        this.nextStep();
        this.playAnimation();
      }, 1500);
    } else {
      this.setData({
        isPlaying: false
      });
    }
  },

  // 获取最大步骤数
  getMaxSteps() {
    const nodeName = this.data.selectedNode.name;
    switch (nodeName) {
      case '栈':
      case '队列':
        return 4;
      case '二叉树':
        return 3;
      default:
        return 0;
    }
  },

  // 更新演示描述
  updateDemoDescription(step) {
    const nodeName = this.data.selectedNode.name;
    let description = '';
    
    switch (nodeName) {
      case '栈':
        switch (step) {
          case 0:
            description = '栈的初始状态为空栈，没有任何元素。';
            break;
          case 1:
            description = '执行入栈操作：push(数据A)，将数据A添加到栈顶。';
            break;
          case 2:
            description = '入栈完成，数据A现在位于栈顶。';
            break;
          case 3:
            description = '执行出栈操作：pop()，将栈顶元素数据A移除。';
            break;
          case 4:
            description = '出栈完成，栈恢复为空栈。栈的特性是先进后出（LIFO）。';
            break;
        }
        break;
        
      case '队列':
        switch (step) {
          case 0:
            description = '队列的初始状态为空队列，没有任何元素。';
            break;
          case 1:
            description = '执行入队操作：enqueue(数据A)，将数据A添加到队尾。';
            break;
          case 2:
            description = '入队完成，数据A现在位于队尾。';
            break;
          case 3:
            description = '执行出队操作：dequeue()，将队头元素数据A移除。';
            break;
          case 4:
            description = '出队完成，队列恢复为空队列。队列的特性是先进先出（FIFO）。';
            break;
        }
        break;
        
      case '二叉树':
        switch (step) {
          case 0:
            description = '二叉树的初始状态为空树，没有任何节点。';
            break;
          case 1:
            description = '插入根节点A，作为树的第一个节点。';
            break;
          case 2:
            description = '插入左子节点B，作为根节点A的左孩子。';
            break;
          case 3:
            description = '插入右子节点C，作为根节点A的右孩子。二叉树每个节点最多有两个子节点。';
            break;
        }
        break;
    }
    
    this.setData({
      demoDescription: description
    });
  },

  // 节点名称输入
  onNodeNameInput(e) {
    this.setData({
      newNodeName: e.detail.value
    });
  },

  // 节点类型选择
  onNodeTypeChange(e) {
    this.setData({
      newNodeTypeIndex: parseInt(e.detail.value)
    });
  },

  // 节点定义输入
  onNodeDefinitionInput(e) {
    this.setData({
      newNodeDefinition: e.detail.value
    });
  },

  // 提交添加节点
  submitAddNode() {
    const { newNodeName, newNodeTypeIndex, newNodeDefinition, nodeTypes } = this.data;

    if (!newNodeName.trim()) {
      wx.showToast({
        title: '请输入节点名称',
        icon: 'none'
      });
      return;
    }

    const app = getApp();
    const nodeType = nodeTypes[newNodeTypeIndex].value;

    wx.showLoading({ title: '添加中...' });

    wx.request({
      url: `${app.globalData.baseUrl}/api/knowledge-graph/node`,
      method: 'POST',
      header: {
        'content-type': 'application/json'
      },
      data: {
        name: newNodeName.trim(),
        node_type: nodeType,
        definition: newNodeDefinition.trim()
      },
      success: (res) => {
        wx.hideLoading();
        if (res.data.code === 0) {
          wx.showToast({
            title: '添加成功',
            icon: 'success'
          });
          this.closeAddNodePanel();
          // 刷新知识图谱数据
          this.fetchKnowledgeGraphData();
        } else {
          wx.showToast({
            title: res.data.detail || '添加失败',
            icon: 'none'
          });
        }
      },
      fail: () => {
        wx.hideLoading();
        wx.showToast({
          title: '网络异常',
          icon: 'none'
        });
      }
    });
  },

});