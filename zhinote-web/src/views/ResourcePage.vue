<template>
  <div class="resource-page">
    <div class="page-header">
      <el-button type="text" @click="goToHome" class="back-btn">
        <el-icon><ArrowLeft /></el-icon>
        返回首页
      </el-button>
      <div class="page-title">📚 AI资源生成中心</div>
      <div class="page-subtitle">基于大语言模型的智能学习资源生成与个性化推荐</div>
    </div>
    
    <div class="card input-card">
      <el-form :model="generateForm" inline>
        <el-form-item label="知识点">
          <el-input 
            v-model="generateForm.topic" 
            placeholder="输入知识点，如：线性回归"
            style="width: 300px;"
          />
        </el-form-item>
        <el-form-item label="资源类型">
          <el-select v-model="generateForm.type" placeholder="选择类型">
            <el-option label="课程讲解文档" value="document" />
            <el-option label="知识思维导图" value="mindmap" />
            <el-option label="智能题库" value="questions" />
            <el-option label="代码实践案例" value="code" />
            <el-option label="教学PPT" value="ppt" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="generateResource" :loading="generating">
            <el-icon><Brush /></el-icon>
            AI生成
          </el-button>
          <el-button type="success" @click="getRecommendations" :loading="recommending">
            ✨
            获取推荐
          </el-button>
        </el-form-item>
      </el-form>
    </div>
    
    <div class="card-section">
      <div class="card resource-types">
        <h3 style="margin-bottom: 20px; font-size: 16px; font-weight: 600;">资源类型</h3>
        <div class="type-grid">
          <div 
            v-for="(type, index) in resourceTypes" 
            :key="index" 
            :class="['type-card', { active: generateForm.type === type.value }]"
            @click="selectType(type.value)"
          >
            <div class="type-icon">{{ type.icon }}</div>
            <div class="type-name">{{ type.name }}</div>
            <div class="type-desc">{{ type.desc }}</div>
          </div>
        </div>
      </div>
      
      <div class="card result-card">
        <div class="result-header">
          <h3 style="font-size: 16px; font-weight: 600;">生成结果</h3>
          <div class="result-actions">
            <el-button type="text" @click="copyResult" v-if="generatedContent">
              <el-icon><CopyDocument /></el-icon>
              复制
            </el-button>
            <el-button type="text" @click="downloadResult" v-if="generatedContent">
              <el-icon><Download /></el-icon>
              下载
            </el-button>
          </div>
        </div>
        
        <div v-if="!generatedContent" class="empty-result">
          <el-icon size="48" style="color: #c0c4cc;">📄</el-icon>
          <p>输入知识点并选择资源类型，点击生成按钮</p>
        </div>
        
        <div v-else class="result-content">
          <div v-if="generateForm.type === 'mindmap'" class="mindmap-container">
            <div 
              ref="mindmapRef" 
              id="mindmap-container" 
              class="mindmap-render"
              @click="openFullscreen"
            ></div>
            <div class="mindmap-code-toggle" @click="showMindmapCode = !showMindmapCode">
              {{ showMindmapCode ? '隐藏代码' : '查看代码' }}
            </div>
            <pre v-if="showMindmapCode" class="mindmap-code">{{ generatedContent }}</pre>
          </div>
          <div v-else-if="generateForm.type === 'code'" class="code-container">
            <pre class="code-block"><code>{{ generatedContent }}</code></pre>
          </div>
          <div v-else-if="generateForm.type === 'ppt'" class="ppt-container">
            <div v-if="parsedPpt && parsedPpt.length > 0">
              <div 
                v-for="(slide, index) in parsedPpt" 
                :key="index" 
                class="ppt-slide"
              >
                <div class="ppt-slide-header">
                  <span class="ppt-slide-num">{{ index + 1 }}</span>
                  <span class="ppt-slide-title">{{ slide.title }}</span>
                </div>
                <div class="ppt-slide-content">
                  <ul>
                    <li v-for="(point, pIndex) in slide.points" :key="pIndex" class="ppt-point">{{ point }}</li>
                  </ul>
                </div>
              </div>
            </div>
            <div v-else class="empty-ppt">
              <p>暂无PPT内容，请重试</p>
            </div>
          </div>
          <div v-else-if="generateForm.type === 'reading'" class="reading-container">
            <div v-if="parsedReading && parsedReading.length > 0">
              <div 
                v-for="(item, index) in parsedReading" 
                :key="index" 
                class="reading-item"
              >
                <div class="reading-header">
                  <span class="reading-num">{{ index + 1 }}</span>
                  <el-tag :type="getRelevanceTag(item.relevance)">{{ item.relevance }}分</el-tag>
                  <el-tag size="small" type="info">{{ item.type }}</el-tag>
                </div>
                <div class="reading-title">{{ item.title }}</div>
                <div class="reading-author">作者：{{ item.author }} | 来源：{{ item.source }}</div>
                <div class="reading-summary">{{ item.summary }}</div>
              </div>
            </div>
            <div v-else class="empty-reading">
              <p>暂无阅读材料，请重试</p>
            </div>
          </div>
          <div v-else-if="generateForm.type === 'video_script'" class="video-script-container">
            <div v-if="parsedVideoScript">
              <div class="script-header">
                <h3>{{ parsedVideoScript.title }}</h3>
                <el-tag type="primary">预计时长：{{ parsedVideoScript.duration }}分钟</el-tag>
              </div>
              <div class="scenes-list">
                <div 
                  v-for="(scene, index) in parsedVideoScript.scenes" 
                  :key="index" 
                  class="scene-item"
                >
                  <div class="scene-time">{{ scene.time }}</div>
                  <div class="scene-content">
                    <div class="scene-title">{{ scene.title }}</div>
                    <div class="scene-desc">{{ scene.content }}</div>
                    <div class="scene-visual">🎬 {{ scene.visual }}</div>
                    <div class="scene-audio">🎙️ {{ scene.audio }}</div>
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="empty-script">
              <p>暂无视频脚本，请重试</p>
            </div>
          </div>
          <div v-else-if="generateForm.type === 'questions'" class="questions-container">
            <div 
              v-for="(question, qIndex) in parsedQuestions" 
              :key="qIndex" 
              class="question-item"
            >
              <div class="question-header">
                <span class="question-num">{{ qIndex + 1 }}</span>
                <el-tag :type="getDifficultyTag(question.difficulty)">{{ question.difficulty }}</el-tag>
                <el-tag size="small" type="info">
                  {{ getQTypeLabel(question.qtype) }}
                </el-tag>
              </div>
              <div class="question-text">{{ question.question }}</div>
              
              <div v-if="question.qtype === 'choice' && question.options && question.options.length > 0" class="options-section">
                <div 
                  v-for="(option, oIndex) in question.options" 
                  :key="oIndex" 
                  :class="['option-item', { 'correct': question.answer && String(question.answer).includes(['A','B','C','D'][oIndex]) }]"
                >
                  <span class="option-label">{{ ['A','B','C','D'][oIndex] }}.</span>
                  <span class="option-text">{{ option }}</span>
                </div>
              </div>
              
              
              <div v-if="question.qtype === 'fill'" class="fill-blank-section">
                <div class="blank-hint">请填写答案：</div>
                <div class="blank-line"></div>
              </div>
              
              <div class="answer-section">
                <div class="answer-label">{{ getAnswerLabel(question.qtype) }}</div>
                <div class="answer-text">{{ question.answer }}</div>
              </div>
              
              <div v-if="question.analysis" class="analysis-section">
                <div class="analysis-label">解析：</div>
                <div class="analysis-text">{{ question.analysis }}</div>
              </div>
            </div>
          </div>
          <div v-else class="markdown-container">
            <div v-html="renderMarkdown(generatedContent)"></div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="card recommendations-card">
      <h3 style="margin-bottom: 20px; font-size: 16px; font-weight: 600;">📌 智能推荐资源</h3>
      <div v-if="recommendations.length === 0" class="empty-recommendations">
        <el-icon size="48" style="color: #c0c4cc;">✨</el-icon>
        <p>点击"获取推荐"按钮，根据你的学习画像获取个性化资源推荐</p>
      </div>
      <div v-else class="recommendations-grid">
        <div 
          v-for="(rec, index) in recommendations" 
          :key="index" 
          :class="['recommendation-card', rec.priority]"
        >
          <div class="rec-icon">{{ getRecIcon(rec.type) }}</div>
          <div class="rec-content">
            <div class="rec-title">{{ rec.title }}</div>
            <div class="rec-desc">{{ rec.description }}</div>
            <div class="rec-reason">{{ rec.reason }}</div>
          </div>
          <div class="rec-meta">
            <el-tag :type="getPriorityTag(rec.priority)">{{ rec.priority }}</el-tag>
            <div class="rec-relevance">
              <span class="relevance-label">匹配度</span>
              <el-progress :percentage="rec.relevance" :stroke-width="6" />
            </div>
          </div>
          <el-button size="small" type="primary" @click="generateRecommended(rec.title)">
            生成
          </el-button>
        </div>
      </div>
    </div>
    
    <div class="card history-card">
      <h3 style="margin-bottom: 20px; font-size: 16px; font-weight: 600;">生成历史</h3>
      <el-table :data="historyList" border>
        <el-table-column prop="topic" label="知识点" width="200" />
        <el-table-column prop="type" label="类型" width="150" />
        <el-table-column prop="time" label="生成时间" width="180" />
        <el-table-column label="操作" width="120">
          <template #default="{ row }">
            <el-button size="small" @click="viewHistory(row)">查看</el-button>
            <el-button size="small" type="danger" @click="deleteHistory(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
  
  <Teleport to="body">
    <div v-if="showFullscreen" class="mindmap-fullscreen" @click.self="closeFullscreen">
      <div class="fullscreen-header">
        <span class="fullscreen-title">思维导图 - {{ generateForm.topic }}</span>
        <button class="fullscreen-close" @click="closeFullscreen">
          <span>×</span>
        </button>
      </div>
      <div class="fullscreen-content">
        <div id="mindmap-fullscreen-container" class="mindmap-fullscreen-render"></div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Brush, CopyDocument, Download, ArrowLeft } from '@element-plus/icons-vue'
import { agentApi } from '../api/agent'
import katex from 'katex'
import 'katex/dist/katex.min.css'
import mermaid from 'mermaid'

mermaid.initialize({
  startOnLoad: true,
  theme: 'default',
  themeVariables: {
    primaryColor: '#667eea',
    primaryTextColor: '#333',
    primaryBorderColor: '#667eea',
    lineColor: '#667eea',
    secondaryColor: '#f5f7fa',
    tertiaryColor: '#e4e7ed'
  }
})

const router = useRouter()

const goToHome = () => {
  router.push('/')
}

const generateForm = ref({
  topic: '',
  type: ''
})

const generating = ref(false)
const generatedContent = ref('')
const recommending = ref(false)
const recommendations = ref([])
const mindmapRef = ref(null)
const showMindmapCode = ref(false)
const showFullscreen = ref(false)

const openFullscreen = async () => {
  showFullscreen.value = true
  await renderFullscreenMindmap()
}

const closeFullscreen = () => {
  showFullscreen.value = false
}

const resourceTypes = [
  { icon: '📄', name: '课程讲解文档', value: 'document', desc: 'Markdown格式的知识点讲解' },
  { icon: '🧠', name: '知识思维导图', value: 'mindmap', desc: 'Mermaid格式的思维导图' },
  { icon: '📝', name: '智能题库', value: 'questions', desc: '基础题/进阶题/编程题' },
  { icon: '💻', name: '代码实践案例', value: 'code', desc: 'Python代码示例' },
  { icon: '📊', name: '教学PPT', value: 'ppt', desc: '课程PPT结构' },
  { icon: '📚', name: '拓展阅读材料', value: 'reading', desc: '学术论文/技术博客/书籍推荐' },
  { icon: '🎬', name: '教学微课脚本', value: 'video_script', desc: '5-8分钟教学视频脚本' }
]

const historyList = ref([])

const parsedQuestions = ref([])
const parsedReading = ref([])
const parsedVideoScript = ref(null)
const parsedPpt = ref([])

const selectType = (type) => {
  generateForm.value.type = type
  generatedContent.value = ''
  parsedQuestions.value = []
  parsedReading.value = []
  parsedVideoScript.value = null
  parsedPpt.value = []
}

const getDifficultyTag = (difficulty) => {
  const tags = { '基础': 'info', '进阶': 'warning', '困难': 'danger' }
  return tags[difficulty] || 'info'
}

const getRelevanceTag = (relevance) => {
  if (relevance >= 4) return 'danger'
  if (relevance >= 3) return 'warning'
  return 'info'
}

const renderMarkdown = (content) => {
  let html = content
  
  html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre class="code-block"><code>$2</code></pre>')
  
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>')
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>')
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>')
  
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>')
  
  const lines = html.split('\n')
  const tableRows = []
  let inTable = false
  
  const processedLines = lines.map(line => {
    if (line.includes('|') && (line.includes('---') || line.startsWith('|'))) {
      if (!inTable) {
        inTable = true
        tableRows.push(line)
        return ''
      }
      tableRows.push(line)
      return ''
    } else if (inTable && line.trim() === '') {
      inTable = false
      return renderTable(tableRows)
    } else if (inTable) {
      tableRows.push(line)
      return ''
    }
    return line
  })
  
  html = processedLines.join('\n')
  
  html = html.replace(/\$\$(.+?)\$\$/g, (match, formula) => {
    try {
      return katex.renderToString(formula.trim(), {
        throwOnError: false,
        displayMode: true
      })
    } catch (e) {
      return match
    }
  })
  
  html = html.replace(/\$(.+?)\$/g, (match, formula) => {
    try {
      return katex.renderToString(formula.trim(), {
        throwOnError: false,
        displayMode: false
      })
    } catch (e) {
      return match
    }
  })
  
  html = html.replace(/^- (.*$)/gim, '<li>$1</li>')
  html = html.replace(/^(\d+)\. (.*$)/gim, '<li>$1. $2</li>')
  html = html.replace(/\n/g, '<br>')
  
  return html
}

const renderTable = (rows) => {
  if (rows.length < 2) return ''
  
  const header = rows[0].split('|').map(cell => cell.trim()).filter(cell => cell)
  const separator = rows[1].split('|').map(cell => cell.trim()).filter(cell => cell)
  const dataRows = rows.slice(2).filter(row => row.trim() && row.includes('|'))
  
  let html = '<table class="markdown-table">'
  html += '<thead><tr>'
  header.forEach(cell => {
    html += `<th>${cell}</th>`
  })
  html += '</tr></thead>'
  
  html += '<tbody>'
  dataRows.forEach(row => {
    const cells = row.split('|').map(cell => cell.trim()).filter(cell => cell)
    html += '<tr>'
    cells.forEach((cell, index) => {
      if (index < header.length) {
        html += `<td>${cell}</td>`
      }
    })
    html += '</tr>'
  })
  html += '</tbody></table>'
  
  return html
}

const parseQuestions = (content) => {
  try {
    const parsed = JSON.parse(content)
    if (Array.isArray(parsed)) {
      return parsed.map(q => ({
        question: q.question || '',
        options: q.options || [],
        answer: q.answer || '',
        analysis: q.analysis || q.explanation || '',
        difficulty: q.difficulty || 'medium',
        qtype: q.qtype || (q.options && q.options.length > 0 ? 'choice' : 'essay')
      }))
    }
  } catch (e) {
    console.error('Parse questions error:', e)
  }
  return []
}

const renderMindmap = async () => {
  await nextTick()
  const container = document.getElementById('mindmap-container')
  if (container && generatedContent.value) {
    container.innerHTML = ''
    try {
      const { svg } = await mermaid.render('mindmap-svg', generatedContent.value)
      container.innerHTML = svg
    } catch (e) {
      console.error('Mermaid render error:', e)
      container.innerHTML = '<p style="color: red;">思维导图渲染失败，请检查代码格式</p>'
    }
  }
}

const renderFullscreenMindmap = async () => {
  await nextTick()
  const container = document.getElementById('mindmap-fullscreen-container')
  if (container && generatedContent.value) {
    container.innerHTML = ''
    try {
      const { svg } = await mermaid.render('mindmap-fullscreen', generatedContent.value)
      container.innerHTML = svg
    } catch (e) {
      console.error('Mermaid fullscreen render error:', e)
      container.innerHTML = '<p style="color: red;">思维导图渲染失败</p>'
    }
  }
}

const generateResource = async () => {
  if (!generateForm.value.topic.trim() || !generateForm.value.type) {
    alert('请输入知识点并选择资源类型')
    return
  }
  
  generating.value = true
  try {
    const res = await agentApi.generateResource(generateForm.value.topic, generateForm.value.type)
    if (res.data && res.data.data) {
      generatedContent.value = res.data.data.content
      
      if (generateForm.value.type === 'questions') {
        parsedQuestions.value = parseQuestions(generatedContent.value)
      }
      
      if (generateForm.value.type === 'reading') {
        try {
          parsedReading.value = JSON.parse(generatedContent.value)
        } catch (e) {
          console.error('Parse reading error:', e)
          parsedReading.value = []
        }
      }
      
      if (generateForm.value.type === 'video_script') {
        try {
          parsedVideoScript.value = JSON.parse(generatedContent.value)
        } catch (e) {
          console.error('Parse video script error:', e)
          parsedVideoScript.value = null
        }
      }
      
      if (generateForm.value.type === 'ppt') {
        try {
          parsedPpt.value = JSON.parse(generatedContent.value)
        } catch (e) {
          console.error('Parse PPT error:', e)
          parsedPpt.value = []
        }
      }
      
      if (generateForm.value.type === 'mindmap') {
        await renderMindmap()
      }
      
      historyList.value.unshift({
        id: Date.now(),
        topic: generateForm.value.topic,
        type: resourceTypes.find(t => t.value === generateForm.value.type)?.name || generateForm.value.type,
        time: new Date().toLocaleString('zh-CN')
      })
    }
  } catch (error) {
    console.error('Generate resource error:', error)
    generatedContent.value = '生成失败，请稍后重试。'
  } finally {
    generating.value = false
  }
}

const copyResult = () => {
  navigator.clipboard.writeText(generatedContent.value)
  alert('已复制到剪贴板')
}

const downloadResult = () => {
  const blob = new Blob([generatedContent.value], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${generateForm.value.topic}_${generateForm.value.type}.txt`
  a.click()
  URL.revokeObjectURL(url)
}

const viewHistory = (row) => {
  console.log('View history:', row)
}

const deleteHistory = (row) => {
  const index = historyList.value.findIndex(h => h.id === row.id)
  if (index > -1) {
    historyList.value.splice(index, 1)
  }
}

const getRecommendations = async () => {
  recommending.value = true
  try {
    const res = await agentApi.getRecommendations()
    if (res.data && res.data.data) {
      recommendations.value = res.data.data.recommendations || []
    }
    if (recommendations.value.length === 0) {
      const profileRes = await agentApi.getProfile()
      const profile = profileRes.data?.data || {}
      const recRes = await agentApi.generateRecommendations(profile)
      if (recRes.data && recRes.data.data) {
        recommendations.value = recRes.data.data.recommendations || []
      }
    }
  } catch (error) {
    console.error('Get recommendations error:', error)
  } finally {
    recommending.value = false
  }
}

const getRecIcon = (type) => {
  const icons = {
    'document': '📄',
    'video': '🎬',
    'practice': '📝',
    'code': '💻',
    'article': '📰'
  }
  return icons[type] || '📚'
}

const getPriorityTag = (priority) => {
  const tags = { 'high': 'danger', 'medium': 'warning', 'low': 'info' }
  return tags[priority] || 'info'
}

const generateRecommended = (title) => {
  generateForm.value.topic = title
  generateForm.value.type = 'document'
}

const getQTypeLabel = (qtype) => {
  const labels = {
    'choice': '选择题',
    'multi': '多选题',
    'fill': '填空题',
    'essay': '简答题'
  }
  return labels[qtype] || '选择题'
}

const getAnswerLabel = (qtype) => {
  const labels = {
    'choice': '答案：',
    'multi': '答案：',
    'fill': '答案：',
    'essay': '解答：'
  }
  return labels[qtype] || '答案：'
}
</script>

<style scoped>
.resource-page {
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

.input-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

.card-section {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
  width: 100%;
  min-height: calc(100vh - 280px);
}

.resource-types {
  width: 280px;
  flex-shrink: 0;
}

.type-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.type-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  border: 2px solid transparent;
}

.type-card:hover {
  background: #e4e7ed;
}

.type-card.active {
  background: #ecf5ff;
  border-color: #409eff;
}

.type-icon {
  font-size: 28px;
}

.type-name {
  font-weight: 600;
  color: #303133;
}

.type-desc {
  font-size: 12px;
  color: #909399;
}

.result-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 100%;
}

.result-card .card {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.result-actions {
  display: flex;
  gap: 10px;
}

.empty-result {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px;
  color: #909399;
  flex: 1;
}

.result-content {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.mindmap-container {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  overflow: hidden;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.mindmap-render {
  flex: 1;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: auto;
}

.mindmap-render svg {
  max-width: 100%;
  max-height: 100%;
  height: auto;
}

.mindmap-code-toggle {
  text-align: center;
  color: #667eea;
  cursor: pointer;
  font-size: 13px;
  margin-top: 16px;
  padding: 8px;
  border: 1px dashed #667eea;
  border-radius: 4px;
  transition: all 0.2s;
}

.mindmap-code-toggle:hover {
  background: #f0f5ff;
}

.mindmap-code {
  background: #f5f7fa;
  padding: 16px;
  border-radius: 8px;
  font-family: monospace;
  font-size: 12px;
  white-space: pre-wrap;
  margin-top: 12px;
  max-height: 300px;
  overflow-y: auto;
}

.code-container {
  background: #1e1e1e;
  border-radius: 8px;
  padding: 20px;
  overflow-x: auto;
}

.code-block {
  color: #d4d4d4;
  font-family: 'Consolas', 'Monaco', monospace;
  white-space: pre-wrap;
  margin: 0;
}

.ppt-container {
  padding: 20px;
  background: #f5f7fa;
  border-radius: 8px;
}

.ppt-slide {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
  border-left: 4px solid #667eea;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.ppt-slide-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.ppt-slide-num {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #667eea;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
}

.ppt-slide-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.ppt-slide-content ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.ppt-point {
  font-size: 14px;
  color: #606266;
  padding: 8px 0;
  padding-left: 24px;
  position: relative;
  line-height: 1.5;
}

.ppt-point::before {
  content: '✓';
  position: absolute;
  left: 0;
  color: #667eea;
  font-weight: bold;
}

.empty-ppt {
  text-align: center;
  padding: 40px;
  color: #909399;
}

.reading-container {
  padding: 20px;
  background: #f5f7fa;
  border-radius: 8px;
}

.reading-item {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
  border-left: 4px solid #667eea;
}

.reading-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.reading-num {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #667eea;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
}

.reading-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 8px;
}

.reading-author {
  font-size: 13px;
  color: #909399;
  margin-bottom: 8px;
}

.reading-summary {
  font-size: 14px;
  color: #606266;
  line-height: 1.6;
}

.empty-reading {
  text-align: center;
  padding: 40px;
  color: #909399;
}

.video-script-container {
  padding: 20px;
  background: #f5f7fa;
  border-radius: 8px;
}

.script-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}

.script-header h3 {
  font-size: 18px;
  font-weight: 700;
  color: #303133;
  margin: 0;
}

.scenes-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.scene-item {
  background: white;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  gap: 16px;
}

.scene-time {
  width: 120px;
  flex-shrink: 0;
  background: #667eea;
  color: white;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  text-align: center;
}

.scene-content {
  flex: 1;
}

.scene-title {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 8px;
}

.scene-desc {
  font-size: 14px;
  color: #606266;
  margin-bottom: 8px;
  line-height: 1.5;
}

.scene-visual, .scene-audio {
  font-size: 13px;
  color: #909399;
  margin-bottom: 4px;
  padding: 4px 8px;
  background: #f0f0f0;
  border-radius: 4px;
  display: inline-block;
  margin-right: 8px;
}

.empty-script {
  text-align: center;
  padding: 40px;
  color: #909399;
}

.questions-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.question-item {
  background: #f5f7fa;
  border-radius: 12px;
  padding: 20px;
}

.question-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.question-num {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #667eea;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
}

.question-text {
  font-size: 14px;
  color: #303133;
  margin-bottom: 12px;
}

.options-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}

.option-item {
  display: flex;
  align-items: flex-start;
  padding: 10px 14px;
  background: white;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
  transition: all 0.2s;
}

.option-item:hover {
  border-color: #c0c4cc;
}

.option-item.correct {
  background: #f0f9eb;
  border-color: #67c23a;
}

.option-item.correct .option-label {
  background: #67c23a;
  color: white;
}

.option-label {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #f0f0f0;
  color: #606266;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  margin-right: 12px;
  flex-shrink: 0;
}

.option-text {
  font-size: 13px;
  color: #303133;
  line-height: 1.5;
}

.fill-blank-section {
  margin-bottom: 12px;
  padding: 16px;
  background: #fffbe6;
  border-radius: 8px;
  border: 1px dashed #e6a23c;
}

.blank-hint {
  font-size: 13px;
  color: #909399;
  margin-bottom: 8px;
}

.blank-line {
  height: 2px;
  background: #e6a23c;
  width: 100%;
}

.answer-section, .analysis-section {
  margin-bottom: 8px;
}

.answer-label, .analysis-label {
  font-size: 13px;
  font-weight: 600;
  color: #606266;
}

.answer-text, .analysis-text {
  font-size: 13px;
  color: #303133;
  margin-left: 8px;
}

.markdown-container {
  padding: 20px;
  background: #f5f7fa;
  border-radius: 8px;
}

.markdown-container h1, .markdown-container h2, .markdown-container h3 {
  color: #303133;
  margin: 16px 0;
}

.markdown-container strong {
  color: #667eea;
}

.markdown-container pre {
  background: #1e1e1e;
  color: #d4d4d4;
  padding: 16px;
  border-radius: 8px;
  overflow-x: auto;
}

.markdown-container li {
  margin-left: 20px;
}

.history-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

.recommendations-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

.empty-recommendations {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  color: #909399;
}

.recommendations-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 16px;
}

.recommendation-card {
  background: #f5f7fa;
  border-radius: 12px;
  padding: 20px;
  border-left: 4px solid #667eea;
  transition: all 0.3s;
}

.recommendation-card.high {
  border-left-color: #f56c6c;
  background: linear-gradient(90deg, #fef0f0 0%, #f5f7fa 100%);
}

.recommendation-card.medium {
  border-left-color: #e6a23c;
  background: linear-gradient(90deg, #fdf6ec 0%, #f5f7fa 100%);
}

.recommendation-card.low {
  border-left-color: #909399;
}

.recommendation-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}

.rec-icon {
  font-size: 32px;
  margin-bottom: 12px;
}

.rec-title {
  font-size: 16px;
  font-weight: 700;
  color: #303133;
  margin-bottom: 8px;
}

.rec-desc {
  font-size: 14px;
  color: #606266;
  margin-bottom: 8px;
  line-height: 1.5;
}

.rec-reason {
  font-size: 12px;
  color: #909399;
  background: #e4e7ed;
  padding: 6px 10px;
  border-radius: 4px;
  margin-bottom: 12px;
}

.rec-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.rec-relevance {
  flex: 1;
}

.relevance-label {
  font-size: 12px;
  color: #909399;
  display: block;
  margin-bottom: 4px;
}

.markdown-table {
  width: 100%;
  border-collapse: collapse;
  margin: 16px 0;
  font-size: 14px;
}

.markdown-table th,
.markdown-table td {
  border: 1px solid #e4e7ed;
  padding: 12px 16px;
  text-align: left;
}

.markdown-table th {
  background: #f5f7fa;
  font-weight: 600;
  color: #606266;
}

.markdown-table tr:hover {
  background: #fafafa;
}

.markdown-table tr:nth-child(even) {
  background: #fafafa;
}

.mindmap-container {
  background: #fff;
  border-radius: 8px;
  padding: 0;
  overflow: hidden;
  min-height: 500px;
  display: flex;
  flex-direction: column;
}

.mindmap-render {
  flex: 1;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: zoom-in;
  padding: 20px;
  box-sizing: border-box;
  min-height: 400px;
}

.mindmap-render svg {
  max-width: 100%;
  max-height: 100%;
  height: auto;
}

.mindmap-code-toggle {
  text-align: center;
  color: #667eea;
  cursor: pointer;
  font-size: 13px;
  padding: 12px;
  border-top: 1px dashed #e4e7ed;
  transition: all 0.2s;
}

.mindmap-code-toggle:hover {
  background: #f0f5ff;
}

.mindmap-code {
  background: #f5f7fa;
  padding: 16px;
  font-family: monospace;
  font-size: 12px;
  white-space: pre-wrap;
  max-height: 200px;
  overflow-y: auto;
  border-top: 1px dashed #e4e7ed;
}

.mindmap-fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.95);
  z-index: 9999;
  display: flex;
  flex-direction: column;
}

.fullscreen-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 30px;
  background: rgba(0, 0, 0, 0.8);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.fullscreen-title {
  color: #fff;
  font-size: 18px;
  font-weight: 600;
}

.fullscreen-close {
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: #fff;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  font-size: 28px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.fullscreen-close:hover {
  background: rgba(255, 255, 255, 0.2);
}

.fullscreen-content {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  overflow: auto;
}

.mindmap-fullscreen-render {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.mindmap-fullscreen-render svg {
  max-width: 100%;
  max-height: 100%;
  width: auto;
  height: auto;
}

.mindmap-fullscreen-render svg g {
  transform-origin: center;
}
</style>
