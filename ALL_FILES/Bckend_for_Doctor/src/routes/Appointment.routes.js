import { 
  bookAppointment, 
  getDoctorAppointments, 
  confirmAppointment,
  approveAppointment,
  cancelAppointment,
  getUserAppointments,
  getDoctorConsultationHistory,
  addTreatmentDetails,
  addSymptomsToAppointment,
  getAppointmentById,
  uploadPrescription,
  getPrescription
} from "../controllers/Appointment.controllers.js";
import { Router } from "express";
import { upload } from "../middleware/multer.middleware.js";
import { verifyDoctor, verifyAppointmentParticipant, optionalDoctorOrUserAuth } from "../middleware/auth.middleware.js";

const router = new Router();

// Public / Patient booking & user listing
router.post("/book", optionalDoctorOrUserAuth, bookAppointment);
router.get("/user/:userEmail", getUserAppointments);

// Doctor appointments retrieval (Protected by verifyDoctor)
router.get("/doctor/:doctorEmail", verifyDoctor, getDoctorAppointments);
router.get("/doctor/:doctorEmail/history", verifyDoctor, getDoctorConsultationHistory);

// Confirmation & Approval routes (Protected by verifyDoctor)
router.put("/confirm/:appointmentId", verifyDoctor, confirmAppointment);
router.put("/:appointmentId/confirm", verifyDoctor, confirmAppointment);
router.put("/approve/:appointmentId", verifyDoctor, approveAppointment);
router.put("/:appointmentId/approve", verifyDoctor, approveAppointment);

// Cancellation routes (Doctor or Patient)
router.put("/cancel/:appointmentId", cancelAppointment);
router.put("/:appointmentId/cancel", cancelAppointment);

// Treatment & Prescription routes (Doctor-protected)
router.put("/treatment/:appointmentId", verifyDoctor, addTreatmentDetails);
router.put("/symptoms/:appointmentId", addSymptomsToAppointment);
router.post("/prescription/:appointmentId", verifyDoctor, upload.single("prescription"), uploadPrescription);
router.get("/prescription/:appointmentId", verifyAppointmentParticipant, getPrescription);

// Get single appointment by ID (Participant-protected)
router.get("/:appointmentId", verifyAppointmentParticipant, getAppointmentById);

export default router;
