import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [react()],
    server: {
      proxy: {
        // Doctor backend routes - appointments, live chat, video calls
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
        '/api/v1/doctor-ai': {
          target: env.VITE_DOCTOR_BACKEND_URL || 'http://localhost:5001',
          changeOrigin: true,
        },
        // User backend routes - user authentication and management
        '/api/v1/users': {
          target: env.VITE_USER_BACKEND_URL || 'http://localhost:8000',
          changeOrigin: true,
        },
        // Catch-all for any other /api/v1 routes
        '/api/v1': {
          target: env.VITE_USER_BACKEND_URL || 'http://localhost:8000',
          changeOrigin: true,
        },
      }
    },
  }
})