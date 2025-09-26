import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [react()],
    server: {
      proxy: {
        // Any request starting with /api/v1/doctors, send it to the doctor backend
        '/api/v1/doctors': {
          target: env.VITE_DOCTOR_BACKEND_URL || 'http://localhost:5001',
          changeOrigin: true,
        },
        // Any other request starting with /api/v1, send it to the user backend
        '/api/v1': {
          target: env.VITE_USER_BACKEND_URL || 'http://localhost:8000',
          changeOrigin: true,
        },
      }
    },
  }
})