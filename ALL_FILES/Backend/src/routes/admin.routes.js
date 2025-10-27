import { Router } from "express";
import { 
  adminLogin, 
  getAllUsers, 
  toggleUserBlock,
  getAdminStats
} from "../controllers/admin.controller.js";

const router = Router();

router.post("/login", adminLogin);
router.get("/users", getAllUsers);
router.put("/users/:userId/block", toggleUserBlock);
router.get("/stats", getAdminStats);

export default router;
