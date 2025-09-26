import { Router } from "express";
import { 
    registerDoctor, 
    loginDoctor, 
    getDoctorProfile, 
    updateDoctorProfile 
} from "../controllers/Doctor.controllers.js";

// --- CRITICAL: VERIFY THIS PATH ---
// This import path must exactly match the location and name of your multer file.
// Check if your folder is named "middleware" (singular) or "middlewares" (plural).
// This code assumes it is "middlewares".
import { upload } from "../middlewares/multer.middleware.js";

const router = new Router(); 

// This route now correctly uses the multer middleware to handle the avatar upload.
router.route("/register").post(
    upload.single("avatar"), // This tells multer to look for a file field named "avatar"
    registerDoctor
);

// Other routes
router.route("/login").post(loginDoctor);
router.route("/profile").get(getDoctorProfile);
router.route("/profile/update").put(updateDoctorProfile);

export default router;
