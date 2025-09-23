import React from 'react'
import DoctorHome from './Doctor_DashBoardComponents/DoctorHome'
import DoctorProfile from './Doctor_DashBoardComponents/DoctorProfile'
import DoctorAppointments from './Doctor_DashBoardComponents/DoctorAppointments'
import DoctorAi from './Doctor_DashBoardComponents/DoctorAi'
import DoctorChat from './Doctor_DashBoardComponents/DoctorChat'
import DoctorHistory from './Doctor_DashBoardComponents/DoctorHistory'
import MeetUser from './Doctor_DashBoardComponents/MeetUser'
import { Routes,Route } from 'react-router-dom'
import DoctorDashBoardNav from '../components/DoctorDashBoardNav'

function DoctorDashboard() {
  return (
    <>
    <DoctorDashBoardNav />
    <Routes>
        <Route index element={<DoctorHome/>} />{" "}
        <Route path='home' element={<DoctorHome/>}/>
        <Route path='profile' element={<DoctorProfile/>}/>
        <Route path='appointments' element={<DoctorAppointments/>}/>
        <Route path='history' element={<DoctorHistory/>}/>
        <Route path='ai' element={<DoctorAi/>}/>
        <Route path='chat' element={<DoctorChat/>}/>
        <Route path='meetuser' element={<MeetUser/>}/>
    </Routes>

    </>
  )
}

export default DoctorDashboard