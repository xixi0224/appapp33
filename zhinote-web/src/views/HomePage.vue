<template>
  <div class="home-container">
  <nav class="nav-bar">
    <div class="nav-left">
      <div class="logo">
        <div class="logo-icon">📝</div>
        <span class="logo-text">ZhiNote</span>
      </div>
    </div>
    <div class="nav-right">
      <button v-if="!isLoggedIn" class="nav-btn" @click="showLogin = true">登录</button>
      <button v-if="!isLoggedIn" class="nav-btn primary" @click="showRegister = true">注册</button>
      <div v-else class="user-info">
        <span class="username">{{ currentUser?.username }}</span>
        <button class="nav-btn" @click="handleLogout">退出</button>
      </div>
    </div>
  </nav>

  <div class="hero-section">
    <div class="hero-bg"></div>
    <div class="hero-content">
      <div class="badge">基于大模型的个性化学习系统</div>
      <h1 class="hero-title">让学习更智能、更高效</h1>
      <p class="hero-subtitle">通过多智能体协同、费曼学习法和贝叶斯知识追踪，为每位学生提供真正个性化的学习体验</p>
      <div class="hero-buttons">
        <button class="btn-primary" @click="handleStartLearning">
          <span>开始学习</span>
          <span class="arrow">→</span>
        </button>
        <button class="btn-secondary" @click="handleQuickExperience">
          <span>⚡ 快速体验</span>
        </button>
      </div>
      <div class="guest-hint">
          <span>AI对话免费体验，登录解锁学习画像、知识图谱等全部功能</span>
        </div>
    </div>
    <div class="hero-decoration">
      <div class="deco-circle deco-circle-1"></div>
      <div class="deco-circle deco-circle-2"></div>
      <div class="deco-circle deco-circle-3"></div>
    </div>
  </div>

    <el-dialog 
      v-model="showLogin" 
      title="登录" 
      :close-on-click-modal="false"
      :show-close="false"
      class="auth-dialog"
      append-to-body
    >
      <div class="auth-form">
        <div class="auth-header">
          <div class="auth-icon">🔐</div>
          <h3>欢迎回来</h3>
        </div>
        <el-form :model="loginForm" ref="loginFormRef" label-width="0">
          <el-form-item>
            <el-input 
              v-model="loginForm.username" 
              placeholder="用户名" 
              prefix-icon="User"
              class="auth-input"
            />
          </el-form-item>
          <el-form-item>
            <el-input 
              v-model="loginForm.password" 
              type="password" 
              placeholder="密码" 
              prefix-icon="Lock"
              class="auth-input"
            />
          </el-form-item>
          <el-form-item>
            <button class="btn-full" @click="handleLogin">登 录</button>
          </el-form-item>
        </el-form>
        <div class="auth-switch">
          还没有账号？
          <span class="link" @click="switchToRegister">立即注册</span>
        </div>
      </div>
    </el-dialog>

    <el-dialog 
      v-model="showRegister" 
      title="注册" 
      :close-on-click-modal="false"
      :show-close="false"
      class="auth-dialog"
      append-to-body
    >
      <div class="auth-form">
        <div class="auth-header">
          <div class="auth-icon">✨</div>
          <h3>创建账号</h3>
        </div>
        <el-form :model="registerForm" ref="registerFormRef" label-width="0">
          <el-form-item>
            <el-input 
              v-model="registerForm.username" 
              placeholder="用户名" 
              prefix-icon="User"
              class="auth-input"
            />
          </el-form-item>
          <el-form-item>
            <el-input 
              v-model="registerForm.password" 
              type="password" 
              placeholder="密码" 
              prefix-icon="Lock"
              class="auth-input"
            />
          </el-form-item>
          <el-form-item>
            <el-input 
              v-model="registerForm.email" 
              placeholder="邮箱（选填）" 
              prefix-icon="Message"
              class="auth-input"
            />
          </el-form-item>
          <el-form-item>
            <button class="btn-full" @click="handleRegister">注 册</button>
          </el-form-item>
        </el-form>
        <div class="auth-switch">
          已有账号？
          <span class="link" @click="switchToLogin">立即登录</span>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'

const router = useRouter()
const route = useRoute()

const showLogin = ref(false)
const showRegister = ref(false)
const isLoggedIn = ref(false)
const currentUser = ref(null)

const loginForm = ref({ username: '', password: '' })
const registerForm = ref({ username: '', password: '', email: '' })

const loginFormRef = ref(null)
const registerFormRef = ref(null)

onMounted(() => {
  checkAuth()
  
  const showLoginParam = route.query.showLogin
  if (showLoginParam === 'true') {
    showLogin.value = true
  }
})

watch(() => route.query.showLogin, (newVal) => {
  if (newVal === 'true') {
    showLogin.value = true
  }
})

const checkAuth = () => {
  const token = localStorage.getItem('zhinote_token')
  const user = localStorage.getItem('zhinote_user')
  if (token && user) {
    isLoggedIn.value = true
    currentUser.value = JSON.parse(user)
    router.push('/chat')
  }
}

const handleLogin = async () => {
  if (!loginForm.value.username || !loginForm.value.password) {
    ElMessage.warning('请输入用户名和密码')
    return
  }
  
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(loginForm.value),
      credentials: 'include'
    })
    const data = await response.json()
    
    if (data.code === 0) {
      localStorage.setItem('zhinote_token', data.data.token)
      localStorage.setItem('zhinote_user', JSON.stringify(data.data.user))
      localStorage.removeItem('zhinote_guest')
      isLoggedIn.value = true
      currentUser.value = data.data.user
      showLogin.value = false
      ElMessage.success('登录成功！')
      window.dispatchEvent(new Event('auth-change'))
      router.push('/chat')
    } else {
      ElMessage.error(data.message || '登录失败')
    }
  } catch (error) {
    ElMessage.error('登录失败，请检查网络连接')
  }
}

const handleRegister = async () => {
  if (!registerForm.value.username || !registerForm.value.password) {
    ElMessage.warning('请输入用户名和密码')
    return
  }
  
  try {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(registerForm.value),
      credentials: 'include'
    })
    const data = await response.json()
    
    if (data.code === 0) {
      ElMessage.success('注册成功！请登录')
      switchToLogin()
    } else {
      ElMessage.error(data.message || '注册失败')
    }
  } catch (error) {
    ElMessage.error('注册失败，请检查网络连接')
  }
}

const handleLogout = () => {
  localStorage.removeItem('zhinote_token')
  localStorage.removeItem('zhinote_user')
  localStorage.removeItem('zhinote_guest')
  isLoggedIn.value = false
  currentUser.value = null
  ElMessage.success('已退出登录')
  router.push('/')
}

const handleStartLearning = () => {
  router.push('/chat')
}

const handleQuickExperience = () => {
  router.push('/chat')
}

const switchToRegister = () => {
  showLogin.value = false
  showRegister.value = true
}

const switchToLogin = () => {
  showRegister.value = false
  showLogin.value = true
}
</script>

<style scoped>
.home-container {
  min-height: 100vh;
  height: 100vh;
  width: 100vw;
  background: linear-gradient(180deg, #f0f7ff 0%, #e0f2fe 50%, #ffffff 100%);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.nav-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 60px;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(12px);
  position: relative;
  z-index: 100;
  border-bottom: 1px solid rgba(255, 255, 255, 0.5);
}

.logo {
  display: flex;
  align-items: center;
  gap: 10px;
}

.logo-icon {
  font-size: 32px;
}

.logo-text {
  font-size: 22px;
  font-weight: 700;
  color: #1e293b;
}

.nav-btn {
  padding: 10px 24px;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  background: transparent;
  color: #475569;
  transition: all 0.2s ease;
}

.nav-btn:hover {
  color: #3b82f6;
  background: rgba(59, 130, 246, 0.05);
}

.nav-btn.primary {
  background: #3b82f6;
  color: white;
}

.nav-btn.primary:hover {
  background: #2563eb;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.user-info {
  display: flex;
  align-items: center;
  gap: 20px;
}

.username {
  font-weight: 600;
  color: #1e293b;
  font-size: 15px;
}

.hero-section {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  position: relative;
  overflow: hidden;
}

.hero-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: 
    radial-gradient(ellipse at 20% 50%, rgba(59, 130, 246, 0.15) 0%, transparent 50%),
    radial-gradient(ellipse at 80% 50%, rgba(139, 92, 246, 0.1) 0%, transparent 50%),
    radial-gradient(ellipse at 50% 80%, rgba(20, 184, 166, 0.08) 0%, transparent 40%);
  pointer-events: none;
}

.hero-content {
  text-align: center;
  max-width: 800px;
  z-index: 10;
  position: relative;
}

.badge {
  display: inline-block;
  padding: 8px 20px;
  background: rgba(59, 130, 246, 0.1);
  color: #1d4ed8;
  font-size: 13px;
  font-weight: 500;
  border-radius: 24px;
  margin-bottom: 32px;
  border: 1px solid rgba(59, 130, 246, 0.2);
}

.hero-title {
  font-size: 64px;
  font-weight: 800;
  color: #1e293b;
  line-height: 1.15;
  margin-bottom: 24px;
  letter-spacing: -1px;
}

.hero-title span {
  background: linear-gradient(135deg, #3b82f6 0%, #6366f1 50%, #8b5cf6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-subtitle {
  font-size: 20px;
  color: #64748b;
  line-height: 1.7;
  margin-bottom: 52px;
  font-weight: 400;
}

.hero-buttons {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-bottom: 28px;
}

.btn-primary {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 18px 40px;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  border: none;
  border-radius: 16px;
  font-size: 17px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 6px 20px rgba(59, 130, 246, 0.3);
}

.btn-primary:hover {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  transform: translateY(-3px);
  box-shadow: 0 10px 28px rgba(59, 130, 246, 0.4);
}

.btn-secondary {
  padding: 18px 40px;
  background: rgba(255, 255, 255, 0.9);
  color: #475569;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  font-size: 17px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(8px);
}

.btn-secondary:hover {
  border-color: #94a3b8;
  background: white;
  transform: translateY(-3px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08);
}

.guest-hint {
  font-size: 14px;
  color: #94a3b8;
}

.hero-decoration {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  overflow: hidden;
}

.deco-circle {
  position: absolute;
  border-radius: 50%;
  opacity: 0.6;
  animation: float 6s ease-in-out infinite;
}

.deco-circle-1 {
  width: 300px;
  height: 300px;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(99, 102, 241, 0.1) 100%);
  top: 10%;
  left: -10%;
  animation-delay: 0s;
}

.deco-circle-2 {
  width: 200px;
  height: 200px;
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(168, 85, 247, 0.08) 100%);
  top: 30%;
  right: -5%;
  animation-delay: 2s;
}

.deco-circle-3 {
  width: 150px;
  height: 150px;
  background: linear-gradient(135deg, rgba(20, 184, 166, 0.12) 0%, rgba(16, 185, 129, 0.06) 100%);
  bottom: 20%;
  left: 15%;
  animation-delay: 4s;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0px) rotate(0deg);
  }
  50% {
    transform: translateY(-20px) rotate(5deg);
  }
}

.auth-dialog {
  width: 440px !important;
  border-radius: 20px !important;
  overflow: hidden;
}

.auth-form {
  padding: 24px 0;
}

.auth-header {
  text-align: center;
  margin-bottom: 28px;
}

.auth-icon {
  font-size: 56px;
  margin-bottom: 16px;
}

.auth-header h3 {
  font-size: 24px;
  font-weight: 700;
  color: #1e293b;
}

.auth-input {
  height: 48px;
  border-radius: 12px;
  font-size: 15px;
}

.btn-full {
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-full:hover {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.auth-switch {
  text-align: center;
  margin-top: 20px;
  font-size: 14px;
  color: #64748b;
}

.link {
  color: #3b82f6;
  cursor: pointer;
  font-weight: 500;
}

.link:hover {
  text-decoration: underline;
}
</style>