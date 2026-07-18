<template>
  <div class="chat-page">
    <div class="chat-header">
      <div class="header-left">
        <el-button type="text" @click="goToHome" class="back-btn">
          <el-icon><ArrowLeft /></el-icon>
          返回首页
        </el-button>
      </div>
      <div class="header-title">
        <span class="title-icon">🤖</span>
        <span>智能对话学习中心</span>
      </div>
      <div class="header-actions">
        <el-button type="text" @click="clearHistory" :disabled="messages.length === 0">
          <el-icon><Delete /></el-icon>
          清空记录
        </el-button>
      </div>
      <div class="header-subtitle">输入你的学习需求，AI为你定制个性化学习方案</div>
    </div>
    
    <div class="chat-container">
      <div class="chat-sidebar">
        <div class="sidebar-section">
          <h3>快捷输入</h3>
          <div class="quick-inputs">
            <el-button 
              v-for="(item, index) in quickInputs" 
              :key="index" 
              type="text" 
              @click="sendQuickInput(item)"
              class="quick-btn"
            >
              {{ item }}
            </el-button>
          </div>
        </div>
        
        <div class="sidebar-section" v-if="currentProfile">
          <h3>当前画像</h3>
          <div class="profile-preview">
            <div class="preview-item">
              <span class="preview-label">专业</span>
              <span class="preview-value">{{ currentProfile.major }}</span>
            </div>
            <div class="preview-item">
              <span class="preview-label">目标</span>
              <span class="preview-value">{{ currentProfile.learning_goal }}</span>
            </div>
            <div class="preview-item">
              <span class="preview-label">基础</span>
              <span class="preview-value">{{ currentProfile.knowledge_base?.机器学习 || '未知' }}</span>
            </div>
          </div>
          <el-button type="primary" size="small" style="width: 100%; margin-top: 10px;" @click="goToProfile">
            查看完整画像
          </el-button>
        </div>
        
        <div class="sidebar-section">
          <h3>学习闭环</h3>
          <div class="workflow-steps">
            <div 
              v-for="(step, index) in workflowSteps" 
              :key="index" 
              :class="['step-item', { active: currentStep === index }]"
            >
              <div class="step-number">{{ index + 1 }}</div>
              <div class="step-name">{{ step }}</div>
            </div>
          </div>
        </div>
        
        <div class="sidebar-section">
          <h3>智能答疑</h3>
          <div class="qa-section">
            <div 
              v-for="(faq, index) in faqQuestions" 
              :key="index"
              @click="sendQuickInput(faq.question)"
              class="qa-item"
            >
              <span class="qa-icon">💡</span>
              <span>{{ faq.question }}</span>
            </div>
          </div>
          <el-button type="primary" size="small" style="width: 100%; margin-top: 10px;" icon="CircleHelpFilled">
            立即提问
          </el-button>
        </div>
      </div>
      
      <div class="chat-main">
        <div class="message-list">
          <div class="welcome-message">
            <div class="welcome-icon">👋</div>
            <div class="welcome-content">
              <h3>欢迎来到智能学习助手！</h3>
              <p>请告诉我你的学习需求，例如：</p>
              <ul>
                <li>我是计算机专业大二学生，想学习机器学习</li>
                <li>我的数学基础不好，希望半年掌握AI开发</li>
                <li>我需要学习深度学习，想做一个项目</li>
              </ul>
            </div>
          </div>
          
          <div 
            v-for="(message, index) in messages" 
            :key="index" 
            :class="['message-item', message.role]"
          >
            <div class="message-avatar">{{ message.role === 'user' ? '👤' : '🤖' }}</div>
            <div class="message-content">
              <div class="message-text" v-html="formatMessage(message.content)"></div>
              <div class="message-time">{{ message.time }}</div>
            </div>
          </div>
          
          <div v-if="loading" class="loading-message">
            <el-icon class="loading-icon"><Loading /></el-icon>
            <span>AI正在思考中...</span>
          </div>
        </div>
        
        <div class="chat-input">
          <el-input 
            v-model="inputMessage" 
            placeholder="输入你的学习需求..."
            @keyup.enter="sendMessage"
            type="textarea"
            :rows="3"
          />
          <el-button type="primary" @click="sendMessage" :disabled="!inputMessage || loading">
            <el-icon><ArrowRight /></el-icon>
            发送
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Loading, ArrowRight, Delete, ArrowLeft } from '@element-plus/icons-vue'
import { agentApi } from '../api/agent'
import chatStore from '../store/chatStore'
import katex from 'katex'
import 'katex/dist/katex.min.css'

const router = useRouter()

const messages = ref([])
const inputMessage = ref('')
const loading = ref(false)
const currentProfile = ref(null)
const currentStep = ref(0)
const showQARequest = ref(false)

const loadFromStore = () => {
  if (chatStore.messages.length > 0) {
    messages.value = [...chatStore.messages]
  }
  if (Object.keys(chatStore.currentProfile).length > 0) {
    currentProfile.value = { ...chatStore.currentProfile }
  }
}

const quickInputs = [
  '我是计算机专业学生，想学习机器学习',
  '数学基础薄弱，需要从基础学起',
  '推荐一个AI项目实践',
  '解释一下深度学习的概念'
]

const workflowSteps = ['输入需求', '生成画像', '规划路径', '生成资源', '学习记录', '效果评估']

const faqQuestions = [
  { question: '什么是机器学习？', type: 'concept' },
  { question: '如何选择学习资源？', type: 'resource' },
  { question: '遇到难题怎么办？', type: 'problem' },
  { question: '学习进度太慢怎么办？', type: 'progress' }
]

const formatMessage = (content) => {
  let html = content
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br>')
    .replace(/- (.*?)\n/g, '<li>$1</li>')
    .replace(/(\d+)\. (.*?)\n/g, '<li>$1. $2</li>')
  
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
  
  return html
}

const sendMessage = async () => {
  if (!inputMessage.value.trim() || loading.value) return
  
  const userMessage = {
    role: 'user',
    content: inputMessage.value,
    time: new Date().toLocaleTimeString('zh-CN')
  }
  messages.value.push(userMessage)
  chatStore.addMessage(userMessage)
  inputMessage.value = ''
  loading.value = true
  
  try {
    const res = await agentApi.chat(userMessage.content)
    if (res.data && res.data.data) {
      const aiMessage = {
        role: 'ai',
        content: res.data.data.response,
        time: new Date().toLocaleTimeString('zh-CN')
      }
      messages.value.push(aiMessage)
      chatStore.addMessage(aiMessage)
      
      if (res.data.data.profile) {
        currentProfile.value = res.data.data.profile
        chatStore.setProfile(res.data.data.profile)
        currentStep.value = 1
      }
    }
  } catch (error) {
    console.error('Chat error:', error)
    const errorMessage = {
      role: 'ai',
      content: '抱歉，AI服务暂时不可用，请稍后再试。',
      time: new Date().toLocaleTimeString('zh-CN')
    }
    messages.value.push(errorMessage)
    chatStore.addMessage(errorMessage)
  } finally {
    loading.value = false
  }
}

const sendQuickInput = (text) => {
  inputMessage.value = text
  sendMessage()
}

const goToProfile = () => {
  router.push('/profile')
}

const goToHome = () => {
  router.push('/')
}

const clearHistory = async () => {
  try {
    await agentApi.clearChatHistory()
    messages.value = []
    currentProfile.value = {}
    chatStore.clearMessages()
  } catch (error) {
    console.error('Clear history error:', error)
  }
}

onMounted(async () => {
  try {
    loadFromStore()
    
    if (messages.value.length === 0) {
      await agentApi.initSession()
      
      const [profileRes, historyRes] = await Promise.all([
        agentApi.getProfile(),
        agentApi.getChatHistory()
      ])
      
      if (profileRes.data && profileRes.data.data) {
        if (typeof profileRes.data.data === 'object' && profileRes.data.data.profile_json) {
          currentProfile.value = profileRes.data.data.profile_json
          chatStore.setProfile(profileRes.data.data.profile_json)
        } else {
          currentProfile.value = profileRes.data.data
          chatStore.setProfile(profileRes.data.data)
        }
      }
      
      if (historyRes.data && historyRes.data.data) {
        const history = historyRes.data.data
        messages.value = history.map(m => ({
          role: m.role === 'user' ? 'user' : 'ai',
          content: m.content,
          time: m.created_at ? new Date(m.created_at).toLocaleTimeString('zh-CN') : new Date().toLocaleTimeString('zh-CN')
        }))
        chatStore.setMessages([...messages.value])
      }
    }
  } catch (error) {
    console.error('Init error:', error)
  }
})
</script>

<style scoped>
.chat-page {
  height: 100vh;
  width: 100vw;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  margin: 0;
  padding: 0;
  overflow: hidden;
}

.chat-header {
  padding: 24px 40px;
  color: white;
  flex-shrink: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  flex-shrink: 0;
}

.back-btn {
  color: rgba(255, 255, 255, 0.9) !important;
  font-size: 14px;
}

.back-btn:hover {
  color: white !important;
}

.header-title {
  flex: 1;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  font-size: 32px;
  font-weight: 700;
}

.title-icon {
  font-size: 36px;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.header-subtitle {
  font-size: 16px;
  opacity: 0.9;
  margin-top: 8px;
  position: absolute;
  left: 40px;
  top: 65px;
}

.chat-container {
  flex: 1;
  display: flex;
  padding: 0 30px 30px;
  gap: 24px;
  overflow: hidden;
}

.chat-sidebar {
  width: 360px;
  background: white;
  border-radius: 16px;
  padding: 24px;
  overflow-y: auto;
  flex-shrink: 0;
}

.sidebar-section {
  margin-bottom: 28px;
}

.sidebar-section h3 {
  font-size: 16px;
  font-weight: 700;
  color: #303133;
  margin-bottom: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.sidebar-section h3::before {
  content: '';
  width: 4px;
  height: 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 2px;
}

.quick-inputs {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.quick-btn {
  text-align: left;
  padding: 12px 16px;
  border-radius: 10px;
  background: #f5f7fa;
  font-size: 14px;
  color: #606266;
  transition: all 0.3s;
  border: 1px solid transparent;
}

.quick-btn:hover {
  background: #ecf5ff;
  color: #667eea;
  border-color: #d9ecff;
  transform: translateX(4px);
}

.profile-preview {
  background: linear-gradient(135deg, #f5f7fa 0%, #eef2ff 100%);
  border-radius: 12px;
  padding: 20px;
  border: 1px solid #e4e7ed;
}

.preview-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
}

.preview-item:last-child {
  margin-bottom: 0;
}

.preview-label {
  font-size: 14px;
  color: #909399;
  font-weight: 500;
}

.preview-value {
  font-size: 14px;
  font-weight: 700;
  color: #303133;
}

.workflow-steps {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.step-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  border-radius: 12px;
  background: #f5f7fa;
  transition: all 0.3s;
}

.step-item.active {
  background: linear-gradient(135deg, #ecf5ff 0%, #e0ecff 100%);
  border-left: 5px solid #667eea;
  transform: translateX(4px);
}

.step-number {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #e4e7ed;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 700;
  color: #909399;
  flex-shrink: 0;
}

.step-item.active .step-number {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.step-name {
  font-size: 14px;
  color: #606266;
  font-weight: 500;
}

.step-item.active .step-name {
  color: #303133;
  font-weight: 600;
}

.qa-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.qa-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  background: #fff7e6;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s;
  border: 1px solid #ffe58f;
}

.qa-item:hover {
  background: #fff1cc;
  transform: translateX(4px);
}

.qa-icon {
  color: #e6a23c;
  font-size: 16px;
}

.qa-item span {
  font-size: 13px;
  color: #8d6e63;
  flex: 1;
}

.chat-main {
  flex: 1;
  background: white;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.message-list {
  flex: 1;
  padding: 30px;
  overflow-y: auto;
}

.welcome-message {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 40px;
  border-radius: 16px;
  margin-bottom: 30px;
  display: flex;
  gap: 24px;
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.3);
}

.welcome-icon {
  font-size: 72px;
  animation: wave 2s ease-in-out infinite;
}

@keyframes wave {
  0%, 100% { transform: rotate(0deg); }
  25% { transform: rotate(20deg); }
  75% { transform: rotate(-20deg); }
}

.welcome-content {
  flex: 1;
}

.welcome-content h3 {
  margin: 0 0 16px 0;
  font-size: 28px;
  font-weight: 700;
}

.welcome-content p {
  margin: 0 0 20px 0;
  font-size: 18px;
  opacity: 0.95;
  line-height: 1.6;
}

.welcome-content ul {
  margin: 0;
  padding-left: 24px;
  font-size: 16px;
  opacity: 0.9;
  line-height: 2;
}

.welcome-content li {
  margin-bottom: 8px;
}

.message-item {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
}

.message-item.user {
  flex-direction: row-reverse;
}

.message-item.user .message-content {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.message-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #f5f7fa;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.message-content {
  max-width: 80%;
  padding: 16px 20px;
  border-radius: 16px;
  background: #f5f7fa;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.message-text {
  font-size: 16px;
  line-height: 1.7;
}

.message-time {
  font-size: 12px;
  color: #909399;
  margin-top: 8px;
  text-align: right;
}

.message-item.user .message-time {
  color: rgba(255, 255, 255, 0.7);
}

.loading-message {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  background: #f5f7fa;
  border-radius: 16px;
  color: #606266;
}

.loading-icon {
  animation: spin 1s linear infinite;
  font-size: 20px;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.chat-input {
  padding: 20px 30px;
  border-top: 1px solid #e4e7ed;
  display: flex;
  gap: 16px;
  background: #fafafa;
}

.chat-input .el-input {
  flex: 1;
}

.chat-input .el-input__wrapper {
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.chat-input .el-button {
  align-self: flex-end;
  padding: 12px 32px;
  font-size: 16px;
  font-weight: 600;
  border-radius: 12px;
}
</style>
