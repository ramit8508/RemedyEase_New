// File: src/routes/Ai.routes.js
console.log("[SERVER LOG] 2. Ai.routes.js is being imported.");
import { Router } from "express";

import { getAIDoctorSuggestion } from "../controllers/Ai.controller.js";

const router = Router(); // Corrected: No "new" needed

router.post("/doctorsuggestions", getAIDoctorSuggestion);

export default router;