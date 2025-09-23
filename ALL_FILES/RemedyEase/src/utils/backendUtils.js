// Backend health check utilities for production (using proxy)

// Check backends through proxy paths
export const wakeUpBackends = async () => {
  // Use proxy paths instead of direct URLs
  const backends = [
    '/user-api',   // Will proxy to user backend
    '/doctor-api'  // Will proxy to doctor backend
  ];
  
  console.log('🔍 Checking backends through proxy...');
  
  const healthPromises = backends.map(async (path) => {
    try {
      const response = await fetch(path, { 
        method: 'GET',
        mode: 'cors'
      });
      console.log(`✅ ${path} is ready (${response.status})`);
      return response;
    } catch (error) {
      console.error(`❌ ${path} check failed:`, error);
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

// Optional: Light health monitoring for production
export const startHealthMonitoring = () => {
  const monitorInterval = 5 * 60 * 1000; // 5 minutes
  
  const checkHealth = async () => {
    const backends = [
      '/user-api',   // Proxy to user backend
      '/doctor-api'  // Proxy to doctor backend
    ];
    
    console.log('🏥 Backend health check...');
    
    backends.forEach(async (path) => {
      try {
        const response = await fetch(path, { method: 'GET' });
        console.log(`💚 ${path} - Status: ${response.status}`);
      } catch (error) {
        console.warn(`💔 ${path} health check failed:`, error.message);
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