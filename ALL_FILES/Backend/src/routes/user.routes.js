import { Router } from "express";
import { 
    registerUser, 
    loginUser, 
    getUserProfile, 
    updateUserProfile, 
    getUserAppointments,
    getUserPrescriptions 
} from "../controllers/user.controller.js";
// This path is now corrected to use the singular "middleware" folder name.
import { upload } from "../middleware/multer.middleware.js";

const router = new Router(); 

router.route("/register").post(
    upload.single("avatar"), // Use .single() for one file
    registerUser
);

router.route("/login").post(loginUser);
router.route("/profile").get(getUserProfile);
router.route("/profile/update").put(updateUserProfile);
router.route("/:userEmail/appointments").get(getUserAppointments);
router.route("/prescriptions").get(getUserPrescriptions);

export default router;

