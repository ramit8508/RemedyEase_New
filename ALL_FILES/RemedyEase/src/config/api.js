// API Configuration for Production (Using Proxy)

export const API_CONFIG = {
  // Base URLs - Empty strings will use relative paths through proxy
  USER_BACKEND_URL: '',
  DOCTOR_BACKEND_URL: '',
  
  // Socket URLs - Will use current origin
  SOCKET_URLS: {
    USER: '',
    DOCTOR: ''
  },
  
  // API Endpoints 
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

// Helper function to get full API URL (now uses proxy paths)
export const getApiUrl = (endpoint, backend = 'USER') => {
  // For proxy setup, we use relative paths with different prefixes
  if (backend === 'DOCTOR') {
    return `/doctor-api${endpoint}`;
  }
  return `/user-api${endpoint}`;
};

// Socket URL helper (now uses relative paths)
export const getSocketUrl = (type = 'DOCTOR') => {
  // Return current origin for socket connections
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return '';
};