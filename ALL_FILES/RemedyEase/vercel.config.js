import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// This function configures Vite.
export default defineConfig(({ mode }) => {
  // This loads the environment variables from your .env file (e.g., VITE_USER_BACKEND_URL)
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [react()],
    // This 'server' block is only used for your local development server (when you run `npm run dev`)
    server: {
      // The 'proxy' tells Vite how to handle API requests.
      proxy: {
        // --- DOCTOR BACKEND ROUTES ---
        // These rules are checked first because they are more specific.
        
        // Rule 1: If a request starts with /api/v1/doctors...
        '/api/v1/doctors': {
          // ...forward it to your doctor backend.
          target: env.VITE_DOCTOR_BACKEND_URL || 'http://localhost:5001',
          changeOrigin: true, // Recommended for avoiding CORS issues
        },
        // Rule 2: If a request starts with /api/v1/appointments...
        '/api/v1/appointments': {
          // ...forward it to your doctor backend.
          target: env.VITE_DOCTOR_BACKEND_URL || 'http://localhost:5001',
          changeOrigin: true,
        },
        // Rule 3: If a request starts with /api/v1/live...
        '/api/v1/live': {
          // ...forward it to your doctor backend.
          target: env.VITE_DOCTOR_BACKEND_URL || 'http://localhost:5001',
          changeOrigin: true,
        },

        // --- USER BACKEND CATCH-ALL RULE ---
        // This rule is last. It catches any other API request.
        
        // Rule 4: If a request starts with /api/v1 (and didn't match the rules above)...
        '/api/v1': {
          // ...forward it to your user backend.
          target: env.VITE_USER_BACKEND_URL || 'http://localhost:8000',
          changeOrigin: true,
        },
      }
    },
  }
})

