import { Router } from "express";
import { bookAppointment } from "../controllers/Appointment.controllers.js";

const router = new Router();

router.post("/book", bookAppointment);

export default router;