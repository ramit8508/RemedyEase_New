import { Router } from "express";
import { getAIRecommendation } from "../controllers/Ai.controller.js";

const router = Router();

router.post("/recommendation", getAIRecommendation);

export default router;
