import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ChatMessage } from "../models/ChatMessage.models.js";
import { Appointment } from "../models/Appointments.models.js";

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
    io.to(appointment.chatRoomId).emit('receive-chat-message', {
      ...chatMessage.toObject(),
      timestamp: chatMessage.createdAt
    });
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

  // Find all appointments for this user that have chat messages
  const appointments = await Appointment.find({ userEmail }).select(
    'doctorName doctorEmail userName userEmail date time status chatRoomId _id'
  );

  if (!appointments || appointments.length === 0) {
    return res.status(200).json(new ApiResponse(200, [], "No appointments found"));
  }

  // Get chat messages for each appointment
  const conversations = [];
  
  for (const appointment of appointments) {
    const chatMessages = await ChatMessage.find({ 
      appointmentId: appointment._id 
    }).sort({ timestamp: -1 }).limit(1); // Get last message

    if (chatMessages.length > 0) {
      conversations.push({
        appointmentId: appointment._id,
        doctorName: appointment.doctorName,
        doctorEmail: appointment.doctorEmail,
        appointmentDate: appointment.date,
        appointmentTime: appointment.time,
        status: appointment.status,
        lastMessage: chatMessages[0],
        messageCount: await ChatMessage.countDocuments({ appointmentId: appointment._id })
      });
    }
  }

  // Sort by last message timestamp
  conversations.sort((a, b) => new Date(b.lastMessage.timestamp) - new Date(a.lastMessage.timestamp));

  return res.status(200).json(new ApiResponse(200, conversations, "Chat conversations fetched"));
});

// In-memory storage for patient notifications to doctors
const patientNotifications = new Map(); // key: doctorEmail, value: array of notifications

// Notify doctor when patient starts live session
export const notifyDoctor = asyncHandler(async (req, res) => {
  const { appointmentId, doctorEmail, patientName, sessionType, timestamp } = req.body;

  if (!appointmentId || !doctorEmail || !patientName || !sessionType) {
    throw new ApiError(400, "Missing required fields");
  }

  // Create notification object
  const notification = {
    id: `${appointmentId}-${Date.now()}`,
    appointmentId,
    patientName,
    sessionType, // 'chat' or 'video'
    timestamp: timestamp || new Date().toISOString(),
    read: false
  };

  // Store notification for doctor
  if (!patientNotifications.has(doctorEmail)) {
    patientNotifications.set(doctorEmail, []);
  }
  
  const doctorNotifs = patientNotifications.get(doctorEmail);
  doctorNotifs.push(notification);

  // Keep only last 50 notifications per doctor
  if (doctorNotifs.length > 50) {
    doctorNotifs.shift();
  }

  console.log(`📢 Patient ${patientName} is starting ${sessionType} session - notifying doctor ${doctorEmail}`);

  return res.status(200).json(new ApiResponse(200, notification, "Doctor notified successfully"));
});

// Get pending notifications for doctor
export const getDoctorNotifications = asyncHandler(async (req, res) => {
  const { doctorEmail } = req.params;

  if (!doctorEmail) {
    throw new ApiError(400, "Doctor email required");
  }

  const notifications = patientNotifications.get(doctorEmail) || [];
  
  // Return only unread notifications
  const unreadNotifications = notifications.filter(n => !n.read);

  return res.status(200).json(new ApiResponse(200, {
    notifications: unreadNotifications,
    count: unreadNotifications.length
  }, "Notifications fetched"));
});

// Mark notification as read
export const markNotificationRead = asyncHandler(async (req, res) => {
  const { doctorEmail, notificationId } = req.body;

  if (!doctorEmail || !notificationId) {
    throw new ApiError(400, "Missing required fields");
  }

  const notifications = patientNotifications.get(doctorEmail);
  if (notifications) {
    const notification = notifications.find(n => n.id === notificationId);
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

  patientNotifications.set(doctorEmail, []);

  return res.status(200).json(new ApiResponse(200, null, "Notifications cleared"));
});