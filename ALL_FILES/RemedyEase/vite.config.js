import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [react()],
    server: {
      proxy: {
        // Routes that should go to the DOCTOR backend
        '/api/v1/doctors': {
          target: env.VITE_DOCTOR_BACKEND_URL || 'http://localhost:5001',
          changeOrigin: true,
        },
        '/api/v1/appointments': {
          target: env.VITE_DOCTOR_BACKEND_URL || 'http://localhost:5001',
          changeOrigin: true,
        },
        '/api/v1/live': {
          target: env.VITE_DOCTOR_BACKEND_URL || 'http://localhost:5001',
          changeOrigin: true,
        },

        // All other /api/v1 routes go to the USER backend
        '/api/v1': {
          target: env.VITE_USER_BACKEND_URL || 'http://localhost:8000',
          changeOrigin: true,
        },
      }
    },
  }
})
