import React from "react";
import { Routes, Route } from "react-router-dom";
import DoctorLogin from "./Doctor_Data_Pages/DoctorLogin";
import DoctorSignUp from "./Doctor_Data_Pages/DoctorSignUp";
import DoctorServices from "./Doctor_Data_Pages/DoctorServices";
import DoctorAbout from "./Doctor_Data_Pages/DoctorAbout";
import DoctorContact from "./Doctor_Data_Pages/DoctorContact";
import DoctorHome from "./Doctor_Data_Pages/DoctorHome";
import Navbarfordoctor from "../components/Navbarfordoctor";


function DoctorLandingPage() {
  return (
    <>
      <Navbarfordoctor />
      <Routes>
        <Route index element={<DoctorHome />} />
        <Route path="home" element={<DoctorHome />} />
        <Route path="service" element={<DoctorServices />} />
        <Route path="about" element={<DoctorAbout />} />
        <Route path="contact" element={<DoctorContact />} />
        <Route path="login" element={<DoctorLogin />} />
        <Route path="signup" element={<DoctorSignUp />} />
      </Routes>
    </>
  );
}

export default DoctorLandingPage;