import { Router } from "express";
import { getAIRecommendation, analyzeSymptoms, interactiveSymptomFlow } from "../controllers/Ai.controller.js";

const router = Router();

router.post("/recommendation", getAIRecommendation);
router.post("/symptom-analysis", analyzeSymptoms);
router.post("/interactive", interactiveSymptomFlow);

export default router;
