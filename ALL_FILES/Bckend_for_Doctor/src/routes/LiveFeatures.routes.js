import { Router } from "express";
import {
  sendChatMessage,
  getChatHistory,
  startVideoCall,
  endVideoCall,
  updateOnlineStatus,
  getAppointmentLiveStatus,
  getUserChatConversations,
  notifyDoctor,
  getDoctorNotifications,
  markNotificationRead,
  clearDoctorNotifications
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

// Doctor notification routes (when patient starts session)
router.post("/notify-doctor", notifyDoctor);
router.get("/notifications/:doctorEmail", getDoctorNotifications);
router.post("/notifications/read", markNotificationRead);
router.delete("/notifications/:doctorEmail", clearDoctorNotifications);

export default router;