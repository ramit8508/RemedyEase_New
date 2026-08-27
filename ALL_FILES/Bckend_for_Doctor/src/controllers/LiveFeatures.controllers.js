import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ChatMessage } from "../models/ChatMessage.models.js";
import { Appointment } from "../models/Appointments.models.js";
import { Doctor } from "../models/Doctor.models.js";
import { Notification } from "../models/Notification.models.js";

// Send chat message
export const sendChatMessage = asyncHandler(async (req, res) => {
  const { appointmentId, message, messageType = 'text', fileUrl, fileName } = req.body;
  const { senderId, senderName, senderType } = req.body;

  if (!appointmentId || !message || !senderId || !senderName || !senderType) {
    throw new ApiError(400, "Missing required fields");
  }

  // Get appointment to verify access and get chatRoomId
  const appointment = await Appointment.findById(appointmentId);
  if (!appointment) {
    throw new ApiError(404, "Appointment not found");
  }

  // Verify user has access to this appointment
  if (senderType === 'user' && appointment.userEmail !== senderId) {
    throw new ApiError(403, "Access denied");
  }
  if (senderType === 'doctor' && appointment.doctorEmail !== senderId) {
    throw new ApiError(403, "Access denied");
  }

  // Create chat message
  const chatMessage = await ChatMessage.create({
    appointmentId,
    chatRoomId: appointment.chatRoomId,
    senderId,
    senderName,
    senderType,
    message,
    messageType,
    fileUrl,
    fileName
  });

  // Update appointment chat activity
  await Appointment.findByIdAndUpdate(appointmentId, {
    isChatActive: true,
    [`last${senderType === 'user' ? 'User' : 'Doctor'}Activity`]: new Date()
  });

  // Emit to Socket.io if available
  const io = req.app.get('io');
  if (io) {
    const msgPayload = {
      ...chatMessage.toObject(),
      timestamp: chatMessage.createdAt
    };
    io.to(appointment.chatRoomId).emit('receive-chat-message', msgPayload);
    io.to(`appointment_${appointmentId}`).emit('receive-chat-message', msgPayload);
  }

  // If patient sent message to doctor, create a notification in DB for doctor bell!
  if (senderType === 'user' && appointment.doctorEmail) {
    try {
      const doctor = await Doctor.findOne({ email: appointment.doctorEmail.toLowerCase() });
      if (doctor) {
        const notif = await Notification.create({
          recipientDoctorId: doctor._id,
          recipientDoctorEmail: appointment.doctorEmail.toLowerCase(),
          type: "NEW_MESSAGE",
          title: "New Message",
          message: `${senderName}: ${message.length > 50 ? message.substring(0, 47) + '...' : message}`,
          patientName: senderName,
          patientEmail: appointment.userEmail,
          appointmentId: appointment._id,
          date: appointment.date,
          time: appointment.time,
          isRead: false
        });

        if (io) {
          io.emit("new-notification", {
            notification: notif,
            recipientDoctorEmail: appointment.doctorEmail.toLowerCase(),
            recipientDoctorId: doctor._id,
            type: "NEW_MESSAGE",
            appointmentId: appointment._id
          });
          io.to(`doctor_${appointment.doctorEmail.toLowerCase()}`).emit("new-notification", notif);
          io.emit("unread-count-changed", { doctorEmail: appointment.doctorEmail.toLowerCase() });
        }
      }
    } catch (notifErr) {
      console.warn("[LiveFeatures] Error creating message notification:", notifErr.message);
    }
  }

  return res.status(201).json(new ApiResponse(201, chatMessage, "Message sent successfully"));
});

// Get chat history
export const getChatHistory = asyncHandler(async (req, res) => {
  const { appointmentId } = req.params;
  const { page = 1, limit = 50 } = req.query;

  const appointment = await Appointment.findById(appointmentId);
  if (!appointment) {
    throw new ApiError(404, "Appointment not found");
  }

  const messages = await ChatMessage.find({ appointmentId })
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .lean();

  // Reverse to show oldest first
  messages.reverse();

  return res.status(200).json(new ApiResponse(200, messages, "Chat history fetched"));
});

// Start video call
export const startVideoCall = asyncHandler(async (req, res) => {
  const { appointmentId } = req.params;
  const { userId, userType } = req.body;

  const appointment = await Appointment.findById(appointmentId);
  if (!appointment) {
    throw new ApiError(404, "Appointment not found");
  }

  // Check if appointment is confirmed and time is appropriate
  if (appointment.status !== 'confirmed') {
    throw new ApiError(400, "Appointment must be confirmed to start call");
  }

  // Check appointment time (allow 15 minutes before and 30 minutes after)
  const appointmentDateTime = new Date(`${appointment.date} ${appointment.time}`);
  const now = new Date();
  const timeDiff = now - appointmentDateTime;
  const fifteenMinutes = 15 * 60 * 1000;
  const thirtyMinutes = 30 * 60 * 1000;

  if (timeDiff < -fifteenMinutes || timeDiff > thirtyMinutes) {
    throw new ApiError(400, "Call can only be started 15 minutes before to 30 minutes after appointment time");
  }

  // Update appointment
  const updatedAppointment = await Appointment.findByIdAndUpdate(
    appointmentId,
    {
      isCallActive: true,
      callStartTime: new Date(),
      [`${userType}Online`]: true,
      [`last${userType === 'user' ? 'User' : 'Doctor'}Activity`]: new Date()
    },
    { new: true }
  );

  // Emit to Socket.io
  const io = req.app.get('io');
  if (io) {
    io.to(appointment.callRoomId).emit('call-started', {
      appointmentId,
      startedBy: userId,
      startedAt: new Date()
    });
  }

  return res.status(200).json(new ApiResponse(200, {
    callRoomId: appointment.callRoomId,
    appointment: updatedAppointment
  }, "Video call started"));
});

// End video call
export const endVideoCall = asyncHandler(async (req, res) => {
  const { appointmentId } = req.params;
  const { userId } = req.body;

  const appointment = await Appointment.findByIdAndUpdate(
    appointmentId,
    {
      isCallActive: false,
      callEndTime: new Date()
    },
    { new: true }
  );

  if (!appointment) {
    throw new ApiError(404, "Appointment not found");
  }

  // Emit to Socket.io
  const io = req.app.get('io');
  if (io) {
    io.to(appointment.callRoomId).emit('call-ended', {
      appointmentId,
      endedBy: userId,
      endedAt: new Date()
    });
  }

  return res.status(200).json(new ApiResponse(200, appointment, "Video call ended"));
});

// Update online status
export const updateOnlineStatus = asyncHandler(async (req, res) => {
  const { appointmentId } = req.params;
  const { userId, userType, isOnline } = req.body;

  const updateField = `${userType}Online`;
  const activityField = `last${userType === 'user' ? 'User' : 'Doctor'}Activity`;

  const appointment = await Appointment.findByIdAndUpdate(
    appointmentId,
    {
      [updateField]: isOnline,
      [activityField]: new Date()
    },
    { new: true }
  );

  if (!appointment) {
    throw new ApiError(404, "Appointment not found");
  }

  // Emit to Socket.io
  const io = req.app.get('io');
  if (io) {
    io.to(appointment.chatRoomId).emit('user-status-change', {
      userId,
      userType,
      isOnline,
      appointmentId
    });
  }

  return res.status(200).json(new ApiResponse(200, appointment, "Status updated"));
});

// Get appointment live status
export const getAppointmentLiveStatus = asyncHandler(async (req, res) => {
  const { appointmentId } = req.params;

  const appointment = await Appointment.findById(appointmentId).select(
    'callRoomId chatRoomId isCallActive isChatActive doctorOnline userOnline callStartTime callEndTime lastDoctorActivity lastUserActivity'
  );

  if (!appointment) {
    throw new ApiError(404, "Appointment not found");
  }

  return res.status(200).json(new ApiResponse(200, appointment, "Live status fetched"));
});

// Get all chat conversations for a user
export const getUserChatConversations = asyncHandler(async (req, res) => {
  const { userEmail } = req.params;

  if (!userEmail) {
    throw new ApiError(400, "User email is required");
  }

  // Find all appointments for this user
  const appointments = await Appointment.find({ userEmail })
    .sort({ createdAt: -1 })
    .lean();

  if (!appointments || appointments.length === 0) {
    return res.status(200).json(new ApiResponse(200, [], "No appointments found"));
  }

  // Extract unique doctor emails to fetch profiles in a single query
  const doctorEmails = [...new Set(appointments.map(a => a.doctorEmail).filter(Boolean))];
  const doctors = await Doctor.find({ email: { $in: doctorEmails } })
    .select('fullname email specialization avatar degree registrationNumber')
    .lean();

  const doctorMap = new Map();
  for (const doc of doctors) {
    doctorMap.set(doc.email.toLowerCase(), doc);
  }

  // Get chat messages and unread counts for each appointment
  const conversations = [];
  
  for (const appointment of appointments) {
    // Find latest message (sorting by createdAt descending)
    const latestMessages = await ChatMessage.find({ 
      appointmentId: appointment._id 
    }).sort({ createdAt: -1 }).limit(1).lean();

    const lastMessage = latestMessages[0] || null;

    // Count unread messages sent by the doctor to the user
    const unreadCount = await ChatMessage.countDocuments({
      appointmentId: appointment._id,
      senderType: 'doctor',
      isRead: false
    });

    const totalMessageCount = await ChatMessage.countDocuments({
      appointmentId: appointment._id
    });

    const docProfile = doctorMap.get(appointment.doctorEmail?.toLowerCase()) || {};

    conversations.push({
      appointmentId: appointment._id,
      chatRoomId: appointment.chatRoomId,
      callRoomId: appointment.callRoomId,
      doctorId: docProfile._id || null,
      doctorName: docProfile.fullname || appointment.doctorName,
      doctorEmail: appointment.doctorEmail,
      doctorAvatar: docProfile.avatar || null,
      doctorSpecialization: docProfile.specialization || "General Physician",
      doctorDegree: docProfile.degree || "MBBS",
      doctorOnline: Boolean(appointment.doctorOnline),
      userOnline: Boolean(appointment.userOnline),
      appointmentDate: appointment.date,
      appointmentTime: appointment.time,
      status: appointment.status,
      lastMessage: lastMessage ? {
        message: lastMessage.message,
        messageType: lastMessage.messageType,
        fileName: lastMessage.fileName,
        senderType: lastMessage.senderType,
        senderName: lastMessage.senderName,
        createdAt: lastMessage.createdAt || lastMessage.timestamp,
        isRead: lastMessage.isRead
      } : null,
      messageCount: totalMessageCount,
      unreadCount
    });
  }

  // Sort conversations: those with messages first (by latest message date), then by appointment date
  conversations.sort((a, b) => {
    const timeA = a.lastMessage?.createdAt ? new Date(a.lastMessage.createdAt).getTime() : 0;
    const timeB = b.lastMessage?.createdAt ? new Date(b.lastMessage.createdAt).getTime() : 0;
    if (timeA && timeB) return timeB - timeA;
    if (timeA) return -1;
    if (timeB) return 1;
    return new Date(b.appointmentDate).getTime() - new Date(a.appointmentDate).getTime();
  });

  return res.status(200).json(new ApiResponse(200, conversations, "Chat conversations fetched successfully"));
});

// Get all chat conversations for a doctor
export const getDoctorChatConversations = asyncHandler(async (req, res) => {
  const { doctorEmail } = req.params;

  if (!doctorEmail) {
    throw new ApiError(400, "Doctor email is required");
  }

  // Find all appointments for this doctor
  const appointments = await Appointment.find({ doctorEmail })
    .sort({ createdAt: -1 })
    .lean();

  if (!appointments || appointments.length === 0) {
    return res.status(200).json(new ApiResponse(200, [], "No appointments found"));
  }

  const conversations = [];

  for (const appointment of appointments) {
    // Find latest message
    const latestMessages = await ChatMessage.find({
      appointmentId: appointment._id
    }).sort({ createdAt: -1 }).limit(1).lean();

    const lastMessage = latestMessages[0] || null;

    // Count unread messages sent by patient to this doctor
    const unreadCount = await ChatMessage.countDocuments({
      appointmentId: appointment._id,
      senderType: 'user',
      isRead: false
    });

    const totalMessageCount = await ChatMessage.countDocuments({
      appointmentId: appointment._id
    });

    conversations.push({
      appointmentId: appointment._id,
      chatRoomId: appointment.chatRoomId,
      callRoomId: appointment.callRoomId,
      userName: appointment.userName || appointment.userEmail?.split('@')[0] || "Patient",
      userEmail: appointment.userEmail,
      doctorEmail: appointment.doctorEmail,
      doctorName: appointment.doctorName,
      doctorOnline: Boolean(appointment.doctorOnline),
      userOnline: Boolean(appointment.userOnline),
      appointmentDate: appointment.date,
      appointmentTime: appointment.time,
      status: appointment.status,
      symptoms: appointment.symptoms || "",
      lastMessage: lastMessage ? {
        message: lastMessage.message,
        messageType: lastMessage.messageType,
        fileName: lastMessage.fileName,
        senderType: lastMessage.senderType,
        senderName: lastMessage.senderName,
        createdAt: lastMessage.createdAt || lastMessage.timestamp,
        isRead: lastMessage.isRead
      } : null,
      messageCount: totalMessageCount,
      unreadCount
    });
  }

  // Sort: active chats first, then recent appointment date
  conversations.sort((a, b) => {
    const timeA = a.lastMessage?.createdAt ? new Date(a.lastMessage.createdAt).getTime() : 0;
    const timeB = b.lastMessage?.createdAt ? new Date(b.lastMessage.createdAt).getTime() : 0;
    if (timeA && timeB) return timeB - timeA;
    if (timeA) return -1;
    if (timeB) return 1;
    return new Date(b.appointmentDate).getTime() - new Date(a.appointmentDate).getTime();
  });

  return res.status(200).json(new ApiResponse(200, conversations, "Doctor chat conversations fetched successfully"));
});

// Mark messages as read
export const markMessagesAsRead = asyncHandler(async (req, res) => {
  const { appointmentId } = req.params;
  const { readerType = 'user' } = req.body;

  if (!appointmentId) {
    throw new ApiError(400, "Appointment ID is required");
  }

  const senderTypeToMark = readerType === 'user' ? 'doctor' : 'user';

  await ChatMessage.updateMany(
    { appointmentId, senderType: senderTypeToMark, isRead: false },
    { $set: { isRead: true, readAt: new Date() } }
  );

  // If doctor read messages, mark matching notifications as read
  if (readerType === 'doctor') {
    try {
      await Notification.updateMany(
        { appointmentId, type: "NEW_MESSAGE", isRead: false },
        { $set: { isRead: true } }
      );
    } catch (notifErr) {
      console.warn("[LiveFeatures] Error marking notifications as read:", notifErr.message);
    }
  }

  const io = req.app.get('io');
  if (io) {
    io.emit('unread-count-changed', { appointmentId, readerType });
  }

  return res.status(200).json(new ApiResponse(200, {}, "Messages marked as read"));
});

// In-memory storage for patient notifications to doctors
const patientNotifications = new Map(); // key: doctorEmail, value: array of notifications

// Notify doctor when patient starts live session
export const notifyDoctor = asyncHandler(async (req, res) => {
  const { appointmentId, doctorEmail, patientName, sessionType, timestamp } = req.body;

  if (!appointmentId || !doctorEmail || !patientName || !sessionType) {
    throw new ApiError(400, "Missing required fields");
  }

  // Find doctor to get _id if possible
  const doctor = await Doctor.findOne({ email: doctorEmail.toLowerCase() });

  // Store in database
  let dbNotification = null;
  if (doctor) {
    try {
      dbNotification = await Notification.create({
        recipientDoctorId: doctor._id,
        recipientDoctorEmail: doctorEmail.toLowerCase(),
        type: "LIVE_SESSION",
        title: `Live ${sessionType === "video" ? "Video Call" : "Chat"} Session`,
        message: `${patientName} started a live ${sessionType} session.`,
        patientName,
        appointmentId,
        isRead: false,
      });
    } catch (dbErr) {
      console.error("Failed to save live session notification in DB:", dbErr.message);
    }
  }

  // Create notification object for memory and response
  const notification = {
    id: dbNotification ? dbNotification._id.toString() : `${appointmentId}-${Date.now()}`,
    _id: dbNotification?._id,
    appointmentId,
    patientName,
    sessionType, // 'chat' or 'video'
    timestamp: timestamp || new Date().toISOString(),
    read: false,
    type: "LIVE_SESSION",
    title: `Live ${sessionType === "video" ? "Video Call" : "Chat"} Session`,
    message: `${patientName} started a live ${sessionType} session.`,
  };

  // Store notification in memory cache for doctor
  if (!patientNotifications.has(doctorEmail)) {
    patientNotifications.set(doctorEmail, []);
  }
  
  const doctorNotifs = patientNotifications.get(doctorEmail);
  doctorNotifs.push(notification);

  if (doctorNotifs.length > 50) {
    doctorNotifs.shift();
  }

  console.log(`📢 Patient ${patientName} is starting ${sessionType} session - notifying doctor ${doctorEmail}`);

  // Emit Socket.io event if available
  const io = req.app.get('io');
  if (io) {
    io.emit('new-notification', {
      notification,
      recipientDoctorEmail: doctorEmail.toLowerCase(),
      patientName,
      sessionType
    });
  }

  return res.status(200).json(new ApiResponse(200, notification, "Doctor notified successfully"));
});

// Get pending notifications for doctor
export const getDoctorNotifications = asyncHandler(async (req, res) => {
  const { doctorEmail } = req.params;

  if (!doctorEmail) {
    throw new ApiError(400, "Doctor email required");
  }

  // Query DB notifications for doctor
  try {
    const dbNotifs = await Notification.find({
      recipientDoctorEmail: doctorEmail.toLowerCase(),
      isRead: false,
    }).sort({ createdAt: -1 }).lean();

    return res.status(200).json(new ApiResponse(200, {
      notifications: dbNotifs,
      count: dbNotifs.length
    }, "Notifications fetched"));
  } catch (err) {
    const memoryNotifications = patientNotifications.get(doctorEmail) || [];
    const unreadNotifications = memoryNotifications.filter(n => !n.read);

    return res.status(200).json(new ApiResponse(200, {
      notifications: unreadNotifications,
      count: unreadNotifications.length
    }, "Notifications fetched from memory"));
  }
});

// Mark notification as read
export const markNotificationRead = asyncHandler(async (req, res) => {
  const { doctorEmail, notificationId } = req.body;

  if (!doctorEmail || !notificationId) {
    throw new ApiError(400, "Missing required fields");
  }

  // Mark in DB
  try {
    await Notification.findOneAndUpdate(
      { _id: notificationId, recipientDoctorEmail: doctorEmail.toLowerCase() },
      { $set: { isRead: true } }
    );
  } catch (err) {}

  const notifications = patientNotifications.get(doctorEmail);
  if (notifications) {
    const notification = notifications.find(n => n.id === notificationId || (n._id && n._id.toString() === notificationId));
    if (notification) {
      notification.read = true;
    }
  }

  return res.status(200).json(new ApiResponse(200, null, "Notification marked as read"));
});

// Clear all notifications for doctor
export const clearDoctorNotifications = asyncHandler(async (req, res) => {
  const { doctorEmail } = req.params;

  if (!doctorEmail) {
    throw new ApiError(400, "Doctor email required");
  }

  try {
    await Notification.updateMany(
      { recipientDoctorEmail: doctorEmail.toLowerCase(), isRead: false },
      { $set: { isRead: true } }
    );
  } catch (err) {}

  patientNotifications.set(doctorEmail, []);

  return res.status(200).json(new ApiResponse(200, null, "Notifications cleared"));
});