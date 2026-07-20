import { reactive } from 'vue'

const chatStore = reactive({
  messages: [],
  currentProfile: {},
  sessionKey: null,
  
  setMessages(messages) {
    this.messages = messages
  },
  
  addMessage(message) {
    this.messages.push(message)
  },
  
  clearMessages() {
    this.messages = []
    this.currentProfile = {}
  },
  
  setProfile(profile) {
    this.currentProfile = profile
  },
  
  setSessionKey(key) {
    this.sessionKey = key
  }
})

export default chatStore