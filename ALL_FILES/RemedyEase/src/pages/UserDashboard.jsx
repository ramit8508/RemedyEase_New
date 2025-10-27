import React from "react";
import UserDashBoardNav from "../components/UserDashBoardNav";
import { Routes, Route } from "react-router-dom";
import AIRecommanded from "./User_DashBoardComponents/AI-Recommanded";
import Appointments from "./User_DashBoardComponents/Appointments";
import Chat from "./User_DashBoardComponents/Chat";
import Meetdoctor from "./User_DashBoardComponents/Meetdoctor";
import Profile from "./User_DashBoardComponents/Profile";
import Home from "./User_DashBoardComponents/Home";
import MedicalStoreHome from "./User_DashBoardComponents/MedicalStoreHome";
import MedicalStoreCart from "./User_DashBoardComponents/MedicalStoreCart";
import MedicalStoreCheckout from "./User_DashBoardComponents/MedicalStoreCheckout";

export default function UserDashboard() {
  return (
    <>
      <UserDashBoardNav />
      <Routes>
         <Route index element={<Home />} />{" "}
        <Route path="AIRecommanded" element={<AIRecommanded />} />
        <Route path="Appointments" element={<Appointments />} />
        <Route path="Chat" element={<Chat />} />
        <Route path="Meetdoctor" element={<Meetdoctor />} />
        <Route path="Profile" element={<Profile />} />
        <Route path="Home" element={<Home />} />
        <Route path="medical-store" element={<MedicalStoreHome />} />
        <Route path="medical-store/cart" element={<MedicalStoreCart />} />
        <Route path="medical-store/checkout" element={<MedicalStoreCheckout />} />
      </Routes>
    </>
  );
}