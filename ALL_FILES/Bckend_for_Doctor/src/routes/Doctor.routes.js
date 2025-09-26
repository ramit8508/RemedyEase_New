import { Router } from "express";
import { 
    registerDoctor, 
    loginDoctor, 
    getDoctorProfile, 
    updateDoctorProfile 
} from "../controllers/Doctor.controllers.js";

// --- CRITICAL FIX ---
// This import path is now corrected to match your project's folder structure.
// It correctly points to the `middleware` (singular) folder.
import { upload } from "../middleware/multer.middleware.js";

const router = new Router(); 

// This route correctly uses the multer middleware to handle the avatar upload.
router.route("/register").post(
    upload.single("avatar"), // This tells multer to look for a single file field named "avatar"
    registerDoctor
);

// Other routes for the doctor
router.route("/login").post(loginDoctor);
router.route("/profile").get(getDoctorProfile);
router.route("/profile/update").put(updateDoctorProfile);

export default router;