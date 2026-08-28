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
  getAppointmentStats,
  getPrescriptionStats
} from "../controllers/Admin.controllers.js";
import { verifyAdmin } from "../middleware/auth.middleware.js";

const router = Router();

// Doctor management (Protected by verifyAdmin)
router.get("/doctors", verifyAdmin, getAllDoctors);
router.get("/doctors/pending", verifyAdmin, getPendingDoctors);
router.put("/doctors/:doctorId/approval", verifyAdmin, updateDoctorApproval);
router.put("/doctors/:doctorId/block", verifyAdmin, toggleDoctorBlock);
router.get("/doctors/stats", verifyAdmin, getDoctorStats);

// Appointment management (Protected by verifyAdmin)
router.get("/appointments", verifyAdmin, getAllAppointments);
router.put("/appointments/:appointmentId/cancel", verifyAdmin, cancelAppointment);
router.get("/appointments/stats", verifyAdmin, getAppointmentStats);

// Prescription management (Protected by verifyAdmin)
router.get("/prescriptions", verifyAdmin, getAllPrescriptions);
router.get("/prescriptions/stats", verifyAdmin, getPrescriptionStats);

export default router;
