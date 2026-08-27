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
import { verifyDoctor } from "../middleware/auth.middleware.js";

const router = new Router();

// Public / User booking
router.post("/book", bookAppointment);
router.get("/user/:userEmail", getUserAppointments);

// Doctor appointments retrieval
router.get("/doctor/:doctorEmail", getDoctorAppointments);
router.get("/doctor/:doctorEmail/history", verifyDoctor, getDoctorConsultationHistory);

// Confirmation & Approval routes (supporting both /confirm/:id and /:id/confirm)
router.put("/confirm/:appointmentId", verifyDoctor, confirmAppointment);
router.put("/:appointmentId/confirm", verifyDoctor, confirmAppointment);
router.put("/approve/:appointmentId", verifyDoctor, approveAppointment);
router.put("/:appointmentId/approve", verifyDoctor, approveAppointment);

// Cancellation routes (supporting both /cancel/:id and /:id/cancel)
router.put("/cancel/:appointmentId", cancelAppointment);
router.put("/:appointmentId/cancel", cancelAppointment);

// Treatment & Prescription routes
router.put("/treatment/:appointmentId", verifyDoctor, addTreatmentDetails);
router.put("/symptoms/:appointmentId", addSymptomsToAppointment);
// Prescription routes
router.post("/prescription/:appointmentId", upload.single("prescription"), uploadPrescription);
router.get("/prescription/:appointmentId", getPrescription);

// Get single appointment by ID
router.get("/:appointmentId", getAppointmentById);

export default router;
