<template>
  <div class="path-page">
    <div class="page-header">
      <el-button type="text" @click="goToHome" class="back-btn">
        <el-icon><ArrowLeft /></el-icon>
        返回首页
      </el-button>
      <div class="page-title">🧭 个性化学习路径</div>
      <div class="page-subtitle">基于 AI 的学习路径规划和资源推送</div>
    </div>
    
    <div v-if="planData.length === 0" class="empty-state">
      <div class="empty-icon">🧭</div>
      <h3>暂无学习路径</h3>
      <p>AI 将根据您的学习画像和知识库知识点，为您生成专属学习路线</p>
      <el-button type="primary" size="large" @click="generatePlan" :loading="generating">生成学习路径</el-button>
    </div>
    
    <template v-else>
      <div class="card action-card">
        <div class="action-header">
          <div class="action-info">
            <span class="action-label">当前版本</span>
            <span class="action-value">V{{ currentVersion }}</span>
            <span class="action-label">学习进度</span>
            <span class="action-value highlight">{{ progressPercent }}%</span>
          </div>
          <div class="action-btns">
            <el-button type="warning" @click="adjustPlan" :loading="adjusting">
              🔧 智能调整路径
            </el-button>
            <el-button type="primary" @click="generatePlan" :loading="generating">
              <el-icon><Refresh /></el-icon>
              重新生成路径
            </el-button>
          </div>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
        </div>
        <div class="progress-info">
          <span>已完成 {{ completedSteps }} / {{ totalSteps }} 个步骤</span>
          <span>预计总时长 {{ totalHours }}h</span>
        </div>
      </div>
      
      <div class="main-content">
        <div class="timeline-section">
          <div class="card timeline-card">
            <h3 class="card-title">📋 学习路线</h3>
            <div class="timeline-container">
              <div 
                v-for="(step, index) in planData" 
                :key="index" 
                :class="['timeline-item', step.status]"
              >
                <div class="timeline-marker">
                  <div class="marker-circle" :class="step.status">
                    <span v-if="step.status === 'completed'">✓</span>
                    <span v-else-if="step.status === 'in_progress'">●</span>
                    <span v-else>{{ step.step }}</span>
                  </div>
                  <div v-if="index < planData.length - 1" class="marker-line"></div>
                </div>
                
                <div class="timeline-content">
                  <div class="step-header">
                    <div class="step-title-row">
                      <span class="step-number">步骤 {{ step.step }}</span>
                      <span class="step-title">{{ step.title }}</span>
                    </div>
                    <div class="step-badges">
                      <el-tag :type="getStageTag(step.stage)" size="small">{{ step.stage }}</el-tag>
                      <el-tag v-if="step.subject" size="small">{{ step.subject }}</el-tag>
                    </div>
                  </div>
                  
                  <div class="step-info">
                    <div class="info-item">
                      <span class="info-icon">📚</span>
                      <span>章节：{{ step.chapter || '-' }}</span>
                    </div>
                    <div class="info-item">
                      <span class="info-icon">⏱️</span>
                      <span>预计时长：{{ step.estimated_time }}小时</span>
                    </div>
                    <div v-if="step.prerequisites && step.prerequisites.length > 0" class="info-item">
                      <span class="info-icon">🔗</span>
                      <span>前置步骤：{{ step.prerequisites.join(', ') }}</span>
                    </div>
                  </div>
                  
                  <div class="goals-section">
                    <h4>🎯 学习目标</h4>
                    <ul class="goals-list">
                      <li v-for="(goal, gIndex) in step.goals" :key="gIndex">{{ goal }}</li>
                    </ul>
                  </div>
                  
                  <div class="resources-section">
                    <h4>📦 配套资源</h4>
                    <div class="resource-grid">
                      <div 
                        v-for="(resource, rIndex) in (step.resources || [])" 
                        :key="rIndex" 
                        class="resource-card"
                        @click="viewResource(resource)"
                      >
                        <span class="resource-icon">{{ getResourceIcon(resource.type) }}</span>
                        <div class="resource-info">
                          <span class="resource-name">{{ resource.name }}</span>
                          <span class="resource-type">{{ getResourceTypeName(resource.type) }}</span>
                        </div>
                        <el-icon class="arrow-icon"><ArrowRight /></el-icon>
                      </div>
                    </div>
                  </div>
                  
                  <div class="action-buttons">
                    <el-button 
                      v-if="step.status === 'pending'" 
                      type="primary" 
                      @click="startStep(step)"
                    >
                      <el-icon><VideoPlay /></el-icon>
                      开始学习
                    </el-button>
                    <el-button 
                      v-if="step.status === 'in_progress'" 
                      type="success" 
                      @click="completeStep(step)"
                    >
                      <el-icon><CircleCheck /></el-icon>
                      标记完成
                    </el-button>
                    <el-button 
                      v-if="step.status === 'completed'" 
                      type="text" 
                      @click="reviewStep(step)"
                    >
                      <el-icon><Refresh /></el-icon>
                      复习
                    </el-button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="side-panel">
          <div class="card version-card">
            <h3 class="card-title">📜 版本历史</h3>
            <div v-if="versions.length > 0" class="version-list">
              <div 
                v-for="version in versions" 
                :key="version.version" 
                :class="['version-item', { active: version.version === currentVersion }]"
              >
                <div class="version-header">
                  <span class="version-label">V{{ version.version }}</span>
                  <span class="version-time">{{ formatTime(version.created_at) }}</span>
                </div>
                <div class="version-stats">
                  <span>完成 {{ version.completed_steps }}/{{ version.total_steps }} 步</span>
                </div>
              </div>
            </div>
            <div v-else class="empty-version">
              <p>暂无版本历史</p>
            </div>
          </div>
          
          <div class="card summary-card">
            <h3 class="card-title">💡 AI 路线说明</h3>
            <div class="summary-content">
              <p v-if="aiSummary">{{ aiSummary }}</p>
              <p v-else class="no-summary">学习路径由 AI 根据您的学习画像和知识库知识点自动生成，会随学情变化动态调整</p>
            </div>
          </div>
          
          <div class="card stats-card">
            <h3 class="card-title">📊 学习统计</h3>
            <div class="stat-grid">
              <div class="stat-item">
                <div class="stat-icon">📚</div>
                <div class="stat-value">{{ totalResources }}</div>
                <div class="stat-label">总资源数</div>
              </div>
              <div class="stat-item">
                <div class="stat-icon">✅</div>
                <div class="stat-value">{{ completedResources }}</div>
                <div class="stat-label">已完成资源</div>
              </div>
              <div class="stat-item">
                <div class="stat-icon">⏱️</div>
                <div class="stat-value">{{ totalHours }}h</div>
                <div class="stat-label">预计时长</div>
              </div>
              <div class="stat-item">
                <div class="stat-icon">🎯</div>
                <div class="stat-value">{{ currentWeek }}</div>
                <div class="stat-label">当前周</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { Refresh, ArrowRight, VideoPlay, CircleCheck, ArrowLeft } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { agentApi } from '../api/agent'

const router = useRouter()
const planData = ref([])
const generating = ref(false)
const adjusting = ref(false)
const versions = ref([])
const aiSummary = ref('')

const totalSteps = computed(() => planData.value.length)
const completedSteps = computed(() => planData.value.filter(s => s.status === 'completed').length)
const progressPercent = computed(() => totalSteps.value > 0 ? Math.round((completedSteps.value / totalSteps.value) * 100) : 0)
const currentVersion = computed(() => {
  if (planData.value.length > 0) {
    return planData.value[0].plan_version || 1
  }
  return 1
})
const currentWeek = computed(() => {
  const inProgress = planData.value.find(s => s.status === 'in_progress')
  if (inProgress) return `第${inProgress.week}周`
  const completed = planData.value.filter(s => s.status === 'completed')
  if (completed.length > 0) return `第${completed[completed.length - 1].week}周`
  return '第1周'
})
const totalHours = computed(() => {
  let hours = 0
  planData.value.forEach(s => {
    const match = (s.estimated_time || '').toString().match(/(\d+)/)
    if (match) hours += parseInt(match[1])
  })
  return hours
})
const totalResources = computed(() => planData.value.reduce((sum, s) => sum + (s.resources ? s.resources.length : 0), 0))
const completedResources = computed(() => {
  const completedSteps = planData.value.filter(s => s.status === 'completed')
  return completedSteps.reduce((sum, s) => sum + (s.resources ? s.resources.length : 0), 0)
})

const getStageTag = (stage) => {
  const tags = {
    '基础概念学习': 'info',
    '核心原理学习': 'primary',
    '习题练习': 'warning',
    '进阶练习': 'danger',
    '项目实操': 'success'
  }
  return tags[stage] || 'info'
}

const getResourceIcon = (type) => {
  const icons = {
    'document': '📄',
    'mindmap': '🧠',
    'exercise': '📝',
    'code': '💻',
    'video': '🎬'
  }
  return icons[type] || '📄'
}

const getResourceTypeName = (type) => {
  const names = {
    'document': '文档',
    'mindmap': '思维导图',
    'exercise': '习题',
    'code': '代码案例',
    'video': '视频'
  }
  return names[type] || '资源'
}

const formatTime = (timestamp) => {
  try {
    const date = new Date(timestamp)
    return date.toLocaleString('zh-CN')
  } catch {
    return timestamp || '-'
  }
}

const viewResource = (resource) => {
  if (resource.type === 'document') {
    router.push('/knowledge')
  } else if (resource.type === 'mindmap' || resource.type === 'exercise') {
    router.push('/resources')
  } else if (resource.type === 'code') {
    router.push('/resources')
  }
  ElMessage.info(`正在打开：${resource.name}`)
}

const goToHome = () => {
  router.push('/')
}

const startStep = async (step) => {
  try {
    await agentApi.updatePlanStatus(step.step, 'in_progress')
    step.status = 'in_progress'
    ElMessage.success(`开始学习：${step.title}`)
  } catch (error) {
    console.error('Start step error:', error)
    ElMessage.error('更新状态失败')
  }
}

const completeStep = async (step) => {
  try {
    await agentApi.updatePlanStatus(step.step, 'completed')
    step.status = 'completed'
    ElMessage.success(`完成学习：${step.title}`)
  } catch (error) {
    console.error('Complete step error:', error)
    ElMessage.error('更新状态失败')
  }
}

const reviewStep = async (step) => {
  try {
    await agentApi.updatePlanStatus(step.step, 'in_progress')
    step.status = 'in_progress'
    ElMessage.info(`开始复习：${step.title}`)
  } catch (error) {
    console.error('Review step error:', error)
    ElMessage.error('更新状态失败')
  }
}

const adjustPlan = async () => {
  adjusting.value = true
  try {
    const evaluationResult = {
      score: progressPercent.value,
      completed_steps: completedSteps.value,
      total_steps: totalSteps.value,
      update_reason: '智能调整：基于学习进度和错题评估'
    }
    const res = await agentApi.adjustPlan(evaluationResult)
    if (res.data && res.data.data) {
      planData.value = res.data.data.plan || planData.value
      ElMessage.success('学习路径已根据当前进度智能调整！')
      await loadPlanVersions()
    }
  } catch (error) {
    console.error('Adjust plan error:', error)
    ElMessage.error('调整路径失败')
  } finally {
    adjusting.value = false
  }
}

const generatePlan = async () => {
  generating.value = true
  try {
    let res = await agentApi.getPlan()
    if (res.data && res.data.data && res.data.data.length > 0) {
      planData.value = res.data.data
    } else {
      res = await agentApi.createPlan()
      if (res.data && res.data.data) {
        planData.value = res.data.data
      }
    }
    await loadPlanVersions()
  } catch (error) {
    console.error('Generate plan error:', error)
    planData.value = []
    ElMessage.error('生成学习路径失败')
  } finally {
    generating.value = false
  }
}

const loadPlanVersions = async () => {
  try {
    const res = await agentApi.getPlan()
    if (res.data && res.data.data) {
      const versionMap = new Map()
      res.data.data.forEach(step => {
        const v = step.plan_version || 1
        if (!versionMap.has(v)) {
          versionMap.set(v, {
            version: v,
            created_at: step.update_history?.[0]?.timestamp || '',
            completed_steps: 0,
            total_steps: 0
          })
        }
        versionMap.get(v).total_steps++
        if (step.status === 'completed') {
          versionMap.get(v).completed_steps++
        }
      })
      versions.value = Array.from(versionMap.values()).sort((a, b) => b.version - a.version)
    }
  } catch (error) {
    console.error('Load versions error:', error)
  }
}

onMounted(async () => {
  await generatePlan()
})
</script>

<style scoped>
.path-page {
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

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100px 40px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.empty-icon {
  font-size: 80px;
  margin-bottom: 24px;
}

.empty-state h3 {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 12px;
}

.empty-state p {
  font-size: 14px;
  color: #909399;
  margin-bottom: 32px;
}

.action-card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.action-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.action-info {
  display: flex;
  gap: 16px;
  align-items: center;
}

.action-label {
  font-size: 14px;
  color: #909399;
}

.action-value {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.action-value.highlight {
  color: #667eea;
}

.action-btns {
  display: flex;
  gap: 12px;
}

.progress-bar {
  height: 10px;
  background: #f0f0f0;
  border-radius: 5px;
  overflow: hidden;
  margin-bottom: 12px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  border-radius: 5px;
  transition: width 0.5s ease;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  color: #606266;
}

.main-content {
  display: flex;
  gap: 24px;
}

.timeline-section {
  flex: 1;
}

.timeline-card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 20px;
}

.timeline-container {
  max-width: 900px;
}

.timeline-item {
  display: flex;
  gap: 24px;
  margin-bottom: 32px;
}

.timeline-item:last-child {
  margin-bottom: 0;
}

.timeline-marker {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 48px;
}

.marker-circle {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #f5f7fa;
  border: 3px solid #e4e7ed;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  color: #909399;
  transition: all 0.3s;
}

.timeline-item.completed .marker-circle {
  background: #67c23a;
  border-color: #67c23a;
  color: white;
}

.timeline-item.in_progress .marker-circle {
  background: #e6a23c;
  border-color: #e6a23c;
  color: white;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

.marker-line {
  width: 3px;
  flex: 1;
  min-height: 100px;
  background: #e4e7ed;
  margin-top: 8px;
}

.timeline-content {
  flex: 1;
  background: #fafafa;
  border-radius: 16px;
  padding: 24px;
  border-left: 4px solid #e4e7ed;
  transition: all 0.3s;
}

.timeline-item.completed .timeline-content {
  border-left-color: #67c23a;
  background: #f0f9eb;
}

.timeline-item.in_progress .timeline-content {
  border-left-color: #e6a23c;
  background: #fdf6ec;
}

.step-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.step-title-row {
  display: flex;
  gap: 12px;
  align-items: center;
}

.step-number {
  font-size: 13px;
  font-weight: 600;
  color: #667eea;
  background: #eef2ff;
  padding: 4px 10px;
  border-radius: 4px;
}

.step-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.step-badges {
  display: flex;
  gap: 8px;
}

.step-info {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  margin-bottom: 16px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: #606266;
}

.info-icon {
  font-size: 16px;
}

.goals-section {
  margin-bottom: 16px;
}

.goals-section h4 {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 10px;
}

.goals-list {
  margin: 0;
  padding-left: 20px;
}

.goals-list li {
  font-size: 14px;
  color: #606266;
  margin-bottom: 6px;
}

.resources-section {
  margin-bottom: 16px;
}

.resources-section h4 {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 10px;
}

.resource-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 10px;
}

.resource-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: white;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid #f0f0f0;
}

.resource-card:hover {
  background: #f5f7fa;
  border-color: #667eea;
}

.resource-icon {
  font-size: 24px;
}

.resource-info {
  flex: 1;
}

.resource-name {
  font-size: 13px;
  font-weight: 500;
  color: #303133;
  display: block;
}

.resource-type {
  font-size: 12px;
  color: #909399;
}

.arrow-icon {
  color: #c0c4cc;
  font-size: 16px;
}

.action-buttons {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.side-panel {
  width: 360px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.version-card,
.summary-card,
.stats-card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.version-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.version-item {
  padding: 12px;
  background: #f8f9fa;
  border-radius: 10px;
  border-left: 4px solid #e4e7ed;
}

.version-item.active {
  background: #eef2ff;
  border-left-color: #667eea;
}

.version-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.version-label {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.version-time {
  font-size: 12px;
  color: #909399;
}

.version-stats {
  font-size: 13px;
  color: #606266;
}

.empty-version {
  text-align: center;
  padding: 20px;
  color: #909399;
}

.summary-content p {
  font-size: 14px;
  line-height: 1.8;
  color: #606266;
  margin: 0;
}

.no-summary {
  color: #909399;
  font-style: italic;
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.stat-item {
  text-align: center;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 12px;
}

.stat-icon {
  font-size: 28px;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 22px;
  font-weight: 700;
  color: #667eea;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  color: #909399;
}
</style>