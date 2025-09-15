import { Router } from "express";
import { getAIRecommendation } from "../controllers/ai.controller.js";

const router = new Router();

router.route("/recommendation").post(getAIRecommendation);

export default router;