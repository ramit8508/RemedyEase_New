import { getSocketServerUrl } from "./socketService";

// Health monitoring and keep-alive for backend services
export const startHealthMonitoring = () => {
  const userApiUrl = import.meta.env.VITE_USER_BACKEND_URL;
  const doctorApiUrl = import.meta.env.VITE_DOCTOR_BACKEND_URL;
  const socketUrl = getSocketServerUrl();

  const checkHealth = (url, name, isSocket = false) => {
    if (!url) {
      console.warn(`⚠️ ${name} service URL is not defined in environment variables.`);
      return;
    }

    const checkEndpoint = isSocket ? `${url.replace(/\/$/, '')}/socket.io/?EIO=4&transport=polling` : url;

    fetch(checkEndpoint, {
      method: 'GET',
    })
      .then(res => {
        if (res.ok || res.status === 200 || res.status === 400) {
          // Status 200 or 400 (from Socket.IO handshake without sid) indicates server is up and listening
          console.log(`💚 ${name} ${isSocket ? 'Real-time Socket.io' : 'HTTP Backend'} is responsive (${url})`);
        } else {
          console.warn(`⚠️ ${name} service responded with status: ${res.status}`);
        }
      })
      .catch(err => {
        // Log clean notice rather than crashing
        console.warn(`ℹ️ ${name} ${isSocket ? 'Real-time signaling' : 'Backend'} status check:`, err.message);
      });
  };

  console.log('🏥 Performing initial RemedyEase service health checks...');
  if (userApiUrl) checkHealth(userApiUrl, 'User');
  if (doctorApiUrl) checkHealth(doctorApiUrl, 'Doctor');
  if (socketUrl) checkHealth(socketUrl, 'Doctor', true);
  
  // Keep-alive check every 5 minutes for active deployments
  const intervalId = setInterval(() => {
    if (userApiUrl) checkHealth(userApiUrl, 'User');
    if (doctorApiUrl) checkHealth(doctorApiUrl, 'Doctor');
    if (socketUrl) checkHealth(socketUrl, 'Doctor', true);
  }, 5 * 60 * 1000);

  return () => {
    clearInterval(intervalId);
    console.log('🛑 Stopped health monitoring.');
  };
};
