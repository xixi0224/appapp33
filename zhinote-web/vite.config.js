import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
<<<<<<< HEAD
=======
  base: '/',
>>>>>>> 4f174552fdd0bf3d635780d8f0719457d5ed4a57
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
        cookieDomainRewrite: ''
      }
    }
  }
})
