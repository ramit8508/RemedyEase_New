import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/v1/doctors': 'http://localhost:5000',
      '/api/v1/users': 'http://localhost:8000',
      '/api/v1/ai': 'http://localhost:8000',
    },
  },
})
  