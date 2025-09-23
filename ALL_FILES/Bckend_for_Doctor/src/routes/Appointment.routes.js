import { 
  bookAppointment, 
  getDoctorAppointments, 
  confirmAppointment, 
  getUserAppointments,
  getDoctorConsultationHistory,
  addTreatmentDetails,
  addSymptomsToAppointment
} from "../controllers/Appointment.controllers.js";
import { Router } from "express";
const router = new Router();

router.post("/book", bookAppointment);
router.get("/doctor/:doctorEmail", getDoctorAppointments);
router.get("/user/:userEmail", getUserAppointments);
router.put("/confirm/:appointmentId", confirmAppointment);

// New history-related routes
router.get("/doctor/:doctorEmail/history", getDoctorConsultationHistory);
router.put("/treatment/:appointmentId", addTreatmentDetails);
router.put("/symptoms/:appointmentId", addSymptomsToAppointment);

export default router;
