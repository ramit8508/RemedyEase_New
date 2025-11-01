import { Router } from "express";
import { 
    registerDoctor, 
    loginDoctor, 
    getDoctorProfile, 
    updateDoctorProfile,
    getAllDoctors,
    setDoctorTimeslots,
    getDoctorTimeslots
} from "../controllers/Doctor.controllers.js";


import { upload } from "../middleware/multer.middleware.js";

const router = new Router(); 


router.route("/register").post(
    upload.single("avatar"), 
    registerDoctor
);

// Other routes for the doctor
router.route("/login").post(loginDoctor);
router.route("/profile").get(getDoctorProfile);
router.route("/profile/update").put(updateDoctorProfile);
router.route("/all").get(getAllDoctors);

// Timeslot routes
router.route("/timeslots").post(setDoctorTimeslots);
router.route("/timeslots").get(getDoctorTimeslots);

export default router;

