<template>
  <div class="app-container">
    <el-container style="height: 100vh;">
      <el-aside width="230px" style="background: rgba(255,255,255,0.98); backdrop-filter: blur(12px); border-right: 1px solid #e2e8f0; flex-shrink: 0;">
        <div class="logo">
          <div class="logo-icon">📝</div>
          <div class="logo-text">ZhiNote</div>
          <div class="logo-subtext">智能学习助手</div>
        </div>
        
        <div v-if="isLoggedIn && currentUser" class="user-info-section">
          <div class="user-avatar">
            <span class="avatar-text">{{ currentUser?.username?.charAt(0)?.toUpperCase() || '?' }}</span>
          </div>
          <div class="user-details">
            <div class="user-name">{{ currentUser?.username || '用户' }}</div>
            <div class="user-role">{{ getRoleLabel(currentUser?.role) }}</div>
          </div>
        </div>
        <el-menu
          :default-active="activeMenu"
          class="menu"
          mode="vertical"
          @select="handleMenuSelect"
        >
          <el-menu-item index="/chat">
            <template #icon><el-icon><ChatDotRound /></el-icon></template>
            <span>对话学习</span>
          </el-menu-item>
          <template v-if="isLoggedIn">
            <el-menu-item index="/graph">
              <template #icon><el-icon><Link /></el-icon></template>
              <span>知识图谱</span>
            </el-menu-item>
            <el-menu-item index="/profile">
              <template #icon><el-icon><User /></el-icon></template>
              <span>学习画像</span>
            </el-menu-item>
            <el-menu-item index="/path">
              <template #icon><el-icon><MapLocation /></el-icon></template>
              <span>学习路径</span>
            </el-menu-item>
            <el-menu-item index="/resource">
              <template #icon><el-icon><Document /></el-icon></template>
              <span>资源中心</span>
            </el-menu-item>
            <el-menu-item index="/evaluation">
              <template #icon><el-icon><TrendCharts /></el-icon></template>
              <span>错题评估</span>
            </el-menu-item>
            <el-menu-item index="/agent">
              <template #icon><el-icon><Brush /></el-icon></template>
              <span>Agent协作</span>
            </el-menu-item>
            <el-menu-item index="/knowledge">
              <template #icon><el-icon><FolderOpened /></el-icon></template>
              <span>知识库管理</span>
            </el-menu-item>
          </template>
        </el-menu>
        <div class="bottom-section">
          <div v-if="isLoggedIn" class="user-menu">
            <el-dropdown @command="handleUserCommand">
              <div class="dropdown-trigger">
                <div class="mini-avatar">
                  <span>{{ currentUser?.username?.charAt(0)?.toUpperCase() }}</span>
                </div>
                <span class="user-name-mini">{{ currentUser?.username }}</span>
                <el-icon><ArrowDown /></el-icon>
              </div>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="profile">
                    <el-icon><User /></el-icon>
                    个人中心
                  </el-dropdown-item>
                  <el-dropdown-item command="logout">
                    <el-icon><SwitchButton /></el-icon>
                    退出登录
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>
      </el-aside>
      <el-container style="flex: 1;">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </el-container>
    </el-container>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ChatDotRound, User, MapLocation, Document, TrendCharts, Brush, FolderOpened, Link, ArrowDown, SwitchButton } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const route = useRoute()
const router = useRouter()

const isLoggedIn = ref(false)
const currentUser = ref(null)

onMounted(() => {
  updateAuthState()
  window.addEventListener('auth-change', updateAuthState)
})

onUnmounted(() => {
  window.removeEventListener('auth-change', updateAuthState)
})

watch(() => route.path, () => {
  updateAuthState()
})

const updateAuthState = () => {
  const token = localStorage.getItem('zhinote_token')
  const userStr = localStorage.getItem('zhinote_user')
  
  isLoggedIn.value = !!token
  currentUser.value = userStr ? JSON.parse(userStr) : null
  
  applyTheme()
}

const applyTheme = () => {
  const theme = localStorage.getItem('zhinote_theme') || 'light'
  const root = document.documentElement
  if (theme === 'dark') {
    root.setAttribute('data-theme', 'dark')
    root.style.background = '#1e293b'
  } else {
    root.setAttribute('data-theme', 'light')
    root.style.background = '#f8fafc'
  }
}

const activeMenu = computed(() => route.path)

const handleMenuSelect = (index) => {
  router.push(index)
}

const goToHome = () => {
  router.push('/')
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
    localStorage.removeItem('zhinote_guest')
    updateAuthState()
    ElMessage.success('已退出登录')
    router.push('/')
  } catch {
    ElMessage.info('已取消退出')
  }
}

const getRoleLabel = (role) => {
  const roles = {
    'admin': '管理员',
    'teacher': '教师',
    'student': '学生'
  }
  return roles[role] || '用户'
}

const handleUserCommand = (command) => {
  if (command === 'profile') {
    router.push('/personal-center')
  } else if (command === 'logout') {
    handleLogout()
  }
}
</script>

<style scoped>
.app-container {
<<<<<<< HEAD
  min-height: 100vh;
  width: 100%;
=======
  height: 100vh;
  width: 100vw;
  overflow: hidden;
>>>>>>> 4f174552fdd0bf3d635780d8f0719457d5ed4a57
  background: #f8fafc;
}

.el-container {
<<<<<<< HEAD
  min-height: 100vh;
  display: flex;
=======
  height: 100%;
>>>>>>> 4f174552fdd0bf3d635780d8f0719457d5ed4a57
}

.logo {
  padding: 28px 24px;
  text-align: center;
  border-bottom: 1px solid #e2e8f0;
}

.logo-icon {
  font-size: 52px;
  margin-bottom: 10px;
}

.logo-text {
  font-size: 22px;
  font-weight: 700;
  color: #1e293b;
}

.logo-subtext {
  font-size: 12px;
  color: #94a3b8;
  margin-top: 4px;
}

.menu {
  border-right: none;
  padding-top: 16px;
  height: calc(100% - 190px);
  overflow-y: auto;
}

.user-info-section {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  border-bottom: 1px solid #bfdbfe;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.avatar-text {
  font-size: 18px;
  font-weight: 700;
  color: white;
}

.user-details {
  flex: 1;
  min-width: 0;
}

.user-name {
  font-size: 15px;
  font-weight: 600;
  color: #1e293b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-role {
  font-size: 12px;
  color: #64748b;
  margin-top: 2px;
}

.bottom-section {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 16px 20px;
  background: rgba(255, 255, 255, 0.95);
  border-top: 1px solid #e2e8f0;
}

.user-menu {
  width: 100%;
}

.dropdown-trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
}

.dropdown-trigger:hover {
  background: #f1f5f9;
}

.mini-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.mini-avatar span {
  font-size: 14px;
  font-weight: 600;
  color: white;
}

.user-name-mini {
  flex: 1;
  margin-left: 10px;
  font-size: 14px;
  font-weight: 500;
  color: #1e293b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
<<<<<<< HEAD

.el-aside {
  position: sticky;
  top: 0;
  height: 100vh;
  flex-shrink: 0;
}
=======
>>>>>>> 4f174552fdd0bf3d635780d8f0719457d5ed4a57
</style>