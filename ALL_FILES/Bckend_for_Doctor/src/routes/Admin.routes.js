import { Router } from "express";
import {
  getAllDoctors,
  getPendingDoctors,
  updateDoctorApproval,
  toggleDoctorBlock,
  getAllAppointments,
  cancelAppointment,
  getAllPrescriptions,
  getDoctorStats,
  getAppointmentStats
} from "../controllers/Admin.controllers.js";

const router = Router();

// Doctor management
router.get("/doctors", getAllDoctors);
router.get("/doctors/pending", getPendingDoctors);
router.put("/doctors/:doctorId/approval", updateDoctorApproval);
router.put("/doctors/:doctorId/block", toggleDoctorBlock);
router.get("/doctors/stats", getDoctorStats);

// Appointment management
router.get("/appointments", getAllAppointments);
router.put("/appointments/:appointmentId/cancel", cancelAppointment);
router.get("/appointments/stats", getAppointmentStats);

// Prescription management
router.get("/prescriptions", getAllPrescriptions);

export default router;
