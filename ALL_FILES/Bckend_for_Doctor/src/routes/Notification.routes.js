import { Router } from "express";
import {
  getDoctorNotifications,
  getDoctorUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "../controllers/Notification.controllers.js";
import { verifyDoctor } from "../middleware/auth.middleware.js";

const router = Router();

// Doctor must be authenticated
router.use(verifyDoctor);

// GET routes
router.route("/").get(getDoctorNotifications);
router.route("/unread-count").get(getDoctorUnreadCount);

// PATCH routes for marking read
router.route("/read-all").patch(markAllNotificationsAsRead);
router.route("/:notificationId/read").patch(markNotificationAsRead);
router.route("/:id/read").patch(markNotificationAsRead);

export default router;
