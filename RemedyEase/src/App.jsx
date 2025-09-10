import { useState } from "react";
import "./App.css";
import UserLandingPage from "./pages/UserLandingPage";
import LandingPage from "./pages/LandingPage";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import DoctorLandingPage from "./pages/DoctorLandingPage";
import Login from "./pages/User_Data_Pages/Login";
import Signup from "./pages/User_Data_Pages/Signup";
import Learn from "./pages/User_Data_Pages/Learn";


function App() {
  return (
    <>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/user/*" element={<UserLandingPage />} />
          <Route path="/doctor/*" element={<DoctorLandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/learn" element={<Learn />} />
        </Routes>
      </Router>
    </>
  );
}

export default App;
