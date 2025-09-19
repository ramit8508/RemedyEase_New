import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // User Backend on Port 8000
      '/api/v1/users': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/api/v1/ai': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },

      // Doctor Backend on Port 5001
      '/api/v1/doctors': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      },
      '/api/v1/appointments': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      }
    }
  },
})