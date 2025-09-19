import { bookAppointment, getDoctorAppointments, confirmAppointment } from "../controllers/Appointment.controllers.js";
import { Router } from "express";
const router = new Router();

router.post("/book", bookAppointment);
router.get("/doctor/:doctorEmail", getDoctorAppointments);
router.put("/confirm/:appointmentId", confirmAppointment);

export default router;
