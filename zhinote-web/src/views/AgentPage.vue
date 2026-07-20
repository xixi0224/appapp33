<template>
  <div class="agent-page">
    <div class="page-header">
      <el-button type="text" @click="goToHome" class="back-btn">
        <el-icon><ArrowLeft /></el-icon>
        返回首页
      </el-button>
      <div class="page-title">🤖 Agent协作中心</div>
      <div class="page-subtitle">多智能体协同工作流程可视化</div>
    </div>
    
    <div class="card workflow-diagram">
      <h3 style="margin-bottom: 30px; font-size: 16px; font-weight: 600;">Agent协作流程</h3>
      <div class="flow-container">
        <div class="flow-item user">
          <div class="node">👤 用户</div>
        </div>
        
        <div class="arrow">↓</div>
        
        <div class="flow-item profile">
          <div class="node" :class="{ active: agentStatus.profile === 'running', completed: agentStatus.profile === 'completed' }">
            🧠 画像Agent
          </div>
          <div class="status-text">{{ getStatusText('profile') }}</div>
        </div>
        
        <div class="arrow">↓</div>
        
        <div class="flow-item planning">
          <div class="node" :class="{ active: agentStatus.planning === 'running', completed: agentStatus.planning === 'completed' }">
            🧭 规划Agent
          </div>
          <div class="status-text">{{ getStatusText('planning') }}</div>
        </div>
        
        <div class="arrow">↓</div>
        
        <div class="flow-item resources">
          <div class="node" :class="{ active: agentStatus.resource === 'running', completed: agentStatus.resource === 'completed' }">
            📚 资源Agent
          </div>
          <div class="status-text">{{ getStatusText('resource') }}</div>
        </div>
        
        <div class="parallel-container">
          <div class="flow-item teaching">
            <div class="node" :class="{ active: agentStatus.teaching === 'running', completed: agentStatus.teaching === 'completed' }">
              📖 讲解Agent
            </div>
            <div class="status-text">{{ getStatusText('teaching') }}</div>
          </div>
          <div class="flow-item question">
            <div class="node" :class="{ active: agentStatus.question === 'running', completed: agentStatus.question === 'completed' }">
              📝 题目Agent
            </div>
            <div class="status-text">{{ getStatusText('question') }}</div>
          </div>
          <div class="flow-item code">
            <div class="node" :class="{ active: agentStatus.code === 'running', completed: agentStatus.code === 'completed' }">
              💻 代码Agent
            </div>
            <div class="status-text">{{ getStatusText('code') }}</div>
          </div>
        </div>
        
        <div class="arrow">↓</div>
        
        <div class="flow-item evaluation">
          <div class="node" :class="{ active: agentStatus.evaluation === 'running', completed: agentStatus.evaluation === 'completed' }">
            📊 评估Agent
          </div>
          <div class="status-text">{{ getStatusText('evaluation') }}</div>
        </div>
        
        <div class="arrow">↓</div>
        
        <div class="flow-item update">
          <div class="node" :class="{ active: agentStatus.update === 'running', completed: agentStatus.update === 'completed' }">
            🔄 更新画像
          </div>
          <div class="status-text">{{ getStatusText('update') }}</div>
        </div>
      </div>
    </div>
    
    <div class="card status-panel">
      <div class="panel-header">
        <h3 style="font-size: 16px; font-weight: 600;">实时运行状态</h3>
        <el-button type="primary" @click="runWorkflow" :loading="running">
          <el-icon><Refresh /></el-icon>
          启动完整工作流
        </el-button>
      </div>
      
      <div class="status-list">
        <div 
          v-for="(item, index) in statusList" 
          :key="index" 
          :class="['status-item', item.status]"
        >
          <div class="status-indicator"></div>
          <div class="status-info">
            <div class="status-agent">{{ item.agent }}</div>
            <div class="status-detail">{{ item.detail }}</div>
          </div>
          <div class="status-time">{{ formatTime(item.timestamp) }}</div>
        </div>
        
        <div v-if="statusList.length === 0" class="empty-status">
          <el-icon size="48" style="color: #c0c4cc;">🤖</el-icon>
          <p>暂无运行记录，点击上方按钮启动工作流</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { Refresh, ArrowLeft } from '@element-plus/icons-vue'
import { agentApi } from '../api/agent'

const router = useRouter()

const goToHome = () => {
  router.push('/')
}

const agentStatus = ref({
  profile: '',
  planning: '',
  resource: '',
  teaching: '',
  question: '',
  code: '',
  evaluation: '',
  update: ''
})

const statusList = ref([])
const running = ref(false)
let refreshInterval = null

const getStatusText = (key) => {
  const status = agentStatus.value[key]
  if (status === 'running') return '运行中...'
  if (status === 'completed') return '✓ 完成'
  if (status === 'error') return '✗ 错误'
  return '等待中'
}

const formatTime = (timestamp) => {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

const refreshStatus = async () => {
  try {
    const res = await agentApi.getAgentStatus()
    if (res.data && res.data.data) {
      statusList.value = res.data.data.status || []
      
      const statusMap = {}
      statusList.value.forEach(item => {
        const agentName = item.agent
        if (agentName.includes('画像')) statusMap.profile = item.status
        if (agentName.includes('规划')) statusMap.planning = item.status
        if (agentName.includes('资源')) statusMap.resource = item.status
        if (agentName.includes('讲解')) statusMap.teaching = item.status
        if (agentName.includes('题目')) statusMap.question = item.status
        if (agentName.includes('代码')) statusMap.code = item.status
        if (agentName.includes('评估')) statusMap.evaluation = item.status
        if (agentName.includes('更新')) statusMap.update = item.status
      })
      agentStatus.value = { ...agentStatus.value, ...statusMap }
    }
  } catch (error) {
    console.error('Failed to refresh status:', error)
  }
}

const runWorkflow = async () => {
  running.value = true
  try {
    const input = '我是计算机专业大二学生，想学习机器学习，数学基础一般，希望3个月掌握基础项目开发能力'
    await agentApi.runWorkflow(input)
  } catch (error) {
    console.error('Workflow failed:', error)
  } finally {
    running.value = false
  }
}

onMounted(() => {
  refreshStatus()
  refreshInterval = setInterval(refreshStatus, 3000)
})

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
  }
})
</script>

<style scoped>
.agent-page {
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

.workflow-diagram {
  text-align: center;
}

.flow-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.flow-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.node {
  width: 120px;
  height: 60px;
  border-radius: 12px;
  background: #f5f7fa;
  border: 2px solid #e4e7ed;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.3s;
}

.node.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-color: #667eea;
  animation: pulse 1s infinite;
}

.node.completed {
  background: #f0f9eb;
  border-color: #67c23a;
  color: #67c23a;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

.arrow {
  font-size: 24px;
  color: #c0c4cc;
}

.parallel-container {
  display: flex;
  gap: 30px;
  flex-wrap: wrap;
  justify-content: center;
}

.status-text {
  font-size: 12px;
  color: #909399;
  margin-top: 8px;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.status-list {
  max-height: 400px;
  overflow-y: auto;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 8px;
  background: #f5f7fa;
}

.status-item.running {
  background: #ecf5ff;
  border-left: 4px solid #409eff;
}

.status-item.completed {
  background: #f0f9eb;
  border-left: 4px solid #67c23a;
}

.status-item.error {
  background: #fef0f0;
  border-left: 4px solid #f56c6c;
}

.status-indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #909399;
}

.status-item.running .status-indicator {
  background: #409eff;
  animation: blink 1s infinite;
}

.status-item.completed .status-indicator {
  background: #67c23a;
}

.status-item.error .status-indicator {
  background: #f56c6c;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.status-info {
  flex: 1;
}

.status-agent {
  font-weight: 600;
  color: #303133;
}

.status-detail {
  font-size: 13px;
  color: #909399;
}

.status-time {
  font-size: 12px;
  color: #c0c4cc;
}

.empty-status {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  color: #909399;
}
</style>
