import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    plugins: [react()],
    server: {
      proxy: {
        // User Backend APIs
        '/api/v1/users': {
          target: env.VITE_USER_BACKEND_URL || 'http://localhost:8000',
          changeOrigin: true,
        },
        '/api/v1/ai': {
          target: env.VITE_USER_BACKEND_URL || 'http://localhost:8000',
          changeOrigin: true,
        },

        // Doctor Backend APIs
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
        }
      }
    },
    build: {
      // Ensure environment variables are available in production
      rollupOptions: {
        external: [],
      }
    }
  }
})