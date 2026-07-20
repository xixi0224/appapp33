<template>
  <div class="knowledge-page">
    <div class="page-header">
      <el-button type="text" @click="goToHome" class="back-btn">
        <el-icon><ArrowLeft /></el-icon>
        返回首页
      </el-button>
      <div class="page-title">📚 知识库管理</div>
      <div class="page-subtitle">上传课程资料，构建智能知识库</div>
    </div>
    
    <div class="card upload-section">
      <h3 class="card-title">📤 上传文件</h3>
      <div 
        class="upload-area"
        :class="{ 'drag-over': isDragging }"
        @dragover.prevent="isDragging = true"
        @dragleave="isDragging = false"
        @drop.prevent="handleDrop"
      >
        <div class="upload-icon">📁</div>
        <div class="upload-text">点击或拖拽文件到此处上传</div>
        <div class="upload-hint">支持 PDF、Word、TXT、Markdown、PPT 格式，单文件不超过 50MB</div>
        <input 
          type="file" 
          ref="fileInput" 
          class="file-input"
          :accept="acceptTypes"
          multiple
          @change="handleFileSelect"
        />
        <el-button type="primary" @click="triggerFileSelect">
          <el-icon><Upload /></el-icon>
          选择文件
        </el-button>
      </div>
      <div v-if="uploadProgress > 0 && uploadProgress < 100" class="upload-progress">
        <el-progress :percentage="uploadProgress" status="success" />
        <span class="progress-text">{{ uploadProgress }}%</span>
      </div>
    </div>
    
    <div class="card files-section">
      <div class="section-header">
        <h3 class="card-title">📋 已上传文件</h3>
        <div class="header-actions">
          <el-input 
            v-model="searchKeyword" 
            placeholder="搜索文件..."
            style="width: 200px;"
            prefix-icon="Search"
          />
        </div>
      </div>
      
      <el-table :data="filteredFiles" border stripe>
        <el-table-column prop="name" label="文件名" width="280" show-overflow-tooltip />
        <el-table-column prop="size" label="大小" width="100" />
        <el-table-column prop="type" label="类型" width="80">
          <template #default="{ row }">
            <el-tag :type="getFileTypeTag(row.type)">{{ row.type }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="处理状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusTag(row.status)" size="small">
              {{ getStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="topics_count" label="知识点数" width="90">
          <template #default="{ row }">
            <span :class="{ 'highlight': row.topics_count > 0 }">{{ row.topics_count }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="subject" label="科目" width="100" show-overflow-tooltip />
        <el-table-column prop="uploadTime" label="上传时间" width="160" />
        <el-table-column label="操作" width="320">
          <template #default="{ row }">
            <el-button size="small" @click="viewFile(row)">📄 查看</el-button>
            <el-button 
              v-if="row.status === 'processed' && row.topics_count > 0" 
              size="small" 
              type="success" 
              @click="viewKnowledgePoints(row)"
            >
              📊 知识点
            </el-button>
            <el-button 
              size="small" 
              type="primary" 
              @click="extractTopics(row)" 
              :loading="extractingId === row.id"
            >
              {{ row.status === 'processed' ? '🔄 重提' : '🎯 提取' }}
            </el-button>
            <el-button size="small" type="danger" @click="deleteFile(row)">🗑️ 删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <div v-if="filteredFiles.length === 0" class="empty-files">
        <el-icon size="48" style="color: #c0c4cc;">📄</el-icon>
        <p>暂无上传文件，请上传课程资料构建知识库</p>
      </div>
    </div>
    
    <div class="card stats-section">
      <h3 class="card-title">📊 知识库统计</h3>
      <el-row :gutter="16">
        <el-col :span="6">
          <div class="stat-box">
            <div class="stat-icon">📄</div>
            <div class="stat-value">{{ stats.total_docs }}</div>
            <div class="stat-label">总文档数</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-box">
            <div class="stat-icon">✅</div>
            <div class="stat-value">{{ stats.processed_docs }}</div>
            <div class="stat-label">已处理</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-box">
            <div class="stat-icon">🎯</div>
            <div class="stat-value">{{ stats.total_topics }}</div>
            <div class="stat-label">知识点数</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-box">
            <div class="stat-icon">📚</div>
            <div class="stat-value">{{ stats.subject_count }}</div>
            <div class="stat-label">科目数</div>
          </div>
        </el-col>
      </el-row>
      
      <div class="charts-row">
        <div class="chart-box">
          <h4 class="chart-title">📈 知识点分布</h4>
          <div ref="subjectChartRef" class="chart-container"></div>
        </div>
        <div class="chart-box">
          <h4 class="chart-title">📉 难度分布</h4>
          <div ref="difficultyChartRef" class="chart-container"></div>
        </div>
      </div>
    </div>
    
    <el-dialog 
      v-model="showPreview" 
      :title="`📄 ${previewData?.filename}`" 
      width="90%" 
      top="2vh"
    >
      <div v-if="previewData" class="document-view">
        <div class="doc-info">
          <div class="doc-meta">
            <span class="meta-item">类型：{{ previewData.file_type?.toUpperCase() }}</span>
            <span class="meta-item">大小：{{ formatSize(previewData.file_size) }}</span>
            <span class="meta-item">状态：{{ getStatusLabel(previewData.status) }}</span>
            <span class="meta-item">知识点：{{ previewData.topics_count || 0 }} 个</span>
          </div>
        </div>
        <div class="doc-content">
          <pre class="text-content">{{ previewData.content || '文件内容为空' }}</pre>
        </div>
      </div>
    </el-dialog>
    
    <el-dialog 
      v-model="showKnowledgePoints" 
      :title="`🎯 知识点 - ${currentFile?.name}`" 
      width="90%" 
      top="2vh"
    >
      <div v-if="knowledgePoints.length > 0" class="knowledge-panel">
        <div class="knowledge-toolbar">
          <el-input 
            v-model="pointSearch" 
            placeholder="搜索知识点..."
            style="width: 250px;"
            prefix-icon="Search"
          />
          <el-select v-model="pointFilter" placeholder="筛选难度">
            <el-option label="全部" value="" />
            <el-option label="简单" value="easy" />
            <el-option label="中等" value="medium" />
            <el-option label="困难" value="hard" />
          </el-select>
        </div>
        
        <div class="knowledge-list">
          <div 
            v-for="point in filteredKnowledgePoints" 
            :key="point.id" 
            class="knowledge-card"
          >
            <div class="knowledge-header">
              <div class="point-title-row">
                <span class="point-name">{{ point.name }}</span>
                <div class="point-badges">
                  <el-tag v-if="point.is_key" type="danger" size="small">重点</el-tag>
                  <el-tag v-if="point.is_exam_point" type="primary" size="small">考点</el-tag>
                  <el-tag :type="getDifficultyTag(point.difficulty)" size="small">
                    {{ getDifficultyLabel(point.difficulty) }}
                  </el-tag>
                </div>
              </div>
              <div class="point-meta">
                <span>科目：{{ point.subject || '-' }}</span>
                <span>章节：{{ point.chapter || '-' }}</span>
              </div>
            </div>
            <div class="knowledge-body">
              <div class="point-definition">
                <h5>📖 定义/原理</h5>
                <p>{{ point.definition || '暂无详细解释' }}</p>
              </div>
              <div v-if="point.error_tags && point.error_tags.length > 0" class="point-tags">
                <h5>⚠️ 易错标签</h5>
                <el-tag v-for="tag in point.error_tags" :key="tag" type="warning" size="small">{{ tag }}</el-tag>
              </div>
              <div v-if="point.prerequisites && point.prerequisites.length > 0" class="point-prereq">
                <h5>🔗 前置依赖</h5>
                <span>{{ point.prerequisites.join(', ') }}</span>
              </div>
            </div>
            <div class="knowledge-footer">
              <el-button size="small" @click="editKnowledgePoint(point)">✏️ 编辑</el-button>
              <el-button size="small" type="danger" @click="deleteKnowledgePoint(point)">🗑️ 删除</el-button>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="empty-knowledge">
        <el-icon size="48" style="color: #c0c4cc;">🎯</el-icon>
        <p>暂无知识点，请先提取知识点</p>
      </div>
    </el-dialog>
    
    <el-dialog 
      v-model="showEditPoint" 
      :title="editingPoint ? '✏️ 编辑知识点' : '➕ 添加知识点'" 
      width="600px"
    >
      <el-form :model="editForm" label-width="100px">
        <el-form-item label="知识点名称">
          <el-input v-model="editForm.name" placeholder="请输入知识点名称" />
        </el-form-item>
        <el-form-item label="科目">
          <el-input v-model="editForm.subject" placeholder="请输入科目" />
        </el-form-item>
        <el-form-item label="章节">
          <el-input v-model="editForm.chapter" placeholder="请输入章节" />
        </el-form-item>
        <el-form-item label="难度">
          <el-select v-model="editForm.difficulty">
            <el-option label="简单" value="easy" />
            <el-option label="中等" value="medium" />
            <el-option label="困难" value="hard" />
          </el-select>
        </el-form-item>
        <el-form-item label="定义/原理">
          <el-input v-model="editForm.definition" type="textarea" :rows="4" placeholder="请输入定义或原理" />
        </el-form-item>
        <el-form-item label="标记">
          <el-checkbox v-model="editForm.is_key">重点</el-checkbox>
          <el-checkbox v-model="editForm.is_exam_point">考点</el-checkbox>
        </el-form-item>
        <el-form-item label="易错标签">
          <el-input v-model="editForm.error_tags_str" placeholder="多个标签用逗号分隔" />
        </el-form-item>
      </el-form>
      <div class="dialog-footer">
        <el-button @click="showEditPoint = false">取消</el-button>
        <el-button type="primary" @click="saveKnowledgePoint">保存</el-button>
      </div>
    </el-dialog>
    
    <el-dialog v-model="showJson" title="原始JSON数据" width="80%">
      <pre class="json-preview">{{ JSON.stringify(currentAnalysis, null, 2) }}</pre>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { Upload, Search, ArrowLeft } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import * as echarts from 'echarts'
import { agentApi } from '../api/agent'

const router = useRouter()

const goToHome = () => {
  router.push('/')
}

const fileInput = ref(null)
const isDragging = ref(false)
const uploadProgress = ref(0)
const searchKeyword = ref('')
const files = ref([])
const stats = ref({
  total_docs: 0,
  processed_docs: 0,
  total_topics: 0,
  subject_count: 0,
  subject_distribution: [],
  difficulty_distribution: []
})

const showPreview = ref(false)
const previewData = ref(null)
const showKnowledgePoints = ref(false)
const knowledgePoints = ref([])
const currentFile = ref(null)
const pointSearch = ref('')
const pointFilter = ref('')
const extractingId = ref(null)
const showJson = ref(false)
const currentAnalysis = ref(null)

const showEditPoint = ref(false)
const editingPoint = ref(null)
const editForm = ref({
  name: '',
  subject: '',
  chapter: '',
  definition: '',
  difficulty: 'medium',
  is_key: false,
  is_exam_point: false,
  error_tags_str: '',
  prerequisites: []
})

const subjectChartRef = ref(null)
const difficultyChartRef = ref(null)
let subjectChart = null
let difficultyChart = null

const acceptTypes = '.pdf,.doc,.docx,.txt,.md,.ppt,.pptx'

const filteredFiles = computed(() => {
  if (!searchKeyword.value) return files.value
  return files.value.filter(file => 
    file.name.toLowerCase().includes(searchKeyword.value.toLowerCase())
  )
})

const filteredKnowledgePoints = computed(() => {
  let result = knowledgePoints.value
  if (pointSearch.value) {
    result = result.filter(p => 
      p.name.toLowerCase().includes(pointSearch.value.toLowerCase()) ||
      p.definition.toLowerCase().includes(pointSearch.value.toLowerCase())
    )
  }
  if (pointFilter.value) {
    result = result.filter(p => p.difficulty === pointFilter.value)
  }
  return result
})

const getFileTypeTag = (type) => {
  const tags = { 'PDF': 'primary', 'PPT': 'warning', 'Word': 'success', 'TXT': 'info', 'MD': 'info' }
  return tags[type] || 'info'
}

const getStatusTag = (status) => {
  const tags = { 'pending': '', 'processing': 'warning', 'processed': 'success', 'error': 'danger' }
  return tags[status] || ''
}

const getStatusLabel = (status) => {
  const labels = { 'pending': '待处理', 'processing': '处理中', 'processed': '已处理', 'error': '错误' }
  return labels[status] || '待处理'
}

const getDifficultyTag = (diff) => {
  const tags = { 'easy': 'success', 'medium': 'warning', 'hard': 'danger' }
  return tags[diff] || 'info'
}

const getDifficultyLabel = (diff) => {
  const map = { 'easy': '简单', 'medium': '中等', 'hard': '困难' }
  return map[diff] || '-'
}

const loadDocuments = async () => {
  try {
    const res = await agentApi.getDocuments()
    if (res.data && res.data.data) {
      files.value = res.data.data.map(doc => ({
        id: doc.id,
        name: doc.filename,
        size: formatSize(doc.file_size),
        type: doc.file_type || getFileTypeFromName(doc.filename),
        status: doc.status || 'pending',
        uploadTime: doc.created_at ? formatTime(doc.created_at) : '',
        topics_count: doc.topics_count || 0,
        subject: doc.subject || ''
      }))
    }
  } catch (error) {
    console.error('Load documents error:', error)
  }
}

const loadStats = async () => {
  try {
    const res = await agentApi.getKnowledgeStats()
    if (res.data && res.data.data) {
      stats.value = res.data.data
      initCharts()
    }
  } catch (error) {
    console.error('Load stats error:', error)
  }
}

const formatSize = (bytes) => {
  if (!bytes || bytes < 0) return '0 B'
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

const formatTime = (dateStr) => {
  try {
    const date = new Date(dateStr)
    return date.toLocaleString('zh-CN')
  } catch {
    return dateStr
  }
}

const getFileTypeFromName = (filename) => {
  const ext = filename.split('.').pop().toUpperCase()
  const map = { 
    'PDF': 'PDF', 'PPT': 'PPT', 'PPTX': 'PPT', 
    'DOC': 'Word', 'DOCX': 'Word', 
    'TXT': 'TXT', 'MD': 'MD' 
  }
  return map[ext] || 'Other'
}

const triggerFileSelect = () => {
  fileInput.value.click()
}

const handleFileSelect = (event) => {
  const files = event.target.files
  if (files && files.length > 0) {
    uploadFiles(Array.from(files))
  }
  event.target.value = ''
}

const handleDrop = (event) => {
  isDragging.value = false
  const files = event.dataTransfer.files
  if (files && files.length > 0) {
    uploadFiles(Array.from(files))
  }
}

const uploadFiles = async (fileList) => {
  for (const file of fileList) {
    const valid = validateFile(file)
    if (!valid) continue
    
    try {
      uploadProgress.value = 0
      const formData = new FormData()
      formData.append('file', file)
      
      const res = await agentApi.uploadDocument(file)
      if (res.data && res.data.code === 0) {
        uploadProgress.value = 100
        ElMessage.success(`文件 "${file.name}" 上传成功！`)
        loadDocuments()
        loadStats()
      }
    } catch (error) {
      console.error('Upload error:', error)
      ElMessage.error(`文件 "${file.name}" 上传失败：${error.response?.data?.detail || error.message}`)
    } finally {
      uploadProgress.value = 0
    }
  }
}

const validateFile = (file) => {
  const maxSize = 50 * 1024 * 1024
  if (file.size > maxSize) {
    ElMessage.error(`文件 "${file.name}" 超过 50MB 限制`)
    return false
  }
  
  const allowedExts = ['pdf', 'doc', 'docx', 'txt', 'md', 'ppt', 'pptx']
  const ext = file.name.split('.').pop().toLowerCase()
  if (!allowedExts.includes(ext)) {
    ElMessage.error(`文件 "${file.name}" 格式不支持，仅支持 PDF、Word、TXT、Markdown、PPT`)
    return false
  }
  
  return true
}

const viewFile = async (row) => {
  try {
    const res = await agentApi.getDocument(row.id)
    if (res.data && res.data.data) {
      previewData.value = res.data.data
      showPreview.value = true
    }
  } catch (error) {
    console.error('View file error:', error)
    ElMessage.error('查看文件失败')
  }
}

const viewKnowledgePoints = async (row) => {
  try {
    const res = await agentApi.getKnowledgePoints(row.id)
    if (res.data && res.data.data) {
      knowledgePoints.value = res.data.data
      currentFile.value = row
      showKnowledgePoints.value = true
    }
  } catch (error) {
    console.error('Get knowledge points error:', error)
    ElMessage.error('获取知识点失败')
  }
}

const extractTopics = async (row) => {
  try {
    extractingId.value = row.id
    const res = await agentApi.extractTopics(row.id)
    if (res.data && res.data.code === 0) {
      ElMessage.success('知识点提取成功！')
      currentAnalysis.value = res.data.data.analysis
      await loadDocuments()
      await loadStats()
      await viewKnowledgePoints(row)
    }
  } catch (error) {
    console.error('Extract topics error:', error)
    ElMessage.error('提取知识点失败：' + (error.response?.data?.detail || error.message))
  } finally {
    extractingId.value = null
  }
}

const editKnowledgePoint = (point) => {
  editingPoint.value = point
  editForm.value = {
    name: point.name,
    subject: point.subject || '',
    chapter: point.chapter || '',
    definition: point.definition || '',
    difficulty: point.difficulty || 'medium',
    is_key: point.is_key || false,
    is_exam_point: point.is_exam_point || false,
    error_tags_str: (point.error_tags || []).join(', '),
    prerequisites: point.prerequisites || []
  }
  showEditPoint.value = true
}

const saveKnowledgePoint = async () => {
  try {
    const data = {
      ...editForm.value,
      error_tags: editForm.value.error_tags_str.split(',').map(t => t.trim()).filter(t => t)
    }
    
    if (editingPoint.value) {
      await agentApi.updateKnowledgePoint(editingPoint.value.id, data)
      ElMessage.success('知识点更新成功！')
    } else {
      await agentApi.updateKnowledgePoint(0, { ...data, document_id: currentFile.value.id })
      ElMessage.success('知识点添加成功！')
    }
    
    showEditPoint.value = false
    if (currentFile.value) {
      await viewKnowledgePoints(currentFile.value)
      await loadStats()
    }
  } catch (error) {
    console.error('Save knowledge point error:', error)
    ElMessage.error('保存知识点失败')
  }
}

const deleteKnowledgePoint = async (point) => {
  try {
    await ElMessageBox.confirm(`确定删除知识点 "${point.name}" 吗？`, '确认删除', { type: 'warning' })
    await agentApi.deleteKnowledgePoint(point.id)
    ElMessage.success('知识点删除成功！')
    knowledgePoints.value = knowledgePoints.value.filter(p => p.id !== point.id)
    await loadStats()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

const deleteFile = async (row) => {
  try {
    await ElMessageBox.confirm(`确定删除文件 "${row.name}" 及其所有知识点吗？`, '确认删除', { type: 'warning' })
    await agentApi.deleteDocument(row.id)
    ElMessage.success('文件删除成功！')
    loadDocuments()
    loadStats()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败：' + (error.response?.data?.detail || error.message))
    }
  }
}

const initCharts = () => {
  nextTick(() => {
    if (subjectChartRef.value) {
      subjectChart = echarts.init(subjectChartRef.value)
      updateSubjectChart()
    }
    if (difficultyChartRef.value) {
      difficultyChart = echarts.init(difficultyChartRef.value)
      updateDifficultyChart()
    }
    
    window.addEventListener('resize', () => {
      subjectChart?.resize()
      difficultyChart?.resize()
    })
  })
}

const updateSubjectChart = () => {
  if (!subjectChart) return
  
  const data = stats.value.subject_distribution || []
  const option = {
    tooltip: { trigger: 'item' },
    legend: { orient: 'vertical', right: '5%', top: 'center' },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      center: ['40%', '50%'],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
      label: { show: false },
      emphasis: { label: { show: true, fontSize: 14, fontWeight: 'bold' } },
      labelLine: { show: false },
      data: data.map((item, idx) => ({
        value: item.count,
        name: item.subject,
        itemStyle: { color: ['#667eea', '#f56c6c', '#409eff', '#67c23a', '#e6a23c'][idx % 5] }
      }))
    }]
  }
  subjectChart.setOption(option)
}

const updateDifficultyChart = () => {
  if (!difficultyChart) return
  
  const data = stats.value.difficulty_distribution || []
  const option = {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { 
      type: 'category', 
      data: ['简单', '中等', '困难'],
      axisLine: { lineStyle: { color: '#e4e7ed' } }
    },
    yAxis: { type: 'value', axisLine: { show: false } },
    series: [{
      type: 'bar',
      data: [
        data.find(d => d.difficulty === 'easy')?.count || 0,
        data.find(d => d.difficulty === 'medium')?.count || 0,
        data.find(d => d.difficulty === 'hard')?.count || 0
      ],
      barWidth: '50%',
      itemStyle: {
        borderRadius: [6, 6, 0, 0],
        color: ['#67c23a', '#e6a23c', '#f56c6c']
      }
    }]
  }
  difficultyChart.setOption(option)
}

onMounted(() => {
  loadDocuments()
  loadStats()
})
</script>

<style scoped>
.knowledge-page {
  padding: 24px;
  max-width: 1600px;
}

.page-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}

.back-btn {
  color: #64748b;
  font-size: 14px;
  padding: 6px 12px;
}

.back-btn:hover {
  color: #3b82f6;
}

.page-title {
  font-size: 28px;
  font-weight: 700;
  color: #303133;
  margin-bottom: 8px;
}

.page-subtitle {
  font-size: 14px;
  color: #909399;
}

.card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  padding: 24px;
  margin-bottom: 24px;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 20px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.upload-area {
  border: 2px dashed #d9d9d9;
  border-radius: 12px;
  padding: 40px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background: #fafafa;
}

.upload-area:hover,
.upload-area.drag-over {
  border-color: #667eea;
  background: #f5f7ff;
}

.upload-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.upload-text {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 8px;
}

.upload-hint {
  font-size: 13px;
  color: #909399;
  margin-bottom: 16px;
}

.file-input {
  display: none;
}

.upload-progress {
  margin-top: 16px;
}

.progress-text {
  display: inline-block;
  margin-left: 12px;
  font-size: 14px;
  color: #667eea;
}

.empty-files {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px;
  color: #909399;
}

.stat-box {
  text-align: center;
  padding: 24px;
  background: #f5f7fa;
  border-radius: 12px;
}

.stat-icon {
  font-size: 36px;
  margin-bottom: 12px;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #667eea;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: #909399;
}

.charts-row {
  display: flex;
  gap: 24px;
  margin-top: 32px;
}

.chart-box {
  flex: 1;
  background: #f5f7fa;
  border-radius: 12px;
  padding: 20px;
}

.chart-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 16px;
}

.chart-container {
  height: 280px;
}

.document-view {
  max-height: 80vh;
  display: flex;
  flex-direction: column;
}

.doc-info {
  padding-bottom: 16px;
  border-bottom: 1px solid #e4e7ed;
  margin-bottom: 16px;
}

.doc-meta {
  display: flex;
  gap: 16px;
  font-size: 13px;
  color: #909399;
}

.meta-item {
  padding: 4px 12px;
  background: #f5f7fa;
  border-radius: 4px;
}

.doc-content {
  flex: 1;
  overflow: auto;
}

.text-content {
  white-space: pre-wrap;
  font-size: 14px;
  line-height: 1.8;
  color: #303133;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
  font-family: 'Microsoft YaHei', 'PingFang SC', sans-serif;
  margin: 0;
}

.knowledge-panel {
  max-height: 80vh;
  display: flex;
  flex-direction: column;
}

.knowledge-toolbar {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
}

.knowledge-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.knowledge-card {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 20px;
  border-left: 4px solid #667eea;
}

.knowledge-header {
  margin-bottom: 16px;
}

.point-title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.point-name {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.point-badges {
  display: flex;
  gap: 8px;
}

.point-meta {
  font-size: 13px;
  color: #909399;
  display: flex;
  gap: 20px;
}

.knowledge-body {
  margin-bottom: 16px;
}

.point-definition h5,
.point-tags h5,
.point-prereq h5 {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 8px;
}

.point-definition p {
  font-size: 14px;
  color: #606266;
  line-height: 1.8;
  margin: 0;
  padding: 12px;
  background: white;
  border-radius: 6px;
}

.point-tags,
.point-prereq {
  margin-top: 12px;
}

.knowledge-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.empty-knowledge {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px;
  color: #909399;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
}

.json-preview {
  max-height: 60vh;
  overflow-y: auto;
  padding: 16px;
  background: #1f1f1f;
  color: #e0e0e0;
  font-size: 12px;
  border-radius: 8px;
  font-family: 'Consolas', 'Monaco', monospace;
}

.highlight {
  color: #667eea;
  font-weight: 600;
}
</style>