import { Router } from "express";
import { 
    registerDoctor, 
    loginDoctor, 
    getDoctorProfile, 
    updateDoctorProfile,
    getAllDoctors
} from "../controllers/Doctor.controllers.js";

// --- CRITICAL AND FINAL FIX ---
// This import path is now corrected to use the singular "middleware" folder name,
// which matches your project's actual folder structure.
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
router.route("/all").get(getAllDoctors);

export default router;

