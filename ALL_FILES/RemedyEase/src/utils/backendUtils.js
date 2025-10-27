// This is the only function needed. It "wakes up" the backends on page load.
export const startHealthMonitoring = () => {
  // Get the full backend URLs from the environment variables.
  // On Vercel, these come from your project settings.
  // On your local machine, they come from your .env file.
  const userApiUrl = import.meta.env.VITE_USER_BACKEND_URL;
  const doctorApiUrl = import.meta.env.VITE_DOCTOR_BACKEND_URL;

  const checkHealth = (url, name) => {
    // Only run the check if the URL is defined.
    if (!url) {
      console.warn(`⚠️ ${name} backend URL is not defined in environment variables. Skipping health check.`);
      return;
    }

    // We use the FULL, absolute URL for the health check (root endpoint returns JSON status)
    fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })
      .then(res => {
        if (res.ok) {
          console.log(`💚 ${name} backend is responsive. Status: ${res.status}`);
        } else {
          console.warn(`⚠️ ${name} backend responded with status: ${res.status}`);
        }
      })
      .catch(err => console.error(`💔 ${name} backend health check failed:`, err.message));
  };

  console.log('🏥 Performing initial backend health check...');
  checkHealth(userApiUrl, 'User');
  checkHealth(doctorApiUrl, 'Doctor');
  
  // An interval is good for keeping free Render services from sleeping.
  const intervalId = setInterval(() => {
    console.log('🏃 Running periodic health check...');
    checkHealth(userApiUrl, 'User');
    checkHealth(doctorApiUrl, 'Doctor');
  }, 5 * 60 * 1000); // Checks every 5 minutes

  // This returns a "cleanup" function that React will run when the App component unmounts.
  return () => {
    clearInterval(intervalId);
    console.log('🛑 Stopped health monitoring.');
  };
};
