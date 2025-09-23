import { Router } from "express";
import {
  sendChatMessage,
  getChatHistory,
  startVideoCall,
  endVideoCall,
  updateOnlineStatus,
  getAppointmentLiveStatus,
  getUserChatConversations
} from "../controllers/LiveFeatures.controllers.js";

const router = new Router();

// Chat routes
router.post("/chat/send", sendChatMessage);
router.get("/chat/history/:appointmentId", getChatHistory);
router.get("/chat/conversations/:userEmail", getUserChatConversations);

// Video call routes
router.post("/call/start/:appointmentId", startVideoCall);
router.post("/call/end/:appointmentId", endVideoCall);

// Status routes
router.post("/status/:appointmentId", updateOnlineStatus);
router.get("/status/:appointmentId", getAppointmentLiveStatus);

export default router;