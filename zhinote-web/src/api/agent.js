import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 120000,
  withCredentials: true
})

api.interceptors.response.use(
  response => response,
  error => {
    console.error('API Error:', error)
    return Promise.reject(error)
  }
)

export const agentApi = {
  initSession: () => {
    return api.post('/agent/session')
  },
  
  chat: (message, history = []) => {
    return api.post('/agent/chat', { message, history })
  },
  
  getChatHistory: () => {
    return api.get('/agent/chat/history')
  },
  
  clearChatHistory: () => {
    return api.post('/agent/chat/clear')
  },
  
  getProfile: () => {
    return api.get('/agent/profile')
  },
  
  updateProfile: (data) => {
    return api.post('/agent/profile', data)
  },
  
  explain: (topic, profile = {}) => {
    return api.post('/agent/explain', { topic, profile })
  },
  
  generateQuestions: (topic, difficulty = 'medium', count = 5) => {
    return api.post('/agent/questions', { topic, difficulty, count })
  },
  
  getQuestions: () => {
    return api.get('/agent/questions')
  },
  
  getQuestion: (questionId) => {
    return api.get(`/agent/question/${questionId}`)
  },
  
  getPlan: () => {
    return api.get('/agent/plan')
  },
  
  createPlan: () => {
    return api.post('/agent/plan')
  },
  
  updatePlanStatus: (step, status) => {
    return api.put('/agent/plan/status', { step, status })
  },
  
  adjustPlan: (evaluation) => {
    return api.put('/agent/plan/update', evaluation)
  },
  
  evaluate: (answers) => {
    return api.post('/agent/evaluate', { answers })
  },
  
  generateResource: (topic, type) => {
    return api.post('/agent/resource', { topic, resource_type: type })
  },
  
  getResources: () => {
    return api.get('/agent/resources')
  },
  
  getMistakes: () => {
    return api.get('/agent/mistakes')
  },
  
  getMistakesFull: () => {
    return api.get('/agent/mistakes/full')
  },
  
  getMistakesBySubject: (subject) => {
    return api.get(`/agent/mistakes/subject/${subject}`)
  },
  
  getMistakesStats: () => {
    return api.get('/agent/mistakes/stats')
  },
  
  getMistakesTrend: (days = 7) => {
    return api.get(`/agent/mistakes/trend?days=${days}`)
  },
  
  addMistake: (data) => {
    return api.post('/agent/mistakes', data)
  },
  
  reviewMistake: (mistakeId) => {
    return api.post(`/agent/mistakes/${mistakeId}/review`)
  },
  
  unreviewMistake: (mistakeId) => {
    return api.post(`/agent/mistakes/${mistakeId}/unreview`)
  },
  
  deleteMistake: (mistakeId) => {
    return api.delete(`/agent/mistakes/${mistakeId}`)
  },
  
  clearMistakes: () => {
    return api.delete('/agent/mistakes')
  },
  
  importMistakes: (data) => {
    return api.post('/agent/mistakes/import', data)
  },
  
  exportMistakes: () => {
    return api.get('/agent/mistakes/export', {
      responseType: 'blob'
    })
  },
  
  getAgentStatus: () => {
    return api.get('/agent/status')
  },
  
  runWorkflow: (input) => {
    return api.post('/agent/workflow', { input })
  },
  
  getRecords: () => {
    return api.get('/agent/records')
  },
  
  addRecord: (data) => {
    return api.post('/agent/records', data)
  },
  
  generateRecommendations: (profile = {}, plan = {}) => {
    return api.post('/agent/recommendations')
  },
  
  getRecommendations: () => {
    return api.get('/agent/recommendations')
  },
  
  triggerLearningLoop: () => {
    return api.post('/agent/learning-loop')
  },
  
  runLearningLoop: (input, answers = []) => {
    return api.post('/agent/loop', { input, answers })
  },
  
  uploadDocument: (file) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/agent/document/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  
  getDocuments: () => {
    return api.get('/agent/documents')
  },
  
  getDocument: (docId) => {
    return api.get(`/agent/document/${docId}`)
  },
  
  extractTopics: (docId) => {
    return api.post(`/agent/document/${docId}/extract-topics`)
  },
  
  deleteDocument: (docId) => {
    return api.delete(`/agent/document/${docId}`)
  },
  
  saveTopics: (docId, topicsData) => {
    return api.post(`/agent/document/${docId}/save-topics`, topicsData)
  },
  
  getKnowledgePoints: (docId) => {
    return api.get(`/agent/document/${docId}/knowledge-points`)
  },
  
  updateKnowledgePoint: (pointId, data) => {
    return api.post(`/agent/knowledge-point/${pointId}`, data)
  },
  
  deleteKnowledgePoint: (pointId) => {
    return api.delete(`/agent/knowledge-point/${pointId}`)
  },
  
  getKnowledgeStats: () => {
    return api.get('/agent/knowledge/stats')
  },
  
  ocrAnalyze: (image_text) => {
    return api.post('/agent/ocr', { image_text })
  },
  
  ocrAnalyzeImage: (file) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/agent/ocr/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  
  exportData: (dataType) => {
    return api.post(`/agent/export`, { dataType }, {
      responseType: 'blob'
    })
  }
}

export default api
