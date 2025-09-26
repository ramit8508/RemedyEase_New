import { Router } from "express";
import { 
    registerDoctor, 
    loginDoctor, 
    getDoctorProfile, 
    updateDoctorProfile,
    getAllDoctors // 1. Import the new function
} from "../controllers/Doctor.controllers.js";
import { upload } from "../middleware/multer.middleware.js";

const router = new Router(); 

// Route for doctor registration
router.route("/register").post(
    upload.single("avatar"),
    registerDoctor
);

// Route for doctor login
router.route("/login").post(loginDoctor);

// Routes for getting and updating a doctor's profile
router.route("/profile").get(getDoctorProfile);
router.route("/profile/update").put(updateDoctorProfile);

// --- THIS IS THE NEW ROUTE ---
// 2. This creates the GET endpoint at /api/v1/doctors/all that your
// "Meet Doctor" page needs to fetch the list of doctors.
router.route("/all").get(getAllDoctors);

export default router;

