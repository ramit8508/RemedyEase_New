import { Notification } from "../models/Notification.models.js";
import { Doctor } from "../models/Doctor.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Helper to resolve doctor query
const getDoctorFilter = (doctor) => {
  const filters = [];
  if (doctor._id) filters.push({ recipientDoctorId: doctor._id });
  if (doctor.email) filters.push({ recipientDoctorEmail: doctor.email.toLowerCase() });
  return filters.length === 1 ? filters[0] : { $or: filters };
};

// 1. Get all notifications for authenticated doctor
export const getDoctorNotifications = asyncHandler(async (req, res) => {
  const doctor = req.doctor;
  if (!doctor) {
    throw new ApiError(401, "Unauthorized: Doctor profile not identified");
  }

  const filter = getDoctorFilter(doctor);
  const notifications = await Notification.find(filter)
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        notifications,
        count: notifications.length,
        unreadCount,
      },
      "Doctor notifications fetched successfully"
    )
  );
});

// 2. Get unread notification count for doctor
export const getDoctorUnreadCount = asyncHandler(async (req, res) => {
  const doctor = req.doctor;
  if (!doctor) {
    throw new ApiError(401, "Unauthorized: Doctor profile not identified");
  }

  const filter = {
    ...getDoctorFilter(doctor),
    isRead: false,
  };

  const count = await Notification.countDocuments(filter);

  return res.status(200).json(
    new ApiResponse(
      200,
      { count },
      "Doctor unread notifications count fetched successfully"
    )
  );
});

// 3. Mark a specific notification as READ
export const markNotificationAsRead = asyncHandler(async (req, res) => {
  const doctor = req.doctor;
  const { notificationId, id } = req.params;
  const targetId = notificationId || id || req.body?.notificationId;

  if (!targetId) {
    throw new ApiError(400, "Notification ID is required");
  }

  const filter = {
    _id: targetId,
    ...getDoctorFilter(doctor),
  };

  const notification = await Notification.findOneAndUpdate(
    filter,
    { $set: { isRead: true } },
    { new: true }
  );

  if (!notification) {
    throw new ApiError(404, "Notification not found or access denied");
  }

  return res.status(200).json(
    new ApiResponse(200, notification, "Notification marked as read")
  );
});

// 4. Mark ALL notifications as READ for authenticated doctor
export const markAllNotificationsAsRead = asyncHandler(async (req, res) => {
  const doctor = req.doctor;
  if (!doctor) {
    throw new ApiError(401, "Unauthorized: Doctor profile not identified");
  }

  const filter = {
    ...getDoctorFilter(doctor),
    isRead: false,
  };

  const result = await Notification.updateMany(filter, {
    $set: { isRead: true },
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      { modifiedCount: result.modifiedCount },
      "All doctor notifications marked as read"
    )
  );
});

// 5. Create a new notification (internal helper or API)
export const createDoctorNotification = async ({
  recipientDoctorId,
  recipientDoctorEmail,
  type = "APPOINTMENT_REQUEST",
  title,
  message,
  patientName,
  patientEmail,
  appointmentId,
  date,
  time,
}) => {
  try {
    // Prevent duplicate notifications for same appointment and type
    if (appointmentId) {
      const existing = await Notification.findOne({
        appointmentId,
        type,
      });
      if (existing) {
        console.log(`ℹ️ Notification for appointment ${appointmentId} already exists. Skipping duplicate.`);
        return existing;
      }
    }

    const notif = await Notification.create({
      recipientDoctorId,
      recipientDoctorEmail: recipientDoctorEmail.toLowerCase(),
      type,
      title: title || "New Appointment Request",
      message,
      patientName: patientName || "Patient",
      patientEmail,
      appointmentId,
      date,
      time,
      isRead: false,
    });

    console.log(`🔔 Notification created for Dr. ${recipientDoctorEmail} (${notif._id})`);
    return notif;
  } catch (err) {
    console.error("❌ Failed to create doctor notification:", err.message);
    return null;
  }
};
