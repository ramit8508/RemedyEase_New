import React from "react";
import Navbarforuserpage from "../components/Navbarforuserpage";
import { Routes, Route } from "react-router-dom";
import Services from "./User_Data_Pages/Services";
import About from "./User_Data_Pages/About";
import Contact from "./User_Data_Pages/Contact";
import Login from "./User_Data_Pages/Login";
import Signup from "./User_Data_Pages/Signup";
import UserHome from "./User_Data_Pages/UserHome";
import Learn from "./User_Data_Pages/Learn";

function UserLandingPage() {
  return (
    <>
      <Navbarforuserpage />
      <Routes>
        <Route index element={<UserHome />} />{" "}
        {/* This makes /user show UserHome */}
        <Route path="home" element={<UserHome />} />
        <Route path="service" element={<Services />} />
        <Route path="about" element={<About />} />
        <Route path="contact" element={<Contact />} />
        <Route path="login" element={<Login />} />
        <Route path="signup" element={<Signup />} />
        <Route path="learn" element={<Learn />} />
      </Routes>
    </>
  );
}

export default UserLandingPage;
