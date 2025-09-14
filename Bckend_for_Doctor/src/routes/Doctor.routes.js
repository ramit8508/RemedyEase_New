import { Router } from "express";
import { registerDoctor } from "../controllers/Doctor.controllers.js";
import { upload } from "../middleware/multer.middlewares.js";

const router = new Router();

router.route("/register").post(
    upload.fields([{
        name : "avatar",
        maxCount:1
    }]),
    registerDoctor
)
export default router;