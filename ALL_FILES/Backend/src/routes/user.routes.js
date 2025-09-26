import { Router } from "express";
import { registerUser, loginUser, getUserProfile, updateUserProfile, getUserAppointments } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = new Router(); 

// The route now uses upload.single("avatar") which is simpler and
// works perfectly with our memory storage setup.
router.route("/register").post(
    upload.single("avatar"),
    registerUser
);

router.route("/login").post(loginUser);

router.route("/profile").get(getUserProfile);
router.route("/profile/update").put(updateUserProfile);
router.route("/:userEmail/appointments").get(getUserAppointments);

export default router;
