import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ChatMessage } from "../models/ChatMessage.models.js";
import { Appointment } from "../models/Appointments.models.js";
import { Doctor } from "../models/Doctor.models.js";
import { Notification } from "../models/Notification.models.js";

function sanitizeMessage(str, maxLen = 3000) {
  if (typeof str !== "string") return "";
  return str.replace(/<[^>]*>/g, "").trim().slice(0, maxLen);
}

// 1. Send chat message
export const sendChatMessage = asyncHandler(async (req, res) => {
  const { appointmentId, message, messageType = "text", fileUrl, fileName } = req.body;
  const { senderId, senderName, senderType } = req.body;

  if (!appointmentId || !message || !senderId || !senderName || !senderType) {
    throw new ApiError(400, "Missing required fields");
  }

  const appointment = await Appointment.findById(appointmentId);
  if (!appointment) {
    throw new ApiError(404, "Appointment not found");
  }

  const cleanSenderId = senderId.trim().toLowerCase();
  const cleanMessage = sanitizeMessage(message, 3000);

  // Verify participant identity
  if (senderType === "user" && appointment.userEmail.toLowerCase() !== cleanSenderId) {
    throw new ApiError(403, "Access denied: You are not authorized to send messages in this consultation.");
  }
  if (senderType === "doctor" && appointment.doctorEmail.toLowerCase() !== cleanSenderId) {
    throw new ApiError(403, "Access denied: You are not authorized to send messages in this consultation.");
  }

  // Create chat message
  const chatMessage = await ChatMessage.create({
    appointmentId,
    chatRoomId: appointment.chatRoomId || `chat_${appointmentId}`,
    senderId: cleanSenderId,
    senderName: sanitizeMessage(senderName, 100),
    senderType,
    message: cleanMessage,
    messageType,
    fileUrl: fileUrl ? sanitizeMessage(fileUrl, 500) : undefined,
    fileName: fileName ? sanitizeMessage(fileName, 100) : undefined,
  });

  // Update appointment chat activity
  await Appointment.findByIdAndUpdate(appointmentId, {
    isChatActive: true,
    [`last${senderType === "user" ? "User" : "Doctor"}Activity`]: new Date(),
  });

  // Emit to Socket.io
  const io = req.app.get("io");
  if (io) {
    const msgPayload = {
      ...chatMessage.toObject(),
      timestamp: chatMessage.createdAt,
    };
    io.to(appointment.chatRoomId).emit("receive-chat-message", msgPayload);
    io.to(`appointment_${appointmentId}`).emit("receive-chat-message", msgPayload);
  }

  // Create notification for the doctor if user sent message
  if (senderType === "user" && appointment.doctorEmail) {
    try {
      const doctor = await Doctor.findOne({ email: appointment.doctorEmail.toLowerCase() });
      if (doctor) {
        const notif = await Notification.create({
          recipientDoctorId: doctor._id,
          recipientDoctorEmail: appointment.doctorEmail.toLowerCase(),
          type: "NEW_MESSAGE",
          title: "New Message",
          message: `${senderName}: ${cleanMessage.length > 50 ? cleanMessage.substring(0, 47) + "..." : cleanMessage}`,
          patientName: senderName,
          patientEmail: appointment.userEmail,
          appointmentId: appointment._id,
          date: appointment.date,
          time: appointment.time,
          isRead: false,
        });

        if (io) {
          io.emit("new-notification", {
            notification: notif,
            recipientDoctorEmail: appointment.doctorEmail.toLowerCase(),
            recipientDoctorId: doctor._id,
            type: "NEW_MESSAGE",
            appointmentId: appointment._id,
          });
          io.to(`doctor_${appointment.doctorEmail.toLowerCase()}`).emit("new-notification", notif);
        }
      }
    } catch (notifErr) {
      console.warn("[LiveFeatures] Error creating message notification:", notifErr.message);
    }
  }

  return res.status(201).json(new ApiResponse(201, chatMessage, "Message sent successfully"));
});

// 2. Get chat history (Protected by verifyAppointmentParticipant)
export const getChatHistory = asyncHandler(async (req, res) => {
  const { appointmentId } = req.params;
  const { page = 1, limit = 50 } = req.query;

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));

  const messages = await ChatMessage.find({ appointmentId })
    .sort({ createdAt: -1 })
    .limit(limitNum)
    .skip((pageNum - 1) * limitNum)
    .lean();

  messages.reverse();
  return res.status(200).json(new ApiResponse(200, messages, "Chat history fetched"));
});

// 3. Start video call
export const startVideoCall = asyncHandler(async (req, res) => {
  const { appointmentId } = req.params;
  const { userType } = req.body;

  const appointment = req.appointment || (await Appointment.findById(appointmentId));
  if (!appointment) {
    throw new ApiError(404, "Appointment not found");
  }

  if (appointment.status !== "confirmed" && appointment.status !== "approved") {
    throw new ApiError(400, "Appointment must be confirmed to start consultation call.");
  }

  const updatedAppointment = await Appointment.findByIdAndUpdate(
    appointmentId,
    {
      isCallActive: true,
      callStartTime: new Date(),
      [`${userType === "doctor" ? "doctor" : "user"}Online`]: true,
      [`last${userType === "doctor" ? "Doctor" : "User"}Activity`]: new Date(),
    },
    { new: true }
  );

  const io = req.app.get("io");
  if (io) {
    io.to(`appointment_${appointmentId}`).emit("video-call-started", {
      appointmentId,
      userType,
      startTime: updatedAppointment.callStartTime,
    });
  }

  return res.status(200).json(new ApiResponse(200, updatedAppointment, "Video call started"));
});

// 4. End video call
export const endVideoCall = asyncHandler(async (req, res) => {
  const { appointmentId } = req.params;
  const { duration } = req.body;

  const appointment = await Appointment.findByIdAndUpdate(
    appointmentId,
    {
      isCallActive: false,
      callEndTime: new Date(),
      callDuration: duration || 0,
      userOnline: false,
      doctorOnline: false,
    },
    { new: true }
  );

  const io = req.app.get("io");
  if (io) {
    io.to(`appointment_${appointmentId}`).emit("video-call-ended", {
      appointmentId,
      duration,
    });
  }

  return res.status(200).json(new ApiResponse(200, appointment, "Video call ended"));
});

// 5. Update online status
export const updateOnlineStatus = asyncHandler(async (req, res) => {
  const { appointmentId } = req.params;
  const { userType, isOnline } = req.body;

  const updatedAppointment = await Appointment.findByIdAndUpdate(
    appointmentId,
    {
      [`${userType === "doctor" ? "doctor" : "user"}Online`]: Boolean(isOnline),
      [`last${userType === "doctor" ? "Doctor" : "User"}Activity`]: new Date(),
    },
    { new: true }
  );

  const io = req.app.get("io");
  if (io) {
    io.to(`appointment_${appointmentId}`).emit("user-status-changed", {
      appointmentId,
      userType,
      isOnline: Boolean(isOnline),
    });
  }

  return res.status(200).json(new ApiResponse(200, updatedAppointment, "Status updated"));
});

// 6. Get appointment live status
export const getAppointmentLiveStatus = asyncHandler(async (req, res) => {
  const appointment = req.appointment;
  if (!appointment) {
    throw new ApiError(404, "Appointment not found");
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        isChatActive: appointment.isChatActive,
        isCallActive: appointment.isCallActive,
        userOnline: appointment.userOnline,
        doctorOnline: appointment.doctorOnline,
        lastUserActivity: appointment.lastUserActivity,
        lastDoctorActivity: appointment.lastDoctorActivity,
        callStartTime: appointment.callStartTime,
      },
      "Live status fetched"
    )
  );
});

// 7. Get user chat conversations
export const getUserChatConversations = asyncHandler(async (req, res) => {
  const { userEmail } = req.params;
  const cleanEmail = userEmail?.trim()?.toLowerCase();

  const appointments = await Appointment.find({
    userEmail: cleanEmail,
    status: { $in: ["confirmed", "approved", "completed", "pending"] },
  }).sort({ updatedAt: -1 });

  const conversations = await Promise.all(
    appointments.map(async (appointment) => {
      const lastMessage = await ChatMessage.findOne({ appointmentId: appointment._id })
        .sort({ createdAt: -1 })
        .lean();

      return {
        appointmentId: appointment._id,
        chatRoomId: appointment.chatRoomId,
        callRoomId: appointment.callRoomId,
        doctorName: appointment.doctorName,
        doctorEmail: appointment.doctorEmail,
        date: appointment.date,
        time: appointment.time,
        status: appointment.status,
        isOnline: appointment.doctorOnline,
        lastMessage: lastMessage?.message || "No messages yet",
        lastMessageTime: lastMessage?.createdAt || appointment.createdAt,
        unreadCount: 0,
      };
    })
  );

  return res.status(200).json(new ApiResponse(200, conversations, "User conversations fetched"));
});

// 8. Get doctor chat conversations
export const getDoctorChatConversations = asyncHandler(async (req, res) => {
  const { doctorEmail } = req.params;
  const cleanEmail = (req.doctor?.email || doctorEmail)?.trim()?.toLowerCase();

  const appointments = await Appointment.find({
    doctorEmail: cleanEmail,
    status: { $in: ["confirmed", "approved", "completed", "pending"] },
  }).sort({ updatedAt: -1 });

  const conversations = await Promise.all(
    appointments.map(async (appointment) => {
      const lastMessage = await ChatMessage.findOne({ appointmentId: appointment._id })
        .sort({ createdAt: -1 })
        .lean();

      return {
        appointmentId: appointment._id,
        chatRoomId: appointment.chatRoomId,
        callRoomId: appointment.callRoomId,
        userName: appointment.userName,
        userEmail: appointment.userEmail,
        date: appointment.date,
        time: appointment.time,
        status: appointment.status,
        isOnline: appointment.userOnline,
        lastMessage: lastMessage?.message || "No messages yet",
        lastMessageTime: lastMessage?.createdAt || appointment.createdAt,
        unreadCount: 0,
      };
    })
  );

  return res.status(200).json(new ApiResponse(200, conversations, "Doctor conversations fetched"));
});

// 9. Mark messages as read
export const markMessagesAsRead = asyncHandler(async (req, res) => {
  const { appointmentId } = req.params;
  const { userType } = req.body;

  const oppositeType = userType === "doctor" ? "user" : "doctor";
  await ChatMessage.updateMany(
    { appointmentId, senderType: oppositeType, isRead: false },
    { isRead: true }
  );

  return res.status(200).json(new ApiResponse(200, {}, "Messages marked as read"));
});

// 10. Notify doctor (when patient starts session)
export const notifyDoctor = asyncHandler(async (req, res) => {
  const { appointmentId, doctorEmail, patientName } = req.body;
  const cleanDocEmail = doctorEmail?.trim()?.toLowerCase();

  const io = req.app.get("io");
  if (io && cleanDocEmail) {
    io.to(`doctor_${cleanDocEmail}`).emit("patient-joined-session", {
      appointmentId,
      patientName,
      timestamp: new Date().toISOString(),
    });
  }

  return res.status(200).json(new ApiResponse(200, {}, "Doctor notified"));
});

// 11. Get Doctor Notifications
export const getDoctorNotifications = asyncHandler(async (req, res) => {
  const cleanDocEmail = (req.doctor?.email || req.params.doctorEmail)?.trim()?.toLowerCase();

  const notifications = await Notification.find({
    recipientDoctorEmail: cleanDocEmail,
  }).sort({ createdAt: -1 }).limit(50);

  return res.status(200).json(new ApiResponse(200, notifications, "Notifications fetched"));
});

// 12. Mark Notification Read
export const markNotificationRead = asyncHandler(async (req, res) => {
  const { notificationId, doctorEmail } = req.body;

  if (notificationId) {
    await Notification.findByIdAndUpdate(notificationId, { isRead: true });
  } else if (doctorEmail) {
    await Notification.updateMany({ recipientDoctorEmail: doctorEmail.trim().toLowerCase() }, { isRead: true });
  }

  return res.status(200).json(new ApiResponse(200, {}, "Notification marked as read"));
});

// 13. Clear Doctor Notifications
export const clearDoctorNotifications = asyncHandler(async (req, res) => {
  const cleanDocEmail = (req.doctor?.email || req.params.doctorEmail)?.trim()?.toLowerCase();

  await Notification.deleteMany({ recipientDoctorEmail: cleanDocEmail });
  return res.status(200).json(new ApiResponse(200, {}, "Notifications cleared"));
});