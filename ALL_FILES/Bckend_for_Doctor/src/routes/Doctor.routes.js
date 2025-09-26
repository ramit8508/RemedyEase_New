import { Router } from "express";
import {
  registerDoctor,
  loginDoctor,
  getDoctorProfile,
  updateDoctorProfile,
} from "../controllers/Doctor.controllers.js";

// --- CRITICAL FIX ---
// The import path below is now corrected to use the singular "middleware" folder name,
// which matches your project's actual folder structure.
import { upload } from "../middleware/multer.middleware.js";

const router = new Router();

// This route now correctly uses the multer middleware from the correct path.
router.route("/register").post(
  upload.single("avatar"), // This tells multer to look for a file field named "avatar"
  registerDoctor
);

// Other routes
router.route("/login").post(loginDoctor);
router.route("/profile").get(getDoctorProfile);
router.route("/profile/update").put(updateDoctorProfile);

export default router;
