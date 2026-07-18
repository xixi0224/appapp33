<template>
  <div class="personal-center">
    <div class="page-header">
      <button class="back-btn" @click="$router.back()">
        <el-icon><ArrowLeft /></el-icon>
        返回
      </button>
      <h1 class="page-title">个人中心</h1>
    </div>

    <div class="content-wrapper">
      <div class="left-panel">
        <div class="avatar-section">
          <div class="avatar-container">
            <div class="avatar" :style="{ background: getAvatarGradient(userInfo.username) }">
              <span>{{ userInfo.username?.charAt(0)?.toUpperCase() || '?' }}</span>
            </div>
            <button class="change-avatar-btn" @click="showAvatarModal = true">
              <el-icon><Camera /></el-icon>
            </button>
          </div>
          <div class="user-name">{{ userInfo.username }}</div>
          <div class="user-role">{{ getRoleLabel(userInfo.role) }}</div>
        </div>

        <div class="nav-section">
          <div 
            class="nav-item" 
            :class="{ active: activeTab === 'profile' }"
            @click="activeTab = 'profile'"
          >
            <el-icon><User /></el-icon>
            <span>账号信息</span>
          </div>
          <div 
            class="nav-item" 
            :class="{ active: activeTab === 'statistics' }"
            @click="activeTab = 'statistics'"
          >
            <el-icon><TrendCharts /></el-icon>
            <span>学情统计</span>
          </div>
          <div 
            class="nav-item" 
            :class="{ active: activeTab === 'shortcuts' }"
            @click="activeTab = 'shortcuts'"
          >
            <el-icon><Document /></el-icon>
            <span>快捷导航</span>
          </div>
          <div 
            class="nav-item" 
            :class="{ active: activeTab === 'settings' }"
            @click="activeTab = 'settings'"
          >
            <el-icon><Brush /></el-icon>
            <span>系统设置</span>
          </div>
        </div>
      </div>

      <div class="right-panel">
        <div v-if="activeTab === 'profile'" class="tab-content">
          <div class="section-card">
            <h2 class="section-title">基本信息</h2>
            <div class="form-row">
              <el-form-item label="用户名">
                <el-input 
                  v-model="editForm.username" 
                  :disabled="!isEditing"
                  placeholder="请输入用户名"
                />
              </el-form-item>
              <el-form-item label="专业">
                <el-input 
                  v-model="editForm.major" 
                  :disabled="!isEditing"
                  placeholder="请输入专业"
                />
              </el-form-item>
            </div>
            <div class="form-row">
              <el-form-item label="学习方向">
                <el-input 
                  v-model="editForm.learningDirection" 
                  :disabled="!isEditing"
                  placeholder="请输入学习方向"
                />
              </el-form-item>
              <el-form-item label="注册时间">
                <span class="form-value">{{ formatDate(userInfo.created_at) }}</span>
              </el-form-item>
            </div>
            <div class="form-actions">
              <button v-if="!isEditing" class="btn-primary" @click="startEditing">
                <el-icon><Edit /></el-icon>
                编辑信息
              </button>
              <template v-else>
                <button class="btn-primary" @click="saveProfile">
                  <el-icon><Check /></el-icon>
                  保存
                </button>
                <button class="btn-secondary" @click="cancelEditing">
                  <el-icon><Close /></el-icon>
                  取消
                </button>
              </template>
            </div>
          </div>

          <div class="section-card">
            <h2 class="section-title">修改密码</h2>
            <div class="form-row">
              <el-form-item label="旧密码">
                <el-input 
                  v-model="passwordForm.oldPassword" 
                  type="password"
                  placeholder="请输入旧密码"
                />
              </el-form-item>
            </div>
            <div class="form-row">
              <el-form-item label="新密码">
                <el-input 
                  v-model="passwordForm.newPassword" 
                  type="password"
                  placeholder="请输入新密码"
                />
              </el-form-item>
              <el-form-item label="确认密码">
                <el-input 
                  v-model="passwordForm.confirmPassword" 
                  type="password"
                  placeholder="请确认新密码"
                />
              </el-form-item>
            </div>
            <div class="form-actions">
              <button class="btn-primary" @click="changePassword">
                <el-icon><Key /></el-icon>
                修改密码
              </button>
            </div>
          </div>
        </div>

        <div v-if="activeTab === 'statistics'" class="tab-content">
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-icon documents">
                <el-icon><Document /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ statistics.knowledge_base?.document_count || 0 }}</div>
                <div class="stat-label">已上传文档</div>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon knowledge">
                <el-icon><Document /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ statistics.knowledge_base?.knowledge_point_count || 0 }}</div>
                <div class="stat-label">提取知识点</div>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon learning">
                <el-icon><Clock /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ statistics.learning?.total_days || 0 }}</div>
                <div class="stat-label">总学习天数</div>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon questions">
                <el-icon><Brush /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ statistics.learning?.total_questions || 0 }}</div>
                <div class="stat-label">总做题量</div>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon accuracy">
                <el-icon><Check /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ statistics.learning?.avg_accuracy || 0 }}%</div>
                <div class="stat-label">平均正确率</div>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon mistakes">
                <el-icon><Warning /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ statistics.mistakes?.total_count || 0 }}</div>
                <div class="stat-label">累计错题数</div>
              </div>
            </div>
          </div>

          <div class="section-card">
            <h2 class="section-title">高频错误类型</h2>
            <div v-if="errorTags.length > 0" class="error-tags">
              <div v-for="tag in errorTags" :key="tag.name" class="tag-item">
                <span class="tag-name">{{ tag.name }}</span>
                <span class="tag-count">{{ tag.count }}次</span>
                <div class="tag-bar">
                  <div class="tag-fill" :style="{ width: tag.percent + '%' }"></div>
                </div>
              </div>
            </div>
            <div v-else class="empty-state">
              <el-icon><InfoFilled /></el-icon>
              <span>暂无错题数据</span>
            </div>
          </div>

          <div class="section-card">
            <h2 class="section-title">学习报告导出</h2>
            <div class="export-section">
              <p class="export-desc">一键导出完整个人学习报告，包含画像数据、学习趋势、错题汇总、知识点掌握情况</p>
              <div class="export-buttons">
                <button class="btn-primary" @click="exportReport('markdown')">
                  <el-icon><Download /></el-icon>
                  导出 Markdown
                </button>
                <button class="btn-secondary" @click="exportReport('txt')">
                  <el-icon><Document /></el-icon>
                  导出 TXT
                </button>
              </div>
            </div>
          </div>
        </div>

        <div v-if="activeTab === 'shortcuts'" class="tab-content">
          <div class="shortcuts-grid">
            <div class="shortcut-card" @click="$router.push('/profile')">
              <div class="shortcut-icon profile">
                <el-icon><User /></el-icon>
              </div>
              <div class="shortcut-title">学习画像</div>
              <div class="shortcut-desc">查看个人学习画像和智能分析</div>
            </div>
            <div class="shortcut-card" @click="$router.push('/path')">
              <div class="shortcut-icon path">
                <el-icon><MapLocation /></el-icon>
              </div>
              <div class="shortcut-title">学习路径</div>
              <div class="shortcut-desc">查看和管理学习路径规划</div>
            </div>
            <div class="shortcut-card" @click="$router.push('/evaluation')">
              <div class="shortcut-icon evaluation">
                <el-icon><TrendCharts /></el-icon>
              </div>
              <div class="shortcut-title">错题评估</div>
              <div class="shortcut-desc">查看错题记录和学情分析</div>
            </div>
            <div class="shortcut-card" @click="$router.push('/knowledge')">
              <div class="shortcut-icon knowledge">
                <el-icon><FolderOpened /></el-icon>
              </div>
              <div class="shortcut-title">知识库管理</div>
              <div class="shortcut-desc">管理上传文档和知识点</div>
            </div>
            <div class="shortcut-card" @click="$router.push('/resource')">
              <div class="shortcut-icon resource">
                <el-icon><Files /></el-icon>
              </div>
              <div class="shortcut-title">资源中心</div>
              <div class="shortcut-desc">查看AI生成的学习资源</div>
            </div>
            <div class="shortcut-card" @click="$router.push('/graph')">
              <div class="shortcut-icon graph">
                <el-icon><Link /></el-icon>
              </div>
              <div class="shortcut-title">知识图谱</div>
              <div class="shortcut-desc">可视化知识点关系图谱</div>
            </div>
          </div>
        </div>

        <div v-if="activeTab === 'settings'" class="tab-content">
          <div class="section-card">
            <h2 class="section-title">主题设置</h2>
            <div class="theme-options">
              <div 
                class="theme-item" 
                :class="{ active: preferences.theme === 'light' }"
                @click="updatePreference('theme', 'light')"
              >
                <div class="theme-preview light"></div>
                <span>浅色主题</span>
              </div>
              <div 
                class="theme-item" 
                :class="{ active: preferences.theme === 'dark' }"
                @click="updatePreference('theme', 'dark')"
              >
                <div class="theme-preview dark"></div>
                <span>深色主题</span>
              </div>
            </div>
          </div>

          <div class="section-card">
            <h2 class="section-title">学习设置</h2>
            <div class="setting-row">
              <span class="setting-label">自动更新学习画像</span>
              <el-switch 
                v-model="preferences.auto_update_profile"
                @change="updatePreference('auto_update_profile', $event)"
              />
            </div>
            <div class="setting-row">
              <span class="setting-label">自动调整学习路径</span>
              <el-switch 
                v-model="preferences.auto_adjust_path"
                @change="updatePreference('auto_adjust_path', $event)"
              />
            </div>
          </div>

          <div class="section-card">
            <h2 class="section-title">退出登录</h2>
            <div class="logout-section">
              <p class="logout-desc">点击下方按钮退出当前账号，所有缓存数据将被清除</p>
              <button class="btn-danger" @click="handleLogout">
                <el-icon><SwitchButton /></el-icon>
                退出登录
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <el-dialog v-model="showReportModal" title="学习报告预览" width="800px">
      <div class="report-content">
        <pre>{{ reportContent }}</pre>
      </div>
      <template #footer>
        <button class="btn-primary" @click="downloadReport">
          <el-icon><Download /></el-icon>
          下载报告
        </button>
        <button class="btn-secondary" @click="showReportModal = false">
          关闭
        </button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { 
  ArrowLeft, User, TrendCharts, Document, Brush, Edit, Check, Close, Key,
  Camera, Clock, Warning,
  Download, MapLocation, FolderOpened, Files, Link, InfoFilled,
  SwitchButton
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const router = useRouter()

const activeTab = ref('profile')
const isEditing = ref(false)
const showAvatarModal = ref(false)
const showReportModal = ref(false)
const reportContent = ref('')
const currentExportFormat = ref('markdown')

const userInfo = reactive({
  id: 0,
  username: '',
  email: '',
  avatar: '',
  major: '',
  learning_direction: '',
  role: 'student',
  preferences: {},
  created_at: ''
})

const editForm = reactive({
  username: '',
  major: '',
  learningDirection: ''
})

const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const statistics = reactive({
  knowledge_base: { document_count: 0, knowledge_point_count: 0 },
  learning: { total_days: 0, total_questions: 0, avg_accuracy: 0, completed_plans: 0, total_plans: 0 },
  mistakes: { total_count: 0, error_tags: {} }
})

const preferences = reactive({
  theme: 'light',
  auto_update_profile: true,
  auto_adjust_path: true
})

const errorTags = computed(() => {
  const tags = statistics.mistakes?.error_tags || {}
  const total = Object.values(tags).reduce((sum, count) => sum + count, 0)
  return Object.entries(tags).map(([name, count]) => ({
    name,
    count,
    percent: total > 0 ? (count / total) * 100 : 0
  })).sort((a, b) => b.count - a.count)
})

onMounted(() => {
  fetchUserProfile()
  fetchStatistics()
})

const fetchUserProfile = async () => {
  const token = localStorage.getItem('zhinote_token')
  if (!token) return
  
  try {
    const response = await fetch('/api/auth/user/profile', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const data = await response.json()
    if (data.code === 0) {
      Object.assign(userInfo, data.data)
      editForm.username = userInfo.username
      editForm.major = userInfo.major || ''
      editForm.learningDirection = userInfo.learning_direction || ''
      
      const prefs = userInfo.preferences || {}
      preferences.theme = prefs.theme || 'light'
      preferences.auto_update_profile = prefs.auto_update_profile !== false
      preferences.auto_adjust_path = prefs.auto_adjust_path !== false
    }
  } catch (error) {
    console.error('获取用户信息失败:', error)
  }
}

const fetchStatistics = async () => {
  const token = localStorage.getItem('zhinote_token')
  if (!token) return
  
  try {
    const response = await fetch('/api/auth/user/statistics', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const data = await response.json()
    if (data.code === 0) {
      Object.assign(statistics, data.data)
    }
  } catch (error) {
    console.error('获取统计数据失败:', error)
  }
}

const startEditing = () => {
  isEditing.value = true
}

const cancelEditing = () => {
  isEditing.value = false
  editForm.username = userInfo.username
  editForm.major = userInfo.major || ''
  editForm.learningDirection = userInfo.learning_direction || ''
}

const saveProfile = async () => {
  const token = localStorage.getItem('zhinote_token')
  if (!token) return
  
  try {
    const response = await fetch('/api/auth/user/profile', {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: editForm.username,
        major: editForm.major,
        learning_direction: editForm.learningDirection
      })
    })
    const data = await response.json()
    if (data.code === 0) {
      Object.assign(userInfo, data.data)
      localStorage.setItem('zhinote_user', JSON.stringify({
        id: data.data.id,
        username: data.data.username,
        email: data.data.email,
        role: data.data.role
      }))
      isEditing.value = false
      ElMessage.success('信息修改成功')
    } else {
      ElMessage.error(data.message)
    }
  } catch (error) {
    ElMessage.error('修改失败')
  }
}

const changePassword = async () => {
  if (!passwordForm.oldPassword || !passwordForm.newPassword) {
    ElMessage.warning('请填写旧密码和新密码')
    return
  }
  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    ElMessage.warning('两次输入的密码不一致')
    return
  }
  
  const token = localStorage.getItem('zhinote_token')
  if (!token) return
  
  try {
    const response = await fetch('/api/auth/user/change-password', {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        old_password: passwordForm.oldPassword,
        new_password: passwordForm.newPassword
      })
    })
    const data = await response.json()
    if (data.code === 0) {
      ElMessage.success('密码修改成功')
      passwordForm.oldPassword = ''
      passwordForm.newPassword = ''
      passwordForm.confirmPassword = ''
    } else {
      ElMessage.error(data.message)
    }
  } catch (error) {
    ElMessage.error('修改失败')
  }
}

const updatePreference = async (key, value) => {
  preferences[key] = value
  
  if (key === 'theme') {
    applyTheme(value)
  }
  
  const token = localStorage.getItem('zhinote_token')
  if (!token) return
  
  try {
    await fetch('/api/auth/user/profile', {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ preferences })
    })
  } catch (error) {
    console.error('更新偏好设置失败:', error)
  }
}

const applyTheme = (theme) => {
  const root = document.documentElement
  if (theme === 'dark') {
    root.setAttribute('data-theme', 'dark')
    root.style.background = '#1e293b'
  } else {
    root.setAttribute('data-theme', 'light')
    root.style.background = '#f8fafc'
  }
  localStorage.setItem('zhinote_theme', theme)
}

const exportReport = async (format) => {
    const token = localStorage.getItem('zhinote_token')
    if (!token) return
    
    try {
      const response = await fetch(`/api/auth/user/export-report?format=${format}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      if (data.code === 0) {
        reportContent.value = data.data.content
        showReportModal.value = true
        currentExportFormat.value = format
      }
    } catch (error) {
      ElMessage.error('导出失败')
    }
  }

  const downloadReport = () => {
    const ext = currentExportFormat.value === 'txt' ? 'txt' : 'md'
    const type = currentExportFormat.value === 'txt' ? 'text/plain' : 'text/markdown'
    const blob = new Blob([reportContent.value], { type })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `学习报告_${userInfo.username}_${new Date().toISOString().split('T')[0]}.${ext}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    showReportModal.value = false
    ElMessage.success('报告下载成功')
  }

const handleLogout = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要退出登录吗？退出后将清除所有本地缓存数据',
      '退出登录',
      {
        confirmButtonText: '确定退出',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    localStorage.removeItem('zhinote_token')
    localStorage.removeItem('zhinote_user')
    ElMessage.success('已退出登录')
    router.push('/')
  } catch {
    ElMessage.info('已取消退出')
  }
}

const getAvatarGradient = (username) => {
  const colors = [
    'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
    'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)'
  ]
  let hash = 0
  for (let i = 0; i < (username || '').length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

const getRoleLabel = (role) => {
  const roles = { admin: '管理员', teacher: '教师', student: '学生' }
  return roles[role] || '用户'
}

const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString('zh-CN')
}
</script>

<style scoped>
.personal-center {
  height: 100%;
  padding: 24px;
  background: #f8fafc;
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

.page-title {
  font-size: 24px;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}

.content-wrapper {
  display: flex;
  gap: 24px;
  height: calc(100% - 60px);
}

.left-panel {
  width: 280px;
  flex-shrink: 0;
}

.avatar-section {
  background: white;
  border-radius: 16px;
  padding: 32px 24px;
  text-align: center;
  margin-bottom: 16px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

.avatar-container {
  position: relative;
  display: inline-block;
  margin-bottom: 16px;
}

.avatar {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40px;
  font-weight: 700;
  color: white;
}

.change-avatar-btn {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #3b82f6;
  border: 3px solid white;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.change-avatar-btn:hover {
  background: #2563eb;
  transform: scale(1.1);
}

.user-name {
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 4px;
}

.user-role {
  font-size: 14px;
  color: #64748b;
}

.nav-section {
  background: white;
  border-radius: 16px;
  padding: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 10px;
  font-size: 15px;
  color: #475569;
  cursor: pointer;
  transition: all 0.2s;
}

.nav-item:hover {
  background: #f1f5f9;
}

.nav-item.active {
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  color: #2563eb;
}

.right-panel {
  flex: 1;
  overflow-y: auto;
}

.tab-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.section-card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 20px 0;
  padding-bottom: 12px;
  border-bottom: 1px solid #e2e8f0;
}

.form-row {
  display: flex;
  gap: 24px;
  margin-bottom: 16px;
}

.form-row > * {
  flex: 1;
}

.form-value {
  display: inline-block;
  padding: 8px 12px;
  background: #f1f5f9;
  border-radius: 8px;
  font-size: 14px;
  color: #475569;
}

.form-actions {
  display: flex;
  gap: 12px;
  padding-top: 16px;
  border-top: 1px solid #e2e8f0;
}

.btn-primary {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
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

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 16px;
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: white;
}

.stat-icon.documents { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); }
.stat-icon.knowledge { background: linear-gradient(135deg, #10b981 0%, #059669 100%); }
.stat-icon.learning { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); }
.stat-icon.questions { background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); }
.stat-icon.accuracy { background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%); }
.stat-icon.mistakes { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); }

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #1e293b;
}

.stat-label {
  font-size: 14px;
  color: #64748b;
}

.error-tags {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.tag-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.tag-name {
  width: 100px;
  font-size: 14px;
  color: #475569;
}

.tag-count {
  width: 60px;
  font-size: 14px;
  color: #64748b;
  text-align: right;
}

.tag-bar {
  flex: 1;
  height: 8px;
  background: #e2e8f0;
  border-radius: 4px;
  overflow: hidden;
}

.tag-fill {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%);
  border-radius: 4px;
  transition: width 0.3s;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 40px;
  color: #94a3b8;
  font-size: 16px;
}

.export-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.export-desc {
  font-size: 14px;
  color: #64748b;
  margin: 0;
}

.export-buttons {
  display: flex;
  gap: 12px;
}

.shortcuts-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.shortcut-card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

.shortcut-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.shortcut-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  color: white;
  margin-bottom: 16px;
}

.shortcut-icon.profile { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); }
.shortcut-icon.path { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); }
.shortcut-icon.evaluation { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); }
.shortcut-icon.knowledge { background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); }
.shortcut-icon.resource { background: linear-gradient(135deg, #10b981 0%, #059669 100%); }
.shortcut-icon.graph { background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%); }

.shortcut-title {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 8px;
}

.shortcut-desc {
  font-size: 13px;
  color: #64748b;
}

.theme-options {
  display: flex;
  gap: 24px;
}

.theme-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px 24px;
  border-radius: 12px;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.2s;
}

.theme-item.active {
  border-color: #3b82f6;
  background: #eff6ff;
}

.theme-preview {
  width: 64px;
  height: 64px;
  border-radius: 12px;
}

.theme-preview.light {
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border: 1px solid #e2e8f0;
}

.theme-preview.dark {
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
}

.setting-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 0;
  border-bottom: 1px solid #f1f5f9;
}

.setting-row:last-child {
  border-bottom: none;
}

.setting-label {
  font-size: 15px;
  color: #334155;
}

.logout-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.logout-desc {
  font-size: 14px;
  color: #64748b;
  margin: 0;
}

.report-content {
  max-height: 500px;
  overflow-y: auto;
  background: #f8fafc;
  border-radius: 12px;
  padding: 20px;
}

.report-content pre {
  white-space: pre-wrap;
  word-break: break-word;
  font-size: 14px;
  color: #334155;
  margin: 0;
}

@media (max-width: 1200px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .shortcuts-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .content-wrapper {
    flex-direction: column;
  }
  .left-panel {
    width: 100%;
  }
  .stats-grid {
    grid-template-columns: 1fr;
  }
  .shortcuts-grid {
    grid-template-columns: 1fr;
  }
}
</style>
