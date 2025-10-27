import React, { useEffect } from "react";
import "./App.css";
import UserLandingPage from "./pages/UserLandingPage";
import LandingPage from "./pages/LandingPage";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import DoctorLandingPage from "./pages/DoctorLandingPage";
// import Login from "./pages/User_Data_Pages/Login";
// import Signup from "./pages/User_Data_Pages/Signup";
import Learn from "./pages/User_Data_Pages/Learn";
import UserDashboard from "./pages/UserDashboard";
import DoctorDashboard from "./pages/DoctorDashboard";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import { startHealthMonitoring } from './utils/backendUtils.js';
import BackendStatus from './components/BackendStatus';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  useEffect(() => {
    // Start health monitoring for local backends
    console.log('🏥 Starting RemedyEase app with local backends');
    const cleanup = startHealthMonitoring();
    
    // Cleanup when component unmounts
    return cleanup;
  }, []);

  return (
    <div className="App">
      <BackendStatus />
      <ToastContainer 
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/user/*" element={<UserLandingPage />} />
          <Route path="/doctor/*" element={<DoctorLandingPage />} />
          <Route path="/learn" element={<Learn />} />
          <Route path="/user/dashboard/*" element={<UserDashboard />} />
          <Route path="/doctor/dashboard/*" element={<DoctorDashboard />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/dashboard/*" element={<AdminDashboard />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
