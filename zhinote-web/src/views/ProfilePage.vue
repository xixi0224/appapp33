<template>
  <div class="profile-page">
    <div class="page-header">
      <el-button type="text" @click="goToHome" class="back-btn">
        <el-icon><ArrowLeft /></el-icon>
        返回首页
      </el-button>
      <div class="page-title">🧠 学习画像系统</div>
      <div class="page-subtitle">基于 AI 的对话式学习画像自主构建</div>
    </div>
    
    <div v-if="!hasProfile" class="empty-state">
      <div class="empty-icon">🧠</div>
      <h3>暂无学习画像</h3>
      <p>通过对话式交互，AI 将自动为您构建专属学习画像</p>
      <el-button type="primary" size="large" @click="goToChat">去创建画像</el-button>
    </div>
    
    <template v-else>
      <div class="profile-content">
        <div class="main-section">
          <div class="card radar-card">
            <h3 class="card-title">📊 六维能力雷达图</h3>
            <div ref="radarChartRef" class="radar-chart-container"></div>
            <div class="radar-legend">
              <div v-for="(dim, index) in dimensions" :key="index" class="legend-item">
                <div class="legend-dot"></div>
                <span class="legend-name">{{ dim.name }}</span>
                <span class="legend-value">{{ getDimensionValue(index) }}%</span>
              </div>
            </div>
          </div>
          
          <div class="card summary-card">
            <h3 class="card-title">📝 AI 学情总结</h3>
            <div class="summary-content">
              <p v-if="profile.ai_summary">{{ profile.ai_summary }}</p>
              <p v-else class="no-summary">暂无 AI 生成的学情总结，画像将随学习不断完善</p>
            </div>
          </div>
        </div>
        
        <div class="info-section">
          <div class="card info-card">
            <h3 class="card-title">👤 基础信息</h3>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">专业方向</span>
                <span class="info-value">{{ profile.major || '未设置' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">学习阶段</span>
                <span class="info-value">{{ getLearningStage() }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">学习模式</span>
                <span class="info-value">{{ getLearningMode() }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">适配方式</span>
                <span class="info-value">{{ getAdaptationMode() }}</span>
              </div>
            </div>
          </div>
          
          <div class="card weak-card">
            <h3 class="card-title">⚠️ 薄弱知识点</h3>
            <div v-if="profile.weak_points && profile.weak_points.length > 0" class="weak-list">
              <div 
                v-for="(point, index) in profile.weak_points" 
                :key="index" 
                class="weak-item"
              >
                <el-tag type="danger" size="small">{{ point }}</el-tag>
              </div>
            </div>
            <div v-else class="empty-weak">
              <p>暂无薄弱知识点记录</p>
            </div>
          </div>
        </div>
        
        <div class="detail-section">
          <div class="card history-card">
            <h3 class="card-title">📜 更新记录</h3>
            <div v-if="profile.update_history && profile.update_history.length > 0" class="history-timeline">
              <div 
                v-for="(record, index) in profile.update_history" 
                :key="index" 
                class="history-item"
              >
                <div class="timeline-dot"></div>
                <div class="timeline-content">
                  <div class="timeline-time">{{ formatTime(record.timestamp) }}</div>
                  <div class="timeline-reason">{{ record.reason }}</div>
                  <div class="timeline-changes">
                    <span v-for="(val, key) in record.dimensions" :key="key" class="change-tag">
                      {{ getDimensionName(key) }}: {{ val }}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="empty-history">
              <p>暂无更新记录</p>
            </div>
          </div>
          
          <div class="card json-card">
            <div class="card-header">
              <h3 class="card-title">📄 原始 JSON 数据</h3>
              <el-button size="small" @click="showJson = !showJson">
                {{ showJson ? '隐藏' : '展开' }}
              </el-button>
            </div>
            <div v-if="showJson" class="json-content">
              <pre>{{ JSON.stringify(profile, null, 2) }}</pre>
            </div>
          </div>
        </div>
        
        <div class="card action-card">
          <div class="action-content">
            <div class="action-info">
              <span class="action-label">最后更新时间</span>
              <span class="action-value">{{ formatTime(profile.updated_at) }}</span>
            </div>
            <div class="action-buttons">
              <el-button type="primary" @click="goToChat">💬 继续完善画像</el-button>
              <el-button @click="refreshProfile">🔄 刷新画像</el-button>
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
import { ArrowLeft } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import { agentApi } from '../api/agent'

const router = useRouter()
const profile = ref(null)
const showJson = ref(false)
const radarChartRef = ref(null)
let radarChart = null

const hasProfile = computed(() => {
  return profile.value && Object.keys(profile.value).length > 0
})

const dimensions = [
  { name: '知识基础', key: 'knowledge_base' },
  { name: '学习目标', key: 'learning_goal' },
  { name: '学习速度', key: 'learning_speed' },
  { name: '易错点偏好', key: 'error_patterns' },
  { name: '认知风格', key: 'cognitive_style' },
  { name: '兴趣方向', key: 'interest_direction' }
]

const getDimensionValue = (index) => {
  const key = dimensions[index].key
  if (profile.value && profile.value[key] !== undefined) {
    return profile.value[key]
  }
  if (profile.value && profile.value.dimensions && profile.value.dimensions[key] !== undefined) {
    return profile.value.dimensions[key]
  }
  return 50
}

const getDimensionName = (key) => {
  const dim = dimensions.find(d => d.key === key)
  return dim ? dim.name : key
}

const getLearningStage = () => {
  const kb = getDimensionValue(0)
  if (kb >= 80) return '高级阶段'
  if (kb >= 50) return '中级阶段'
  return '初级阶段'
}

const getLearningMode = () => {
  const style = getDimensionValue(4)
  if (style >= 70) return '实践动手型'
  if (style >= 40) return '理解记忆型'
  return '理论研究型'
}

const getAdaptationMode = () => {
  const speed = getDimensionValue(2)
  if (speed >= 70) return '快速进阶'
  if (speed >= 40) return '稳步提升'
  return '基础巩固'
}

const formatTime = (timestamp) => {
  try {
    const date = new Date(timestamp)
    return date.toLocaleString('zh-CN')
  } catch {
    return timestamp || '-'
  }
}

const goToChat = () => {
  router.push('/')
}

const goToHome = () => {
  router.push('/')
}

const refreshProfile = async () => {
  await loadProfile()
}

const loadProfile = async () => {
  try {
    const res = await agentApi.getProfile()
    if (res.data && res.data.data) {
      profile.value = res.data.data
      nextTick(() => {
        initRadarChart()
      })
    }
  } catch (error) {
    console.error('Load profile error:', error)
    profile.value = null
  }
}

const initRadarChart = () => {
  if (!radarChartRef.value) return
  
  if (radarChart) {
    radarChart.dispose()
  }
  
  radarChart = echarts.init(radarChartRef.value)
  
  const indicator = dimensions.map(dim => ({
    name: dim.name,
    max: 100
  }))
  
  const values = dimensions.map((_, index) => getDimensionValue(index))
  
  const option = {
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#667eea',
      borderWidth: 1,
      textStyle: { color: '#333' },
      formatter: (params) => {
        if (params.seriesName === '学习画像') {
          return `<div style="padding: 8px;">
            <div style="font-weight: bold; color: #667eea;">${params.name}</div>
            <div style="margin-top: 4px;">得分: <span style="color: #667eea; font-weight: bold;">${params.value}</span>/100</div>
          </div>`
        }
        return ''
      }
    },
    radar: {
      indicator: indicator,
      center: ['50%', '50%'],
      radius: '70%',
      startAngle: 90,
      splitNumber: 5,
      shape: 'polygon',
      axisName: {
        color: '#606266',
        fontSize: 13,
        fontWeight: 500
      },
      splitArea: {
        areaStyle: {
          color: ['rgba(102, 126, 234, 0.05)', 'rgba(102, 126, 234, 0.1)', 'rgba(102, 126, 234, 0.15)', 'rgba(102, 126, 234, 0.2)', 'rgba(102, 126, 234, 0.25)']
        }
      },
      axisLine: {
        lineStyle: { color: '#d9d9d9' }
      },
      splitLine: {
        lineStyle: { color: '#d9d9d9' }
      }
    },
    series: [{
      type: 'radar',
      name: '学习画像',
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
        color: 'rgba(102, 126, 234, 0.35)'
      },
      data: [{
        value: values,
        name: '学习画像'
      }]
    }]
  }
  
  radarChart.setOption(option)
  
  window.addEventListener('resize', () => {
    radarChart?.resize()
  })
}

onMounted(() => {
  loadProfile()
})
</script>

<style scoped>
.profile-page {
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

.profile-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.main-section {
  display: flex;
  gap: 24px;
}

.radar-card {
  flex: 1;
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

.radar-chart-container {
  height: 350px;
}

.radar-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #f0f0f0;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #667eea;
}

.legend-name {
  font-size: 14px;
  color: #606266;
}

.legend-value {
  font-size: 14px;
  font-weight: 600;
  color: #667eea;
}

.summary-card {
  width: 400px;
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.summary-content {
  max-height: 350px;
  overflow-y: auto;
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

.info-section {
  display: flex;
  gap: 24px;
}

.info-card {
  flex: 1;
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
}

.info-label {
  font-size: 13px;
  color: #909399;
}

.info-value {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.weak-card {
  width: 350px;
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.weak-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.weak-item {
  padding: 6px 12px;
  background: #fef0f0;
  border-radius: 4px;
}

.empty-weak {
  text-align: center;
  padding: 20px;
  color: #909399;
}

.detail-section {
  display: flex;
  gap: 24px;
}

.history-card {
  flex: 1;
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.history-timeline {
  position: relative;
  padding-left: 24px;
}

.history-timeline::before {
  content: '';
  position: absolute;
  left: 7px;
  top: 0;
  bottom: 0;
  width: 2px;
  background: #e4e7ed;
}

.history-item {
  position: relative;
  margin-bottom: 24px;
}

.history-item:last-child {
  margin-bottom: 0;
}

.timeline-dot {
  position: absolute;
  left: -20px;
  top: 4px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #667eea;
  border: 3px solid #fff;
  box-shadow: 0 0 0 2px #667eea;
}

.timeline-content {
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
}

.timeline-time {
  font-size: 12px;
  color: #909399;
  margin-bottom: 4px;
}

.timeline-reason {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 8px;
}

.timeline-changes {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.change-tag {
  font-size: 12px;
  padding: 3px 8px;
  background: #eef2ff;
  color: #667eea;
  border-radius: 4px;
}

.empty-history {
  text-align: center;
  padding: 30px;
  color: #909399;
}

.json-card {
  width: 450px;
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.json-content pre {
  max-height: 400px;
  overflow-y: auto;
  padding: 16px;
  background: #1f1f1f;
  color: #e0e0e0;
  font-size: 12px;
  border-radius: 8px;
  font-family: 'Consolas', 'Monaco', monospace;
  white-space: pre-wrap;
  word-break: break-all;
}

.action-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
}

.action-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.action-info {
  display: flex;
  gap: 12px;
}

.action-label {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
}

.action-value {
  font-size: 14px;
  font-weight: 600;
  color: #fff;
}

.action-buttons {
  display: flex;
  gap: 12px;
}

.action-buttons .el-button {
  border-radius: 8px;
}

.action-buttons .el-button--primary {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.3);
  color: #fff;
}

.action-buttons .el-button--default {
  background: #fff;
  color: #667eea;
  border-color: #fff;
}
</style>