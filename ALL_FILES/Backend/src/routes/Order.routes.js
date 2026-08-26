import { Router } from "express";
import {
  createOrder,
  getUserOrders,
  getOrderById,
  cancelOrder,
} from "../controllers/Order.controllers.js";

const router = Router();

router.route("/").post(createOrder);
router.route("/user/:userEmail").get(getUserOrders);
router.route("/:orderId").get(getOrderById);
router.route("/:orderId/cancel").put(cancelOrder);

export default router;
