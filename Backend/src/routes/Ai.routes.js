import { Router } from "express";
import { getAIRecommendation } from "../controllers/ai.controller.js";

const router = Router();

router.post("/recommendation", getAIRecommendation);

export default router;
