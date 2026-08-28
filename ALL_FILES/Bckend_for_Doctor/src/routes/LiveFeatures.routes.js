import { Router } from "express";
import {
  sendChatMessage,
  getChatHistory,
  startVideoCall,
  endVideoCall,
  updateOnlineStatus,
  getAppointmentLiveStatus,
  getUserChatConversations,
  getDoctorChatConversations,
  markMessagesAsRead,
  notifyDoctor,
  getDoctorNotifications,
  markNotificationRead,
  clearDoctorNotifications
} from "../controllers/LiveFeatures.controllers.js";
import { verifyDoctor, verifyAppointmentParticipant } from "../middleware/auth.middleware.js";

const router = new Router();

// Chat routes
router.post("/chat/send", sendChatMessage);
router.get("/chat/history/:appointmentId", verifyAppointmentParticipant, getChatHistory);
router.get("/chat/conversations/:userEmail", getUserChatConversations);
router.get("/chat/doctor-conversations/:doctorEmail", getDoctorChatConversations);
router.post("/chat/read/:appointmentId", markMessagesAsRead);

// Video call routes (Participant-protected)
router.post("/call/start/:appointmentId", verifyAppointmentParticipant, startVideoCall);
router.post("/call/end/:appointmentId", verifyAppointmentParticipant, endVideoCall);

// Status routes (Participant-protected)
router.post("/status/:appointmentId", verifyAppointmentParticipant, updateOnlineStatus);
router.get("/status/:appointmentId", verifyAppointmentParticipant, getAppointmentLiveStatus);

// Doctor notification routes
router.post("/notify-doctor", notifyDoctor);
router.get("/notifications/:doctorEmail", getDoctorNotifications);
router.post("/notifications/read", markNotificationRead);
router.delete("/notifications/:doctorEmail", clearDoctorNotifications);

export default router;