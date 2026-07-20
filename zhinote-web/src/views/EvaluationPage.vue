<template>
  <div class="evaluation-page">
    <div class="page-header">
      <el-button type="text" @click="goToHome" class="back-btn">
        <el-icon><ArrowLeft /></el-icon>
        返回首页
      </el-button>
      <div class="page-title">📊 学习效果评估</div>
      <div class="page-subtitle">AI驱动的错题分析与学习闭环优化</div>
    </div>
    
    <div class="card-section">
      <div class="card stats-card">
        <h3 class="card-title">📝 做题统计</h3>
        <el-row :gutter="20">
          <el-col :span="6">
            <div class="stat-box">
              <div class="stat-icon">📝</div>
              <div class="stat-value">{{ stats.total }}</div>
              <div class="stat-label">总做题数</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="stat-box">
              <div class="stat-icon">✅</div>
              <div class="stat-value correct">{{ stats.correct }}</div>
              <div class="stat-label">正确数</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="stat-box">
              <div class="stat-icon">❌</div>
              <div class="stat-value wrong">{{ stats.wrong }}</div>
              <div class="stat-label">错误数</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="stat-box">
              <div class="stat-icon">📈</div>
              <div class="stat-value rate">{{ stats.rate }}%</div>
              <div class="stat-label">正确率</div>
            </div>
          </el-col>
        </el-row>
      </div>
      
      <div class="card analysis-card">
        <h3 class="card-title">🧠 AI学情分析</h3>
        <div class="analysis-content">
          <div class="analysis-section" v-if="analysisData.weak_points && analysisData.weak_points.length > 0">
            <h4>🔴 薄弱知识点</h4>
            <div class="error-tags">
              <el-tag 
                v-for="(tag, index) in analysisData.weak_points" 
                :key="index" 
                type="danger"
                size="large"
              >
                {{ tag }}
              </el-tag>
            </div>
          </div>
          
          <div class="analysis-section" v-if="analysisData.error_types && analysisData.error_types.length > 0">
            <h4>⚠️ 主要错误类型</h4>
            <div class="error-tags">
              <el-tag 
                v-for="(tag, index) in analysisData.error_types" 
                :key="index" 
                type="warning"
                size="small"
              >
                {{ tag }}
              </el-tag>
            </div>
          </div>
          
          <div class="analysis-section" v-if="analysisData.report">
            <h4>📋 分析报告</h4>
            <p class="analysis-text">{{ analysisData.report }}</p>
          </div>
          
          <div class="analysis-section" v-if="analysisData.knowledge_gaps && analysisData.knowledge_gaps.length > 0">
            <h4>📚 知识短板</h4>
            <ul class="suggestion-list">
              <li v-for="(gap, index) in analysisData.knowledge_gaps" :key="index">
                <el-icon><Warning /></el-icon>
                {{ gap }}
              </li>
            </ul>
          </div>
          
          <div class="analysis-section" v-if="analysisData.suggestions && analysisData.suggestions.length > 0">
            <h4>💡 补学建议</h4>
            <ul class="suggestion-list">
              <li v-for="(suggestion, index) in analysisData.suggestions" :key="index">
                <el-icon><InfoFilled /></el-icon>
                {{ suggestion }}
              </li>
            </ul>
          </div>
          
          <div class="action-buttons">
            <el-button type="primary" @click="updateProfile" :loading="updating">
              <el-icon><User /></el-icon>
              更新学习画像
            </el-button>
            <el-button type="success" @click="adjustPlan" :loading="adjusting">
              <el-icon><MapLocation /></el-icon>
              调整学习路径
            </el-button>
            <el-button type="warning" @click="generateRecommendations" :loading="recommending">
              <el-icon><ShoppingCart /></el-icon>
              获取推荐资源
            </el-button>
          </div>
        </div>
      </div>
    </div>
    
    <div class="card mistakes-card">
      <div class="card-header">
        <h3 class="card-title">📝 错题记录</h3>
        <div class="header-actions">
          <el-button type="primary" size="small" @click="showAddModal = true">📝 手动录入</el-button>
          <el-button type="success" size="small" @click="showOcrModal = true">📷 OCR识别</el-button>
          <el-button type="info" size="small" @click="showImportModal = true">📥 导入错题</el-button>
          <el-button size="small" @click="exportMistakes">📤 导出错题</el-button>
          <el-select v-model="filterSubject" placeholder="筛选科目" style="width: 120px; margin-left: 10px;">
            <el-option label="全部" value="" />
            <el-option label="数学" value="数学" />
            <el-option label="计算机" value="计算机" />
            <el-option label="英语" value="英语" />
            <el-option label="其他" value="其他" />
          </el-select>
          <el-select v-model="filterTopic" placeholder="筛选知识点" style="width: 150px; margin-left: 10px;">
            <el-option label="全部" value="" />
            <el-option v-for="topic in topicOptions" :key="topic" :label="topic" :value="topic" />
          </el-select>
          <el-button type="danger" size="small" @click="clearAllMistakes" style="margin-left: 10px;">清空全部</el-button>
        </div>
      </div>
      
      <el-table :data="filteredMistakes" border>
        <el-table-column prop="subject" label="科目" width="100">
          <template #default="{ row }">
            <el-tag :type="getSubjectTagType(row.subject)">{{ row.subject || '未分类' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="topic" label="知识点" width="150" />
        <el-table-column prop="question" label="题目" min-width="250" show-overflow-tooltip />
        <el-table-column prop="question_type" label="题型" width="80">
          <template #default="{ row }">
            <el-tag size="small">{{ getQuestionTypeLabel(row.question_type) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="user_answer" label="你的答案" width="120" />
        <el-table-column prop="correct_answer" label="正确答案" width="120">
          <template #default="{ row }">
            <span class="correct-answer">{{ row.correct_answer }}</span>
          </template>
        </el-table-column>
        <el-table-column label="错因标签" width="150">
          <template #default="{ row }">
            <el-tag 
              v-for="(tag, idx) in row.error_tags.slice(0, 2)" 
              :key="idx" 
              size="small"
              type="danger"
            >
              {{ tag }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="difficulty" label="难度" width="80">
          <template #default="{ row }">
            <el-tag :type="getDifficultyTagType(row.difficulty)" size="small">{{ getDifficultyLabel(row.difficulty) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="作答时间" width="180">
          <template #default="{ row }">
            {{ formatTime(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="250">
          <template #default="{ row }">
            <el-button size="small" @click="viewMistakeDetail(row)">详情</el-button>
            <el-button size="small" type="success" @click="markReviewed(row.id)">已掌握</el-button>
            <el-button size="small" type="primary" @click="redoQuestion(row)">重做</el-button>
            <el-button size="small" type="danger" @click="deleteSingleMistake(row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <div v-if="filteredMistakes.length === 0" class="empty-mistakes">
        <el-icon size="48" style="color: #c0c4cc;">🎉</el-icon>
        <p>暂无错题记录，继续保持！</p>
      </div>
    </div>
    
    <div class="card trend-card">
      <h3 class="card-title">📈 学习趋势</h3>
      <div class="trend-chart">
        <div ref="trendChartRef" class="trend-chart-container"></div>
      </div>
    </div>
    
    <div class="card records-card">
      <h3 class="card-title">📚 学习记录</h3>
      <div class="records-list">
        <div v-for="(record, index) in learningRecords" :key="index" class="record-item">
          <div class="record-icon">{{ getRecordIcon(record.type) }}</div>
          <div class="record-content">
            <div class="record-topic">{{ record.topic }}</div>
            <div class="record-detail">{{ record.detail }}</div>
          </div>
          <div class="record-meta">
            <span v-if="record.score" class="record-score">得分: {{ record.score }}</span>
            <span v-if="record.duration" class="record-duration">{{ record.duration }}</span>
          </div>
          <div class="record-time">{{ formatTime(record.created_at) }}</div>
        </div>
        <div v-if="learningRecords.length === 0" class="empty-records">
          <el-icon size="48" style="color: #c0c4cc;">📝</el-icon>
          <p>暂无学习记录</p>
        </div>
      </div>
    </div>

    <el-dialog v-model="showDetail" title="错题详情" width="80%">
      <div v-if="selectedMistake" class="mistake-detail">
        <div class="detail-section">
          <h4>📋 题目</h4>
          <p class="detail-text">{{ selectedMistake.question }}</p>
        </div>
        <div class="detail-row">
          <div class="detail-section">
            <h4>📊 题型</h4>
            <el-tag type="info">{{ getQuestionTypeLabel(selectedMistake.question_type) }}</el-tag>
          </div>
          <div class="detail-section">
            <h4>⚡ 难度</h4>
            <el-tag :type="getDifficultyTagType(selectedMistake.difficulty)">{{ getDifficultyLabel(selectedMistake.difficulty) }}</el-tag>
          </div>
        </div>
        <div class="detail-row">
          <div class="detail-section">
            <h4>❌ 你的答案</h4>
            <p class="detail-text wrong">{{ selectedMistake.user_answer || '未作答' }}</p>
          </div>
          <div class="detail-section">
            <h4>✅ 正确答案</h4>
            <p class="detail-text correct">{{ selectedMistake.correct_answer }}</p>
          </div>
        </div>
        <div class="detail-section" v-if="selectedMistake.error_detail">
          <h4>🔍 AI错因详细解析</h4>
          <p class="detail-text">{{ selectedMistake.error_detail }}</p>
        </div>
        <div class="detail-section" v-if="selectedMistake.analysis">
          <h4>📝 题目解析</h4>
          <p class="detail-text">{{ selectedMistake.analysis }}</p>
        </div>
        <div class="detail-section" v-if="selectedMistake.error_tags && selectedMistake.error_tags.length > 0">
          <h4>🏷️ 错因标签</h4>
          <el-tag 
            v-for="(tag, idx) in selectedMistake.error_tags" 
            :key="idx" 
            type="danger"
          >
            {{ tag }}
          </el-tag>
        </div>
        <div class="detail-section" v-if="selectedMistake.related_knowledge">
          <h4>📚 关联知识点</h4>
          <el-tag type="info">{{ selectedMistake.related_knowledge }}</el-tag>
        </div>
        <div class="detail-section" v-if="selectedMistake.review_count > 0">
          <h4>🔄 复习次数</h4>
          <el-tag type="success">{{ selectedMistake.review_count }} 次</el-tag>
        </div>
      </div>
      <template #footer>
        <el-button @click="showDetail = false">关闭</el-button>
        <el-button type="primary" @click="redoQuestion(selectedMistake)">重做练习</el-button>
        <el-button type="success" @click="markReviewed(selectedMistake.id)">标记已掌握</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showAddModal" title="手动录入错题" width="60%">
      <el-form :model="addMistakeForm" label-width="100px">
        <el-form-item label="科目">
          <el-select v-model="addMistakeForm.subject" placeholder="请选择科目">
            <el-option label="数学" value="数学" />
            <el-option label="计算机" value="计算机" />
            <el-option label="英语" value="英语" />
            <el-option label="其他" value="其他" />
          </el-select>
        </el-form-item>
        <el-form-item label="知识点">
          <el-input v-model="addMistakeForm.topic" placeholder="请输入知识点" />
        </el-form-item>
        <el-form-item label="题目类型">
          <el-select v-model="addMistakeForm.question_type" placeholder="请选择题型">
            <el-option label="单选题" value="choice" />
            <el-option label="填空题" value="fill" />
            <el-option label="简答题" value="essay" />
            <el-option label="编程题" value="code" />
          </el-select>
        </el-form-item>
        <el-form-item label="难度">
          <el-select v-model="addMistakeForm.difficulty">
            <el-option label="简单" value="easy" />
            <el-option label="中等" value="medium" />
            <el-option label="困难" value="hard" />
          </el-select>
        </el-form-item>
        <el-form-item label="原题题干">
          <el-input type="textarea" v-model="addMistakeForm.question" rows="4" placeholder="请输入题目内容" />
        </el-form-item>
        <el-form-item label="你的答案">
          <el-input type="textarea" v-model="addMistakeForm.user_answer" rows="2" placeholder="请输入你的答案" />
        </el-form-item>
        <el-form-item label="正确答案">
          <el-input type="textarea" v-model="addMistakeForm.correct_answer" rows="2" placeholder="请输入正确答案" />
        </el-form-item>
        <el-form-item label="错因标签">
          <el-select v-model="addMistakeForm.error_tags" multiple placeholder="请选择错因标签">
            <el-option label="概念不清" value="概念不清" />
            <el-option label="公式误用" value="公式误用" />
            <el-option label="语法错误" value="语法错误" />
            <el-option label="审题失误" value="审题失误" />
            <el-option label="计算错误" value="计算错误" />
            <el-option label="基础薄弱" value="基础薄弱" />
          </el-select>
        </el-form-item>
        <el-form-item label="错因解析">
          <el-input type="textarea" v-model="addMistakeForm.error_detail" rows="3" placeholder="请输入详细错因解析" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddModal = false">取消</el-button>
        <el-button type="primary" @click="submitAddMistake" :loading="addingMistake">确认录入</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showOcrModal" title="OCR识别录入错题" width="60%">
      <div class="ocr-section">
        <el-upload
          class="ocr-upload"
          action="#"
          :auto-upload="false"
          :on-change="handleOcrUpload"
          accept="image/*"
        >
          <el-button type="primary">📷 上传图片</el-button>
        </el-upload>
        <div v-if="ocrImage" class="ocr-preview">
          <img :src="ocrImage" style="max-width: 100%; max-height: 300px;" />
        </div>
        <el-form-item label="图片文字">
          <el-input type="textarea" v-model="ocrText" rows="6" placeholder="上传图片后自动识别文字，或手动输入" />
        </el-form-item>
      </div>
      <template #footer>
        <el-button @click="showOcrModal = false">取消</el-button>
        <el-button type="primary" @click="submitOcrMistake" :loading="processingOcr">确认识别</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showImportModal" title="导入错题" width="60%">
      <div class="import-section">
        <p class="import-hint">支持 JSON 格式导入，字段包括：subject, topic, question, question_type, user_answer, correct_answer, analysis, error_tags, difficulty</p>
        <el-upload
          class="import-upload"
          action="#"
          :auto-upload="false"
          :on-change="handleImportFile"
          accept=".json,.csv"
        >
          <el-button type="primary">📁 选择文件</el-button>
        </el-upload>
        <el-form-item label="导入内容">
          <el-input type="textarea" v-model="importContent" rows="10" placeholder="粘贴 JSON 数据或上传文件" />
        </el-form-item>
      </div>
      <template #footer>
        <el-button @click="showImportModal = false">取消</el-button>
        <el-button type="primary" @click="submitImportMistakes" :loading="importing">确认导入</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showRedoModal" title="重做练习" width="60%">
      <div v-if="redoQuestionData" class="redo-section">
        <div class="redo-question">
          <h4>📋 题目</h4>
          <p>{{ redoQuestionData.question }}</p>
        </div>
        <div class="redo-options" v-if="redoQuestionData.options && redoQuestionData.options.length > 0">
          <el-radio-group v-model="redoAnswer">
            <el-radio v-for="(opt, idx) in redoQuestionData.options" :key="idx" :label="opt">{{ opt }}</el-radio>
          </el-radio-group>
        </div>
        <div v-else>
          <el-input type="textarea" v-model="redoAnswer" rows="4" placeholder="请输入你的答案" />
        </div>
      </div>
      <template #footer>
        <el-button @click="showRedoModal = false">取消</el-button>
        <el-button type="primary" @click="submitRedoAnswer" :loading="submittingRedo">提交答案</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { MapLocation, User, InfoFilled, Warning, ShoppingCart, ArrowLeft } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { agentApi } from '../api/agent'
import * as echarts from 'echarts'

const router = useRouter()

const goToHome = () => {
  router.push('/')
}

const filterSubject = ref('')
const filterTopic = ref('')
const updating = ref(false)
const adjusting = ref(false)
const recommending = ref(false)
const addingMistake = ref(false)
const processingOcr = ref(false)
const importing = ref(false)
const submittingRedo = ref(false)

const stats = ref({
  total: 0,
  correct: 0,
  wrong: 0,
  rate: 0
})

const analysisData = ref({
  weak_points: [],
  error_types: [],
  report: '',
  knowledge_gaps: [],
  suggestions: []
})

const mistakes = ref([])
const learningRecords = ref([])
const selectedMistake = ref(null)
const showDetail = ref(false)

const showAddModal = ref(false)
const showOcrModal = ref(false)
const showImportModal = ref(false)
const showRedoModal = ref(false)
const redoQuestionData = ref(null)
const redoAnswer = ref('')

const ocrImage = ref('')
const ocrText = ref('')
const importContent = ref('')

const addMistakeForm = ref({
  subject: '',
  topic: '',
  question_type: 'choice',
  difficulty: 'medium',
  question: '',
  user_answer: '',
  correct_answer: '',
  error_tags: [],
  error_detail: '',
  analysis: ''
})

const trendData = ref([
  { day: '周六', rate: 0, correct: 0, total: 0 },
  { day: '周日', rate: 0, correct: 0, total: 0 },
  { day: '周一', rate: 0, correct: 0, total: 0 },
  { day: '周二', rate: 0, correct: 0, total: 0 },
  { day: '周三', rate: 0, correct: 0, total: 0 },
  { day: '周四', rate: 0, correct: 0, total: 0 },
  { day: '周五', rate: 0, correct: 0, total: 0 }
])

const trendChartRef = ref(null)
let trendChart = null

const topicOptions = computed(() => {
  const topics = new Set(mistakes.value.map(m => m.topic).filter(t => t))
  return Array.from(topics)
})

const filteredMistakes = computed(() => {
  let result = mistakes.value
  if (filterSubject.value) {
    result = result.filter(m => m.subject === filterSubject.value)
  }
  if (filterTopic.value) {
    result = result.filter(m => m.topic === filterTopic.value)
  }
  return result
})

const initTrendChart = () => {
  console.log('initTrendChart called')
  console.log('trendChartRef:', trendChartRef.value)
  
  if (trendChartRef.value) {
    const rect = trendChartRef.value.getBoundingClientRect()
    console.log('Container rect:', rect)
    
    if (rect.width > 0 && rect.height > 0) {
      trendChart = echarts.init(trendChartRef.value)
      console.log('ECharts instance created:', trendChart)
      updateTrendChart()
      
      window.addEventListener('resize', () => {
        if (trendChart) {
          trendChart.resize()
        }
      })
    } else {
      console.error('Container has zero dimensions:', rect)
    }
  } else {
    console.error('trendChartRef is null')
  }
}

const updateTrendChart = () => {
  if (!trendChart) return
  
  const days = trendData.value.map(item => item.day)
  const rates = trendData.value.map(item => item.rate)
  
  const option = {
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#667eea',
      borderWidth: 1,
      textStyle: {
        color: '#333'
      },
      formatter: (params) => {
        const data = trendData.value[params[0].dataIndex]
        return `<div style="padding: 8px;">
          <div style="font-weight: bold; color: #667eea;">${data.day}</div>
          <div style="margin-top: 4px;">正确率: <span style="color: #667eea; font-weight: bold;">${data.rate}%</span></div>
          <div>做题总数: ${data.total} 题</div>
          <div>正确数: ${data.correct} 题</div>
        </div>`
      }
    },
    grid: {
      left: '5%',
      right: '5%',
      top: '15%',
      bottom: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: days,
      axisLine: {
        lineStyle: {
          color: '#e4e7ed'
        }
      },
      axisLabel: {
        color: '#909399',
        fontSize: 12
      }
    },
    yAxis: {
      type: 'value',
      name: '正确率 %',
      nameTextStyle: {
        color: '#909399',
        fontSize: 12
      },
      min: 0,
      max: 100,
      axisLine: {
        show: false
      },
      axisLabel: {
        color: '#909399',
        fontSize: 12,
        formatter: '{value}%'
      },
      splitLine: {
        lineStyle: {
          color: '#f0f0f0',
          type: 'dashed'
        }
      }
    },
    series: [{
      type: 'line',
      data: rates,
      smooth: true,
      symbol: 'circle',
      symbolSize: 8,
      lineStyle: {
        width: 3,
        color: '#667eea'
      },
      itemStyle: {
        color: '#667eea',
        borderWidth: 2,
        borderColor: '#fff'
      },
      areaStyle: {
        color: 'rgba(102, 126, 234, 0.15)'
      }
    }]
  }
  
  trendChart.setOption(option)
}

const getSubjectTagType = (subject) => {
  const types = {
    '数学': 'primary',
    '计算机': 'success',
    '英语': 'warning',
    '其他': 'info'
  }
  return types[subject] || 'info'
}

const getQuestionTypeLabel = (type) => {
  const labels = {
    'choice': '单选',
    'fill': '填空',
    'essay': '简答',
    'code': '编程'
  }
  return labels[type] || type
}

const getDifficultyTagType = (difficulty) => {
  const types = {
    'easy': 'success',
    'medium': 'warning',
    'hard': 'danger'
  }
  return types[difficulty] || 'info'
}

const getDifficultyLabel = (difficulty) => {
  const labels = {
    'easy': '简单',
    'medium': '中等',
    'hard': '困难'
  }
  return labels[difficulty] || difficulty
}

const getRecordIcon = (type) => {
  const icons = {
    'profile': '🧠',
    'plan': '📅',
    'resource': '📚',
    'question': '✏️',
    'evaluation': '📊',
    'review': '🔄',
    'mistake': '❌',
    'chat': '💬',
    'document': '📄'
  }
  return icons[type] || '📝'
}

const formatTime = (timeStr) => {
  try {
    const date = new Date(timeStr)
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return timeStr
  }
}

const viewMistakeDetail = (row) => {
  selectedMistake.value = row
  showDetail.value = true
}

const redoQuestion = (row) => {
  redoQuestionData.value = row
  redoAnswer.value = ''
  showRedoModal.value = true
}

const submitRedoAnswer = async () => {
  if (!redoAnswer.value.trim()) {
    ElMessage.warning('请输入答案')
    return
  }
  submittingRedo.value = true
  try {
    const isCorrect = redoAnswer.value === redoQuestionData.value.correct_answer
    if (isCorrect) {
      await agentApi.reviewMistake(redoQuestionData.value.id)
      ElMessage.success('回答正确！已标记为已掌握')
    } else {
      await agentApi.unreviewMistake(redoQuestionData.value.id)
      ElMessage.error(`回答错误！已标记为未掌握。正确答案：${redoQuestionData.value.correct_answer}`)
    }
    showRedoModal.value = false
    await loadMistakes()
    await loadStats()
  } catch (error) {
    ElMessage.error('提交失败：' + (error.response?.data?.detail || error.message))
  } finally {
    submittingRedo.value = false
  }
}

const markReviewed = async (mistakeId) => {
  try {
    await agentApi.reviewMistake(mistakeId)
    ElMessage.success('已标记为已掌握！')
    await loadMistakes()
  } catch (error) {
    ElMessage.error('操作失败：' + (error.response?.data?.detail || error.message))
  }
}

const deleteSingleMistake = async (mistakeId) => {
  ElMessageBox.confirm(
    '确定要删除这条错题吗？删除后无法恢复。',
    '确认删除',
    {
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      await agentApi.deleteMistake(mistakeId)
      ElMessage.success('错题删除成功！')
      await loadMistakes()
      await loadStats()
    } catch (error) {
      ElMessage.error('删除失败：' + (error.response?.data?.detail || error.message))
    }
  }).catch(() => {
    ElMessage.info('已取消删除')
  })
}

const clearAllMistakes = async () => {
  ElMessageBox.confirm(
    '确定要清空全部错题记录吗？此操作无法撤销！',
    '确认清空',
    {
      confirmButtonText: '确定清空',
      cancelButtonText: '取消',
      type: 'danger'
    }
  ).then(async () => {
    try {
      await agentApi.clearMistakes()
      ElMessage.success('全部错题已清空！')
      await loadMistakes()
      await loadStats()
    } catch (error) {
      ElMessage.error('清空失败：' + (error.response?.data?.detail || error.message))
    }
  }).catch(() => {
    ElMessage.info('已取消清空')
  })
}

const submitAddMistake = async () => {
  if (!addMistakeForm.value.question || !addMistakeForm.value.correct_answer) {
    ElMessage.warning('请填写题目和正确答案')
    return
  }
  addingMistake.value = true
  try {
    await agentApi.addMistake({
      ...addMistakeForm.value,
      source_type: 'manual'
    })
    ElMessage.success('错题录入成功！')
    showAddModal.value = false
    addMistakeForm.value = {
      subject: '',
      topic: '',
      question_type: 'choice',
      difficulty: 'medium',
      question: '',
      user_answer: '',
      correct_answer: '',
      error_tags: [],
      error_detail: '',
      analysis: ''
    }
    await loadMistakes()
    await loadStats()
    
    try {
      await agentApi.triggerLearningLoop()
      ElMessage.success('学习闭环已自动优化！')
    } catch (e) {
      console.log('Learning loop triggered:', e)
    }
  } catch (error) {
    ElMessage.error('录入失败：' + (error.response?.data?.detail || error.message))
  } finally {
    addingMistake.value = false
  }
}

const handleOcrUpload = async (file) => {
  const reader = new FileReader()
  reader.onload = (e) => {
    ocrImage.value = e.target.result
  }
  reader.readAsDataURL(file.raw)
  
  ElMessage.info('正在自动识别图片文字...')
  try {
    const result = await agentApi.ocrAnalyzeImage(file.raw)
    console.log('OCR Result:', result)
    if (result.data && result.data.data) {
      if (result.data.data.text && result.data.data.text.trim()) {
        if (result.data.data.text.includes('No image') || result.data.data.text.includes('no image')) {
          ElMessage.warning('图片识别失败，请手动输入')
        } else {
          ocrText.value = result.data.data.text
          ElMessage.success('图片文字识别成功！')
        }
      } else {
        ElMessage.warning('未能识别到文字，请手动输入')
      }
    } else {
      ElMessage.warning('识别结果格式错误，请手动输入')
    }
  } catch (error) {
    console.error('OCR Error:', error)
    ElMessage.warning('自动识别失败，请手动输入')
  }
}

const submitOcrMistake = async () => {
  if (!ocrText.value.trim()) {
    ElMessage.warning('请输入图片识别的文字内容')
    return
  }
  processingOcr.value = true
  try {
    const result = await agentApi.ocrAnalyze(ocrText.value)
    if (result.data?.data?.has_questions) {
      ElMessage.success('OCR识别成功！已录入错题')
      showOcrModal.value = false
      ocrImage.value = ''
      ocrText.value = ''
      await loadMistakes()
      await loadStats()
    } else {
      ElMessage.warning('未识别到题目，请手动录入')
    }
  } catch (error) {
    ElMessage.error('识别失败：' + (error.response?.data?.detail || error.message))
  } finally {
    processingOcr.value = false
  }
}

const handleImportFile = (file) => {
  const reader = new FileReader()
  reader.onload = (e) => {
    importContent.value = e.target.result
  }
  reader.readAsText(file.raw, 'utf-8')
}

const submitImportMistakes = async () => {
  if (!importContent.value.trim()) {
    ElMessage.warning('请输入导入内容')
    return
  }
  importing.value = true
  try {
    const data = JSON.parse(importContent.value)
    await agentApi.importMistakes(Array.isArray(data) ? data : [data])
    ElMessage.success('错题导入成功！')
    showImportModal.value = false
    importContent.value = ''
    await loadMistakes()
    await loadStats()
  } catch (error) {
    ElMessage.error('导入失败：' + (error.message || error.response?.data?.detail || '格式错误'))
  } finally {
    importing.value = false
  }
}

const exportMistakes = async () => {
  try {
    const response = await agentApi.exportMistakes()
    const blob = new Blob([response.data], { type: 'application/json' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `mistakes_${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    ElMessage.success('错题导出成功！')
  } catch (error) {
    ElMessage.error('导出失败：' + (error.response?.data?.detail || error.message))
  }
}

const updateProfile = async () => {
  updating.value = true
  try {
    const profileRes = await agentApi.getProfile()
    const profile = profileRes.data?.data || {}
    profile.weak_points = analysisData.value.weak_points || profile.weak_points || []
    profile.knowledge_gaps = analysisData.value.knowledge_gaps || profile.knowledge_gaps || []
    await agentApi.updateProfile(profile)
    ElMessage.success('学习画像已更新！')
  } catch (error) {
    ElMessage.error('更新失败：' + (error.response?.data?.detail || error.message))
  } finally {
    updating.value = false
  }
}

const adjustPlan = async () => {
  adjusting.value = true
  try {
    const evaluationResult = {
      score: stats.value.rate,
      analysis: analysisData.value
    }
    await agentApi.adjustPlan(evaluationResult)
    ElMessage.success('学习路径已根据评估结果调整！')
  } catch (error) {
    ElMessage.error('调整失败：' + (error.response?.data?.detail || error.message))
  } finally {
    adjusting.value = false
  }
}

const generateRecommendations = async () => {
  recommending.value = true
  try {
    await agentApi.getRecommendations()
    ElMessage.success('推荐资源已生成！请查看资源中心')
  } catch (error) {
    ElMessage.error('生成失败：' + (error.response?.data?.detail || error.message))
  } finally {
    recommending.value = false
  }
}

const loadMistakes = async () => {
  try {
    const res = await agentApi.getMistakesFull()
    if (res.data && res.data.data) {
      mistakes.value = res.data.data
    }
  } catch (error) {
    console.error('Get mistakes error:', error)
  }
}

const loadStats = async () => {
  try {
    const res = await agentApi.getMistakesStats()
    if (res.data && res.data.data) {
      stats.value = res.data.data
    }
  } catch (error) {
    console.error('Get stats error:', error)
  }
}

const loadTrend = async () => {
  try {
    const res = await agentApi.getMistakesTrend(7)
    console.log('Trend API response:', res)
    
    if (res.data && res.data.data) {
      trendData.value = res.data.data
      console.log('Trend data loaded:', trendData.value)
      
      if (trendChart) {
        updateTrendChart()
      } else {
        await nextTick()
        initTrendChart()
      }
    }
  } catch (error) {
    console.error('Get trend error:', error)
  }
}

const loadRecords = async () => {
  try {
    const res = await agentApi.getRecords()
    if (res.data && res.data.data) {
      learningRecords.value = res.data.data
    }
  } catch (error) {
    console.error('Get records error:', error)
  }
}

const generateAnalysis = async () => {
  try {
    const res = await agentApi.getMistakesFull()
    const mistakesData = res.data?.data || []
    
    if (mistakesData.length > 0) {
      const errorTags = {}
      const topics = {}
      mistakesData.forEach(m => {
        m.error_tags?.forEach(tag => {
          errorTags[tag] = (errorTags[tag] || 0) + 1
        })
        if (m.topic) {
          topics[m.topic] = (topics[m.topic] || 0) + 1
        }
      })
      
      const sortedTags = Object.entries(errorTags).sort((a, b) => b[1] - a[1]).slice(0, 5)
      const sortedTopics = Object.entries(topics).sort((a, b) => b[1] - a[1]).slice(0, 5)
      
      analysisData.value = {
        weak_points: sortedTopics.map(t => t[0]),
        error_types: sortedTags.map(t => t[0]),
        report: `根据你的错题记录分析，你在 ${sortedTopics[0]?.[0] || '多个知识点'} 方面存在薄弱，主要错误类型为 ${sortedTags[0]?.[0] || '多种类型'}。建议针对薄弱知识点进行强化练习。`,
        knowledge_gaps: sortedTopics.slice(0, 3).map((t, i) => `${i+1}. ${t[0]} - 出现 ${t[1]} 次错误`),
        suggestions: [
          '针对薄弱知识点进行专项练习',
          '回顾相关课程文档和课件',
          '使用AI讲解功能深入理解错题',
          '定期重做错题巩固记忆',
          '调整学习路径增加薄弱章节学习'
        ]
      }
    }
  } catch (error) {
    console.error('Generate analysis error:', error)
  }
}

onMounted(async () => {
  await Promise.all([
    loadMistakes(),
    loadStats(),
    loadTrend(),
    loadRecords()
  ])
  await generateAnalysis()
  
  await nextTick()
  initTrendChart()
})

watch(filterSubject, () => {})
watch(filterTopic, () => {})
watch(trendData, () => {
  if (trendChart) {
    updateTrendChart()
  }
}, { deep: true })
</script>

<style scoped>
.evaluation-page {
  padding: 20px;
}

.page-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
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
  font-size: 24px;
  font-weight: 700;
  color: #303133;
}

.page-subtitle {
  font-size: 14px;
  color: #909399;
}

.card-section {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
}

.card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

.card-title {
  margin-bottom: 20px;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.stats-card {
  flex: 1;
}

.stat-box {
  text-align: center;
  padding: 20px;
  background: #f5f7fa;
  border-radius: 12px;
}

.stat-icon {
  font-size: 32px;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #667eea;
}

.stat-value.correct {
  color: #67c23a;
}

.stat-value.wrong {
  color: #f56c6c;
}

.stat-value.rate {
  color: #e6a23c;
}

.stat-label {
  font-size: 14px;
  color: #909399;
}

.analysis-card {
  flex: 1;
}

.analysis-content {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.action-buttons {
  display: flex;
  gap: 10px;
  margin-top: 10px;
}

.analysis-section h4 {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 10px;
}

.error-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.analysis-text {
  font-size: 14px;
  line-height: 1.6;
  color: #606266;
  background: #f5f7fa;
  padding: 15px;
  border-radius: 8px;
}

.suggestion-list {
  margin: 0;
  padding-left: 20px;
}

.suggestion-list li {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 10px;
  font-size: 14px;
  color: #606266;
}

.mistakes-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 10px;
}

.header-actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.correct-answer {
  color: #67c23a;
  font-weight: 600;
}

.empty-mistakes {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  color: #909399;
}

.trend-card {
  margin-bottom: 20px;
}

.trend-chart {
  width: 100%;
  min-height: 300px;
}

.trend-chart-container {
  width: 100%;
  height: 300px;
  min-height: 300px;
  display: block;
}

.records-card {
  margin-bottom: 20px;
}

.records-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.record-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;
}

.record-icon {
  font-size: 24px;
}

.record-content {
  flex: 1;
}

.record-topic {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.record-detail {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.record-meta {
  display: flex;
  gap: 10px;
  font-size: 12px;
  color: #909399;
}

.record-score {
  color: #67c23a;
}

.record-time {
  font-size: 12px;
  color: #909399;
}

.empty-records {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  color: #909399;
}

.mistake-detail {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.detail-row {
  display: flex;
  gap: 20px;
}

.detail-section {
  flex: 1;
}

.detail-section h4 {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 10px;
}

.detail-text {
  font-size: 14px;
  line-height: 1.6;
  color: #606266;
  background: #f5f7fa;
  padding: 15px;
  border-radius: 8px;
  margin: 0;
}

.detail-text.wrong {
  background: #fef0f0;
  color: #f56c6c;
}

.detail-text.correct {
  background: #f0f9eb;
  color: #67c23a;
}

.ocr-section, .import-section {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.ocr-preview {
  margin-top: 10px;
}

.import-hint {
  font-size: 12px;
  color: #909399;
  background: #f5f7fa;
  padding: 10px;
  border-radius: 8px;
}

.redo-section {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.redo-question p {
  font-size: 14px;
  line-height: 1.6;
  color: #606266;
  background: #f5f7fa;
  padding: 15px;
  border-radius: 8px;
}

.redo-options {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
</style>