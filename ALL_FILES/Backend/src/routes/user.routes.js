import { Router } from "express";
import { registerUser, loginUser, getUserProfile, updateUserProfile } from "../controllers/user.controller.js";
import { upload } from "../middleware/multer.middleware.js";
import { getUserAppointments } from "../controllers/user.controller.js";

const router = new Router(); 

router.route("/register").post(
    upload.fields([{
        name : "avatar",
        maxCount:1
    }]),
    registerUser
);
router.route("/login").post(loginUser);

router.route("/profile").get(getUserProfile);
router.route("/profile/update").put(updateUserProfile);
router.route("/:userEmail/appointments").get(getUserAppointments);

export default router;