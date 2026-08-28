import { Router } from "express";
import { 
    registerUser, 
    loginUser, 
    logoutUser,
    sendSignupOtp,
    verifySignupOtp,
    sendLoginOtp,
    verifyLoginOtp,
    getUserProfile, 
    updateUserProfile, 
    updateUserAvatar,
    getUserAppointments,
    getUserPrescriptions 
} from "../controllers/user.controller.js";
import { upload } from "../middleware/multer.middleware.js";
import { verifyUser } from "../middleware/auth.middleware.js";

const router = new Router(); 

// Public authentication routes
router.route("/register").post(upload.single("avatar"), registerUser);
router.route("/login").post(loginUser);
router.route("/logout").post(verifyUser, logoutUser);

// OTP Authentication routes
router.route("/send-signup-otp").post(sendSignupOtp);
router.route("/verify-signup-otp").post(verifySignupOtp);
router.route("/send-login-otp").post(sendLoginOtp);
router.route("/login-otp").post(verifyLoginOtp);

// Protected Patient profile routes
router.route("/profile").get(verifyUser, getUserProfile);
router.route("/profile/update").put(verifyUser, updateUserProfile);
router.route("/profile/avatar").put(verifyUser, upload.single("avatar"), updateUserAvatar);

// Protected Patient appointments & prescriptions (IDOR-protected)
router.route("/:userEmail/appointments").get(verifyUser, getUserAppointments);
router.route("/prescriptions").get(verifyUser, getUserPrescriptions);

export default router;
