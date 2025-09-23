// API Configuration for Development

export const API_CONFIG = {
  // Base URLs for development
  USER_BACKEND_URL: 'http://localhost:8000',
  DOCTOR_BACKEND_URL: 'http://localhost:5001',
  
  // Socket URLs for development
  SOCKET_URLS: {
    USER: 'http://localhost:8000',
    DOCTOR: 'http://localhost:5001'
  },
  
  // API Endpoints for development
  ENDPOINTS: {
    // User APIs
    USERS: '/api/v1/users',
    AI: '/api/v1/ai',
    
    // Doctor APIs  
    DOCTORS: '/api/v1/doctors',
    APPOINTMENTS: '/api/v1/appointments',
    AI_DOCTOR: '/api/v1/doctor-ai',
    
    // Live Features
    LIVE: '/api/v1/live'
  }
};

// Helper function to get full API URL
export const getApiUrl = (endpoint, backend = 'USER') => {
  const baseUrl = backend === 'DOCTOR' ? API_CONFIG.DOCTOR_BACKEND_URL : API_CONFIG.USER_BACKEND_URL;
  return `${baseUrl}${endpoint}`;
};

// Socket URL helper
export const getSocketUrl = (type = 'DOCTOR') => {
  return API_CONFIG.SOCKET_URLS[type];
};