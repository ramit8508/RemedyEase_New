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
import { verifyDoctor, optionalDoctorOrUserAuth } from "../middleware/auth.middleware.js";

const router = new Router(); 

// Public Registration & Login
router.route("/register").post(upload.single("avatar"), registerDoctor);
router.route("/login").post(loginDoctor);
router.route("/all").get(getAllDoctors);

// Doctor Profile & Timeslots (Protected by verifyDoctor)
router.route("/profile").get(optionalDoctorOrUserAuth, getDoctorProfile);
router.route("/profile/update").put(verifyDoctor, updateDoctorProfile);
router.route("/timeslots").post(verifyDoctor, setDoctorTimeslots);
router.route("/timeslots").get(getDoctorTimeslots);

export default router;
