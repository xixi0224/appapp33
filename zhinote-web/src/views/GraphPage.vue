<template>
  <div class="graph-container">
    <div class="page-header">
      <button class="back-btn" @click="goToHome">
        <el-icon><ArrowLeft /></el-icon>
        返回首页
      </button>
      <div class="header-info">
        <h1 class="page-title">知识图谱</h1>
        <p class="page-subtitle">课程知识点关系可视化</p>
      </div>
    </div>

    <div class="graph-main">
      <div class="left-panel">
        <div class="stat-card">
          <h3 class="card-title">图谱概览</h3>
          <div class="stats-grid">
            <div class="stat-item">
              <div class="stat-icon total">
                <el-icon><FolderOpened /></el-icon>
              </div>
              <div class="stat-content">
                <div class="stat-value">{{ stats.total }}</div>
                <div class="stat-label">知识点总数</div>
              </div>
            </div>
            <div class="stat-item">
              <div class="stat-icon relations">
                <el-icon><Link /></el-icon>
              </div>
              <div class="stat-content">
                <div class="stat-value">{{ stats.relations }}</div>
                <div class="stat-label">依赖关系</div>
              </div>
            </div>
            <div class="stat-item">
              <div class="stat-icon mastered">
                <el-icon><Check /></el-icon>
              </div>
              <div class="stat-content">
                <div class="stat-value mastered">{{ stats.mastered }}</div>
                <div class="stat-label">已掌握</div>
              </div>
            </div>
            <div class="stat-item">
              <div class="stat-icon weak">
                <el-icon><Warning /></el-icon>
              </div>
              <div class="stat-content">
                <div class="stat-value weak">{{ stats.weak }}</div>
                <div class="stat-label">薄弱点</div>
              </div>
            </div>
          </div>
        </div>

        <div class="legend-card">
          <h3 class="card-title">图例说明</h3>
          <div class="legend-list">
            <div class="legend-item">
              <div class="legend-color" style="background: #94a3b8;"></div>
              <span>未学习</span>
            </div>
            <div class="legend-item">
              <div class="legend-color" style="background: #1e40af;"></div>
              <span>掌握度 > 80%</span>
            </div>
            <div class="legend-item">
              <div class="legend-color" style="background: #3b82f6;"></div>
              <span>掌握度 60-80%</span>
            </div>
            <div class="legend-item">
              <div class="legend-color" style="background: #f59e0b;"></div>
              <span>掌握度 40-60%</span>
            </div>
            <div class="legend-item">
              <div class="legend-color" style="background: #ef4444;"></div>
              <span>掌握度 < 40%</span>
            </div>
          </div>
        </div>
      </div>

      <div class="right-panel">
        <div class="graph-toolbar">
          <div class="toolbar-left">
            <button class="toolbar-btn" @click="refreshGraph">
              <el-icon><Refresh /></el-icon>
              刷新
            </button>
            <button class="toolbar-btn" @click="resetGraph">
              <el-icon><ZoomOut /></el-icon>
              重置视角
            </button>
            <button class="toolbar-btn" @click="zoomIn">
              <el-icon><Plus /></el-icon>
              放大
            </button>
            <button class="toolbar-btn" @click="zoomOut">
              <el-icon><Minus /></el-icon>
              缩小
            </button>
            <button class="toolbar-btn upload-btn" @click="triggerFileSelect">
              <el-icon><Upload /></el-icon>
              上传文件
            </button>
            <button class="toolbar-btn clear-btn" @click="clearGraph">
              <el-icon><Delete /></el-icon>
              清空图谱
            </button>
          </div>
          <div class="toolbar-right">
            <el-input
              v-model="searchKeyword"
              placeholder="搜索知识点..."
              size="small"
              class="search-input"
              @keyup.enter="searchNode"
              clearable
            />
            <input 
              type="file" 
              ref="fileInput" 
              class="file-input"
              :accept="'.pdf,.doc,.docx,.txt,.md'"
              multiple
              @change="handleFileSelect"
            />
          </div>
        </div>

        <div class="graph-canvas-wrapper">
          <div ref="graphRef" class="graph-canvas"></div>
          <div class="empty-state" v-if="nodes.length === 0">
            <div class="empty-icon">📊</div>
            <p>暂无知识点数据，请上传课程资料生成知识图谱</p>
            
            <div v-if="isUploading" class="upload-status-container">
              <div class="upload-status-text">{{ uploadStatus }}</div>
              <div class="upload-progress-bar">
                <el-progress 
                  :percentage="uploadProgress" 
                  :status="uploadProgress === 100 ? 'success' : 'loading'"
                  :stroke-width="12"
                />
              </div>
            </div>
            
            <div v-else
              class="upload-area"
              :class="{ 'drag-over': isDragging }"
              @dragover.prevent="isDragging = true"
              @dragleave="isDragging = false"
              @drop.prevent="handleDrop"
            >
              <div class="upload-icon">📁</div>
              <div class="upload-text">点击或拖拽文件到此处上传</div>
              <div class="upload-hint">支持 PDF、Word、TXT、Markdown 格式</div>
              <input 
                type="file" 
                ref="fileInput" 
                class="file-input"
                :accept="'.pdf,.doc,.docx,.txt,.md'"
                multiple
                @change="handleFileSelect"
              />
              <el-button type="primary" @click="triggerFileSelect">
                <el-icon><Upload /></el-icon>
                选择文件
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <el-dialog v-model="showDetailModal" title="知识点详情" width="700px" append-to-body>
      <div v-if="selectedPoint" class="point-detail">
        <div class="detail-header">
          <div class="point-title">{{ selectedPoint.name }}</div>
          <div class="point-tags">
            <span class="tag" :class="difficultyClass">{{ getDifficultyLabel(selectedPoint.difficulty) }}</span>
            <span v-if="selectedPoint.is_key" class="tag key">重点</span>
            <span v-if="selectedPoint.is_exam_point" class="tag exam">考点</span>
          </div>
        </div>

        <div class="detail-stats">
          <div class="stat-row">
            <span class="stat-label">章节</span>
            <span class="stat-value">{{ selectedPoint.chapter || '-' }}</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">科目</span>
            <span class="stat-value">{{ selectedPoint.subject || '-' }}</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">掌握度</span>
            <span class="stat-value" :class="masteryClass">{{ selectedPoint.mastery }}%</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">做题数</span>
            <span class="stat-value">{{ selectedPoint.total_questions || 0 }}题</span>
          </div>
        </div>

        <div class="detail-section">
          <h4>定义</h4>
          <p class="definition-text">{{ selectedPoint.definition || '暂无定义' }}</p>
        </div>

        <div class="detail-section" v-if="selectedPoint.prerequisites && selectedPoint.prerequisites.length > 0">
          <h4>前置依赖</h4>
          <div class="prerequisite-tags">
            <span v-for="prereq in selectedPoint.prerequisites" :key="prereq" class="prereq-tag">{{ prereq }}</span>
          </div>
        </div>

        <div class="detail-section" v-if="selectedPoint.mistakes && selectedPoint.mistakes.length > 0">
          <h4>错因记录</h4>
          <div class="mistake-list">
            <div v-for="mistake in selectedPoint.mistakes.slice(0, 3)" :key="mistake.id" class="mistake-item">
              <div class="mistake-question">{{ mistake.question?.slice(0, 50) }}...</div>
              <div class="mistake-info">
                <span class="mistake-tag">错误类型: {{ mistake.error_tags?.join(', ') || '-' }}</span>
                <span class="mistake-date">{{ formatDate(mistake.created_at) }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="detail-section" v-if="selectedPoint.questions && selectedPoint.questions.length > 0">
          <h4>配套习题</h4>
          <div class="question-list">
            <div v-for="q in selectedPoint.questions.slice(0, 3)" :key="q.id" class="question-item">
              <div class="question-text">{{ q.question?.slice(0, 50) }}...</div>
              <div class="question-difficulty">{{ getDifficultyLabel(q.difficulty) }}</div>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <button class="btn-secondary" @click="showDetailModal = false">关闭</button>
        <button class="btn-primary" @click="generateResource">
          <el-icon><Brush /></el-icon>
          生成学习资源
        </button>
        <button v-if="selectedPoint && selectedPoint.mastery < 40" class="btn-danger" @click="addToLearningPath">
          <el-icon><MapLocation /></el-icon>
          加入补弱路径
        </button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  ArrowLeft, FolderOpened, Link, Check, Warning,
  Refresh, ZoomOut, Plus, Minus, Brush, MapLocation, Upload, Delete
} from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import { ElMessage } from 'element-plus'

const router = useRouter()

const graphRef = ref(null)
const searchKeyword = ref('')
const showDetailModal = ref(false)
const selectedPoint = ref(null)
const fileInput = ref(null)
const isDragging = ref(false)
const uploadProgress = ref(0)
const isUploading = ref(false)
const uploadStatus = ref('')
let chart = null

const nodes = ref([])
const links = ref([])
const stats = ref({ total: 0, relations: 0, mastered: 0, weak: 0 })

const difficultyMap = {
  'easy': '简单',
  'medium': '中等',
  'hard': '困难'
}

const getDifficultyLabel = (diff) => {
  return difficultyMap[diff] || '-'
}

const difficultyClass = computed(() => {
  if (!selectedPoint.value) return ''
  return `difficulty-${selectedPoint.value.difficulty}`
})

const masteryClass = computed(() => {
  if (!selectedPoint.value) return ''
  const m = selectedPoint.value.mastery
  if (m >= 80) return 'mastered-high'
  if (m >= 60) return 'mastered-medium'
  if (m >= 40) return 'mastered-low'
  return 'mastered-weak'
})

const getMasteryColor = (mastery) => {
  if (mastery === null) return '#94a3b8'
  if (mastery >= 80) return '#1e40af'
  if (mastery >= 60) return '#3b82f6'
  if (mastery >= 40) return '#f59e0b'
  return '#ef4444'
}

const loadGraphData = async () => {
  try {
    const response = await fetch('/api/agent/knowledge-graph', {
      credentials: 'include'
    })
    const data = await response.json()

    if (data.code === 0 && data.data) {
      nodes.value = data.data.nodes || []
      links.value = data.data.links || []
      stats.value = data.data.stats || { total: 0, relations: 0, mastered: 0, weak: 0 }

      if (nodes.value.length > 0) {
        renderGraph()
      }
    }
  } catch (error) {
    console.error('Load graph data error:', error)
  }
}

const renderGraph = () => {
  if (!graphRef.value) return

  if (chart) {
    chart.dispose()
  }

  chart = echarts.init(graphRef.value)

  const option = {
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#e2e8f0',
      borderWidth: 1,
      textStyle: {
        color: '#374151'
      },
      formatter: (params) => {
        if (params.dataType === 'node') {
          const node = params.data
          const masteryText = node.mastery !== null 
            ? `<span style="color:${getMasteryColor(node.mastery)};font-weight:bold;">${node.mastery}%</span>`
            : '<span style="color:#94a3b8;font-weight:bold;">未学习</span>'
          return `<div style="font-weight:bold;margin-bottom:8px;font-size:14px;">${node.name}</div>
                  <div style="margin-bottom:4px;">章节: ${node.chapter || '-'}</div>
                  <div style="margin-bottom:4px;">难度: ${getDifficultyLabel(node.difficulty)}</div>
                  <div>掌握度: ${masteryText}</div>`
        } else if (params.dataType === 'edge') {
          return '<div style="color:#64748b;">前置依赖关系</div>'
        }
        return ''
      }
    },
    series: [
      {
        type: 'graph',
        layout: 'force',
        roam: true,
        draggable: true,
        label: {
          show: true,
          fontSize: 12,
          color: '#374151',
          fontWeight: 500,
          formatter: (params) => {
            return params.name
          }
        },
        lineStyle: {
          color: '#94a3b8',
          width: 1.5,
          curveness: 0.2,
          opacity: 0.6
        },
        emphasis: {
          focus: 'adjacency',
          lineStyle: {
            width: 3,
            color: '#3b82f6'
          },
          itemStyle: {
            shadowBlur: 20,
            shadowColor: 'rgba(59, 130, 246, 0.4)'
          }
        },
        force: {
          repulsion: 400,
          gravity: 0.1,
          edgeLength: [80, 200],
          layoutAnimation: true
        },
        data: nodes.value.map(node => ({
          id: node.id,
          name: node.name,
          symbolSize: node.mastery !== null ? 35 + node.mastery / 2.5 : 35,
          itemStyle: {
            color: getMasteryColor(node.mastery),
            borderColor: '#fff',
            borderWidth: 2,
            shadowBlur: 15,
            shadowColor: getMasteryColor(node.mastery) + '40'
          },
          ...node
        })),
        links: links.value.map(link => ({
          source: link.source,
          target: link.target,
          lineStyle: {
            curveness: 0.15
          }
        }))
      }
    ]
  }

  chart.setOption(option)

  chart.on('click', async (params) => {
    if (params.dataType === 'node') {
      await loadPointDetail(params.data.name)
    }
  })
}

const loadPointDetail = async (pointName) => {
  try {
    const response = await fetch(`/api/agent/knowledge-point/detail?point_name=${encodeURIComponent(pointName)}`, {
      credentials: 'include'
    })
    const data = await response.json()
    if (data.code === 0) {
      selectedPoint.value = data.data
      showDetailModal.value = true
    }
  } catch (error) {
    console.error('Load point detail error:', error)
  }
}

const refreshGraph = () => {
  selectedPoint.value = null
  showDetailModal.value = false
  loadGraphData()
  ElMessage.success('图谱已刷新')
}

const resetGraph = () => {
  if (chart) {
    chart.dispatchAction({
      type: 'restore'
    })
  }
}

const zoomIn = () => {
  if (chart) {
    const currentOption = chart.getOption()
    const currentZoom = currentOption.series[0]?.zoom || 1
    chart.setOption({
      series: [{
        zoom: Math.min(currentZoom * 1.2, 3)
      }]
    })
  }
}

const zoomOut = () => {
  if (chart) {
    const currentOption = chart.getOption()
    const currentZoom = currentOption.series[0]?.zoom || 1
    chart.setOption({
      series: [{
        zoom: Math.max(currentZoom * 0.8, 0.2)
      }]
    })
  }
}

const searchNode = () => {
  if (!searchKeyword.value || !chart) return

  const node = nodes.value.find(n =>
    n.name.toLowerCase().includes(searchKeyword.value.toLowerCase())
  )

  if (node) {
    const nodeIndex = nodes.value.indexOf(node)
    chart.dispatchAction({
      type: 'focusNodeAdjacency',
      seriesIndex: 0,
      dataIndex: nodeIndex
    })
    loadPointDetail(node.name)
  } else {
    ElMessage.warning('未找到匹配的知识点')
  }
}

const generateResource = () => {
  if (!selectedPoint.value) return
  router.push('/resource')
  showDetailModal.value = false
}

const addToLearningPath = () => {
  if (!selectedPoint.value) return
  router.push('/path')
  showDetailModal.value = false
}

const triggerFileSelect = () => {
  fileInput.value?.click()
}

const handleFileSelect = (event) => {
  const files = Array.from(event.target.files)
  if (files.length > 0) {
    uploadFiles(files)
  }
}

const handleDrop = (event) => {
  isDragging.value = false
  const files = Array.from(event.dataTransfer.files)
  if (files.length > 0) {
    uploadFiles(files)
  }
}

const uploadFiles = async (files) => {
  isUploading.value = true
  uploadProgress.value = 0
  uploadStatus.value = `正在上传 ${files.length} 个文件...`
  let uploadedCount = 0
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    uploadStatus.value = `正在上传: ${file.name} (${i + 1}/${files.length})`
    
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      const response = await fetch('/api/agent/document/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      })
      
      const data = await response.json()
      if (data.code === 0) {
        uploadedCount++
        uploadProgress.value = Math.round((uploadedCount / files.length) * 100)
        uploadStatus.value = `${file.name} 上传成功！正在分析内容...`
        
        await new Promise(resolve => setTimeout(resolve, 300))
      } else {
        ElMessage.error(`上传失败: ${data.message || file.name}`)
      }
    } catch (error) {
      ElMessage.error(`上传失败: ${file.name} - ${error.message}`)
    }
  }
  
  if (uploadedCount > 0) {
    uploadStatus.value = `成功上传 ${uploadedCount} 个文件，正在生成知识图谱...`
    ElMessage.success(`成功上传 ${uploadedCount} 个文件！`)
    
    setTimeout(() => {
      loadGraphData()
      uploadProgress.value = 0
      uploadStatus.value = ''
      isUploading.value = false
    }, 1500)
  } else {
    isUploading.value = false
    uploadStatus.value = ''
  }
}

const clearGraph = async () => {
  try {
    const response = await fetch('/api/agent/graph/clear', {
      method: 'DELETE',
      credentials: 'include'
    })
    const data = await response.json()
    if (data.code === 0) {
      ElMessage.success('图谱已清空')
      nodes.value = []
      links.value = []
      stats.value = { total: 0, relations: 0, mastered: 0, weak: 0 }
      if (chart) {
        chart.setOption({
          series: [{
            data: [],
            links: []
          }]
        })
      }
    } else {
      ElMessage.error(data.message || '清空失败')
    }
  } catch (error) {
    ElMessage.error(`清空失败: ${error.message}`)
  }
}

const goToHome = () => {
  router.push('/')
}

const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('zh-CN')
}

watch(searchKeyword, (newVal) => {
  if (!newVal) {
    resetGraph()
  }
})

onMounted(() => {
  loadGraphData()

  window.addEventListener('resize', () => {
    chart?.resize()
  })
})

onUnmounted(() => {
  chart?.dispose()
})
</script>

<style scoped>
.graph-container {
  height: 100%;
  padding: 24px;
  background: #f8fafc;
  display: flex;
  flex-direction: column;
}

.page-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  color: #475569;
  cursor: pointer;
  transition: all 0.2s;
}

.back-btn:hover {
  background: #f1f5f9;
  color: #3b82f6;
}

.header-info {
  flex: 1;
}

.page-title {
  font-size: 24px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 4px 0;
}

.page-subtitle {
  font-size: 14px;
  color: #64748b;
  margin: 0;
}

.graph-main {
  flex: 1;
  display: flex;
  gap: 24px;
  min-height: 0;
}

.left-panel {
  width: 280px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.stat-card, .legend-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 16px 0;
  padding-bottom: 12px;
  border-bottom: 1px solid #f1f5f9;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 8px;
  background: #f8fafc;
  border-radius: 12px;
}

.stat-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  color: white;
  margin-bottom: 8px;
}

.stat-icon.total { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); }
.stat-icon.relations { background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); }
.stat-icon.mastered { background: linear-gradient(135deg, #10b981 0%, #059669 100%); }
.stat-icon.weak { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); }

.stat-content {
  text-align: center;
}

.stat-value {
  font-size: 20px;
  font-weight: 700;
  color: #1e293b;
}

.stat-value.mastered {
  color: #10b981;
}

.stat-value.weak {
  color: #ef4444;
}

.stat-label {
  font-size: 12px;
  color: #64748b;
}

.legend-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  color: #475569;
}

.legend-color {
  width: 20px;
  height: 20px;
  border-radius: 6px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.right-panel {
  flex: 1;
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.graph-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 16px;
  border-bottom: 1px solid #f1f5f9;
  margin-bottom: 16px;
}

.toolbar-left {
  display: flex;
  gap: 8px;
}

.toolbar-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: #f1f5f9;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  color: #475569;
  cursor: pointer;
  transition: all 0.2s;
}

.toolbar-btn:hover {
  background: #e2e8f0;
  color: #3b82f6;
}

.upload-btn {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
}

.upload-btn:hover {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  color: white;
}

.clear-btn {
  background: #fef2f2;
  color: #dc2626;
}

.clear-btn:hover {
  background: #fee2e2;
  color: #b91c1c;
}

.search-input {
  width: 220px;
}

.graph-canvas-wrapper {
  flex: 1;
  position: relative;
  min-height: 0;
}

.graph-canvas {
  width: 100%;
  height: 100%;
  min-height: 500px;
}

.empty-state {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.empty-state p {
  margin-bottom: 20px;
  font-size: 15px;
}

.btn-primary {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 24px;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.btn-secondary {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: white;
  color: #475569;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary:hover {
  background: #f1f5f9;
}

.btn-danger {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-danger:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}

.point-detail {
  padding: 8px;
}

.detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.point-title {
  font-size: 20px;
  font-weight: 700;
  color: #1e293b;
}

.point-tags {
  display: flex;
  gap: 8px;
}

.tag {
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
}

.tag.difficulty-easy { background: #d1fae5; color: #065f46; }
.tag.difficulty-medium { background: #feebc8; color: #92400e; }
.tag.difficulty-hard { background: #fee2e2; color: #991b1b; }
.tag.key { background: #dbeafe; color: #1e40af; }
.tag.exam { background: #fef3c7; color: #b45309; }

.detail-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 20px;
  padding: 16px;
  background: #f8fafc;
  border-radius: 12px;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-row .stat-label {
  font-size: 13px;
  color: #64748b;
}

.stat-row .stat-value {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
}

.stat-row .stat-value.mastered-high { color: #065f46; }
.stat-row .stat-value.mastered-medium { color: #1e40af; }
.stat-row .stat-value.mastered-low { color: #b45309; }
.stat-row .stat-value.mastered-weak { color: #dc2626; }

.detail-section {
  margin-bottom: 20px;
}

.detail-section h4 {
  font-size: 14px;
  font-weight: 600;
  color: #475569;
  margin: 0 0 10px 0;
}

.definition-text {
  font-size: 14px;
  color: #374151;
  line-height: 1.6;
  margin: 0;
  padding: 12px;
  background: #f8fafc;
  border-radius: 8px;
}

.prerequisite-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.prereq-tag {
  padding: 6px 12px;
  background: #f1f5f9;
  border-radius: 20px;
  font-size: 13px;
  color: #475569;
}

.mistake-list, .question-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.mistake-item, .question-item {
  padding: 12px;
  background: #fef2f2;
  border-radius: 8px;
}

.mistake-question, .question-text {
  font-size: 13px;
  color: #374151;
  margin: 0 0 8px 0;
}

.mistake-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.mistake-tag {
  font-size: 12px;
  color: #dc2626;
}

.mistake-date {
  font-size: 12px;
  color: #94a3b8;
}

.question-difficulty {
  font-size: 12px;
  color: #64748b;
}

.upload-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px;
  border: 2px dashed #cbd5e1;
  border-radius: 16px;
  background: #f8fafc;
  cursor: pointer;
  transition: all 0.3s;
  margin: 16px 0;
  max-width: 400px;
}

.upload-area:hover,
.upload-area.drag-over {
  border-color: #3b82f6;
  background: #eff6ff;
}

.upload-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.upload-text {
  font-size: 15px;
  font-weight: 500;
  color: #475569;
  margin-bottom: 8px;
}

.upload-hint {
  font-size: 13px;
  color: #94a3b8;
  margin-bottom: 16px;
}

.file-input {
  display: none;
}

.upload-status-container {
  margin-top: 20px;
  padding: 20px;
  background: #f8fafc;
  border-radius: 12px;
  width: 400px;
}

.upload-status-text {
  font-size: 14px;
  color: #475569;
  margin-bottom: 12px;
  text-align: center;
}

.upload-progress-bar {
  width: 100%;
}

.upload-progress {
  margin-top: 16px;
  width: 300px;
}

.upload-progress .progress-text {
  display: block;
  text-align: center;
  margin-top: 8px;
  font-size: 13px;
  color: #64748b;
}

@media (max-width: 1200px) {
  .graph-main {
    flex-direction: column;
  }
  .left-panel {
    width: 100%;
    flex-direction: row;
    flex-wrap: wrap;
  }
  .stat-card, .legend-card {
    flex: 1;
    min-width: 280px;
  }
}
</style>