import { Router } from "express";
import { getAIRecommendation, analyzeSymptoms } from "../controllers/Ai.controller.js";

const router = Router();

router.post("/recommendation", getAIRecommendation);
router.post("/symptom-analysis", analyzeSymptoms);

export default router;
