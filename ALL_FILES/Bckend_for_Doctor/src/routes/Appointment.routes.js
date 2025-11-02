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

const router = new Router();

router.post("/book", bookAppointment);
router.get("/doctor/:doctorEmail", getDoctorAppointments);
router.get("/user/:userEmail", getUserAppointments);
router.get("/:appointmentId", getAppointmentById);
router.put("/confirm/:appointmentId", confirmAppointment);
router.put("/approve/:appointmentId", approveAppointment);
router.put("/cancel/:appointmentId", cancelAppointment);

// New history-related routes
router.get("/doctor/:doctorEmail/history", getDoctorConsultationHistory);
router.put("/treatment/:appointmentId", addTreatmentDetails);
router.put("/symptoms/:appointmentId", addSymptomsToAppointment);

// Prescription routes
router.post("/prescription/:appointmentId", upload.single("prescription"), uploadPrescription);
router.get("/prescription/:appointmentId", getPrescription);

export default router;
