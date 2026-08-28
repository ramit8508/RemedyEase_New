import { Router } from "express";
import { 
  adminLogin, 
  adminLogout,
  getAllUsers, 
  toggleUserBlock,
  getAdminStats,
  changeAdminPassword
} from "../controllers/admin.controller.js";
import { verifyAdmin } from "../middleware/auth.middleware.js";

const router = Router();

// Public Admin Login
router.post("/login", adminLogin);

// Protected Admin Actions
router.post("/logout", verifyAdmin, adminLogout);
router.post("/change-password", verifyAdmin, changeAdminPassword);
router.get("/users", verifyAdmin, getAllUsers);
router.put("/users/:userId/block", verifyAdmin, toggleUserBlock);
router.get("/stats", verifyAdmin, getAdminStats);

export default router;
