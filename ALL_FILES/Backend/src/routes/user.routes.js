import { Router } from "express";
import { 
    registerUser, 
    loginUser, 
    getUserProfile, 
    updateUserProfile, 
    getUserAppointments 
} from "../controllers/user.controller.js";
// This is the line that was fixed. The folder is "middlewares" (plural).
import { upload } from "../middlewares/multer.middleware.js";

const router = new Router(); 

router.route("/register").post(
    upload.single("avatar"), // Use .single() for one file
    registerUser
);

router.route("/login").post(loginUser);
router.route("/profile").get(getUserProfile);
router.route("/profile/update").put(updateUserProfile);
router.route("/:userEmail/appointments").get(getUserAppointments);

export default router;

