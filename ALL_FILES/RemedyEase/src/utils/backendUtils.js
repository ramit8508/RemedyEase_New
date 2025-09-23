// Backend health check utilities for development

// Local development URLs
export const wakeUpBackends = async () => {
  // Local development servers
  const backends = [
    'http://localhost:8000',
    'http://localhost:5001'
  ];
  
  console.log('� Checking local backends...');
  
  const healthPromises = backends.map(async (url) => {
    try {
      const response = await fetch(url, { 
        method: 'GET',
        mode: 'cors'
      });
      console.log(`✅ ${url} is ready (${response.status})`);
      return response;
    } catch (error) {
      console.error(`❌ ${url} check failed:`, error);
      throw error;
    }
  });
  
  await Promise.allSettled(healthPromises);
  console.log('🚀 Backend check completed');
};

export const fetchWithRetry = async (url, options = {}, maxRetries = 2) => {
  // Retry logic for better reliability
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 Attempt ${attempt} for ${url}`);
      
      const response = await fetch(url, options);
      console.log(`✅ Request successful (${response.status})`);
      return response;
    } catch (error) {
      console.warn(`⚠️ Attempt ${attempt} failed:`, error.message);
      
      if (attempt < maxRetries) {
        const delay = 3000; // 3 second delay before retry
        console.log(`🔄 Retrying in ${delay/1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
};

// Optional: Light health monitoring for local development
export const startHealthMonitoring = () => {
  const monitorInterval = 5 * 60 * 1000; // 5 minutes
  
  const checkHealth = async () => {
    const backends = [
      'http://localhost:8000',
      'http://localhost:5001'
    ];
    
    console.log('🏥 Backend health check...');
    
    backends.forEach(async (url) => {
      try {
        const response = await fetch(url, { method: 'GET' });
        console.log(`💚 ${url} - Status: ${response.status}`);
      } catch (error) {
        console.warn(`💔 ${url} health check failed:`, error.message);
      }
    });
  };
  
  // Check immediately
  checkHealth();
  
  // Set up monitoring interval
  const intervalId = setInterval(checkHealth, monitorInterval);
  
  return () => {
    clearInterval(intervalId);
    console.log('🛑 Stopped health monitoring');
  };
};