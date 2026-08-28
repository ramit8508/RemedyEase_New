import { Router } from "express";
import {
  createOrder,
  getUserOrders,
  getOrderById,
  cancelOrder,
} from "../controllers/Order.controllers.js";
import { verifyUser, optionalUserAuth } from "../middleware/auth.middleware.js";

const router = Router();

router.route("/").post(optionalUserAuth, createOrder);
router.route("/user/:userEmail").get(verifyUser, getUserOrders);
router.route("/:orderId").get(optionalUserAuth, getOrderById);
router.route("/:orderId/cancel").put(optionalUserAuth, cancelOrder);

export default router;
