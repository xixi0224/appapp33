import { createRouter, createWebHistory } from 'vue-router'
import HomePage from '../views/HomePage.vue'
import ChatPage from '../views/ChatPage.vue'
import ProfilePage from '../views/ProfilePage.vue'
import PathPage from '../views/PathPage.vue'
import ResourcePage from '../views/ResourcePage.vue'
import EvaluationPage from '../views/EvaluationPage.vue'
import AgentPage from '../views/AgentPage.vue'
import KnowledgeBasePage from '../views/KnowledgeBasePage.vue'
import GraphPage from '../views/GraphPage.vue'
import PersonalCenterPage from '../views/PersonalCenterPage.vue'

const routes = [
  { path: '/', name: 'home', component: HomePage, meta: { requiresAuth: false } },
  { path: '/chat', name: 'chat', component: ChatPage, meta: { requiresAuth: false } },
  { path: '/graph', name: 'graph', component: GraphPage, meta: { requiresAuth: false } },
  { path: '/profile', name: 'profile', component: ProfilePage, meta: { requiresAuth: true } },
  { path: '/path', name: 'path', component: PathPage, meta: { requiresAuth: true } },
  { path: '/resource', name: 'resource', component: ResourcePage, meta: { requiresAuth: true } },
  { path: '/evaluation', name: 'evaluation', component: EvaluationPage, meta: { requiresAuth: true } },
  { path: '/agent', name: 'agent', component: AgentPage, meta: { requiresAuth: true } },
  { path: '/knowledge', name: 'knowledge', component: KnowledgeBasePage, meta: { requiresAuth: true } },
  { path: '/personal-center', name: 'personal-center', component: PersonalCenterPage, meta: { requiresAuth: true } }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const isLoggedIn = localStorage.getItem('zhinote_token')
  
  if (to.meta.requiresAuth) {
    if (isLoggedIn) {
      next()
    } else {
      next('/')
    }
  } else {
    next()
  }
})

export default router