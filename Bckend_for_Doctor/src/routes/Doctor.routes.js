import { Router } from "express";
import { registerDoctor } from "../controllers/Doctor.controllers.js";
import { upload } from "../middleware/multer.middlewares.js";
import { loginDoctor } from "../controllers/Doctor.controllers.js";
import { getDoctorProfile } from "../controllers/Doctor.controllers.js";
import { updateDoctorProfile } from "../controllers/Doctor.controllers.js";

const router = new Router();

router.route("/register").post(
    upload.fields([{
        name : "avatar",
        maxCount:1
    }]),
    registerDoctor
);
router.route("/login").post(loginDoctor);
router.route("/profile").get(getDoctorProfile);
router.route("/profile/update").put(updateDoctorProfile);



export default router;