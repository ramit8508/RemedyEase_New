// Doctor Backend Server - Port 5001
// Handles appointments, doctor management, and real-time features
import dotenv from "dotenv";
dotenv.config({ path: "./.env" });

import connectdb from "./db/index.js";
import { app } from "./app.js";
import { Server } from "socket.io";
import http from "http";

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.io for real-time chat and video calls
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// In-memory storage for active connections
// TODO: Move to Redis in production for scalability
const activeUsers = new Map(); // userId -> socketId
const activeRooms = new Map(); // roomId -> Set of socketIds
const typingUsers = new Map(); // roomId -> Set of userIds

// Main socket connection handler
io.on('connection', (socket) => {
  console.log(`� New connection established: ${socket.id}`);

  // Handle user coming online
  socket.on('user-online', ({ userId, userType, userName }) => {
    console.log(`� ${userName} (${userType}) came online`);
    activeUsers.set(userId, {
      socketId: socket.id,
      userType,
      userName,
      lastActivity: new Date()
    });
    
    // Attach user info to socket for easy access
    socket.userId = userId;
    socket.userType = userType;
    socket.userName = userName;

    // Notify other users about online status
    socket.broadcast.emit('user-status-change', {
      userId,
      userType,
      userName,
      isOnline: true
    });
  });

  // Join appointment-specific rooms for communication
  socket.on('join-appointment-room', ({ appointmentId, chatRoomId, callRoomId, userId, userName, userType }) => {
    if (userId) socket.userId = userId;
    if (userName) socket.userName = userName;
    if (userType) socket.userType = userType;

    console.log(`🏠 User ${socket.userName || socket.id} (${socket.userType || 'guest'}) joining appointment room: ${appointmentId}`);
    
    // Join rooms
    if (chatRoomId) socket.join(chatRoomId);
    if (callRoomId) socket.join(callRoomId);
    if (appointmentId) socket.join(`appointment_${appointmentId}`);
    
    // Track room membership
    const trackingRooms = [chatRoomId, callRoomId].filter(Boolean);
    trackingRooms.forEach((rId) => {
      if (!activeRooms.has(rId)) {
        activeRooms.set(rId, new Set());
      }
      activeRooms.get(rId).add(socket.id);
    });

    // Collect list of existing users currently in the callRoomId
    const existingParticipants = [];
    if (callRoomId && activeRooms.has(callRoomId)) {
      activeRooms.get(callRoomId).forEach((sId) => {
        if (sId !== socket.id) {
          const peerSocket = io.sockets.sockets.get(sId);
          existingParticipants.push({
            socketId: sId,
            userId: peerSocket?.userId || sId,
            userName: peerSocket?.userName || "Participant",
            userType: peerSocket?.userType || "user"
          });
        }
      });
    }

    // Send existing participants to the joining client
    socket.emit('existing-room-users', {
      callRoomId,
      users: existingParticipants
    });
    
    // Notify others in both chat and call rooms
    const joinPayload = {
      socketId: socket.id,
      userId: socket.userId,
      userName: socket.userName,
      userType: socket.userType,
      callRoomId
    };

    if (chatRoomId) socket.to(chatRoomId).emit('user-joined-room', joinPayload);
    if (callRoomId) socket.to(callRoomId).emit('user-joined-room', joinPayload);
  });

  // Explicit leave room handler
  socket.on('leave-appointment-room', ({ chatRoomId, callRoomId, appointmentId }) => {
    console.log(`🚪 User ${socket.userName || socket.id} leaving appointment rooms`);
    if (chatRoomId) {
      socket.leave(chatRoomId);
      if (activeRooms.has(chatRoomId)) activeRooms.get(chatRoomId).delete(socket.id);
      socket.to(chatRoomId).emit('user-left-room', { socketId: socket.id, userId: socket.userId, userName: socket.userName });
    }
    if (callRoomId) {
      socket.leave(callRoomId);
      if (activeRooms.has(callRoomId)) activeRooms.get(callRoomId).delete(socket.id);
      socket.to(callRoomId).emit('user-left-room', { socketId: socket.id, userId: socket.userId, userName: socket.userName });
    }
    if (appointmentId) {
      socket.leave(`appointment_${appointmentId}`);
    }
  });

  // Chat message handling
  socket.on('send-chat-message', (data) => {
    console.log(`💬 Chat message from ${socket.userName}: ${data.message}`);
    
    // Broadcast to room
    socket.to(data.chatRoomId).emit('receive-chat-message', {
      ...data,
      senderId: socket.userId,
      senderName: socket.userName,
      senderType: socket.userType,
      timestamp: new Date().toISOString()
    });
  });

  // Typing indicators
  socket.on('typing-start', ({ chatRoomId }) => {
    if (!typingUsers.has(chatRoomId)) {
      typingUsers.set(chatRoomId, new Set());
    }
    typingUsers.get(chatRoomId).add(socket.userId);
    
    socket.to(chatRoomId).emit('user-typing', {
      userId: socket.userId,
      userName: socket.userName,
      isTyping: true
    });
  });

  socket.on('typing-stop', ({ chatRoomId }) => {
    if (typingUsers.has(chatRoomId)) {
      typingUsers.get(chatRoomId).delete(socket.userId);
    }
    
    socket.to(chatRoomId).emit('user-typing', {
      userId: socket.userId,
      userName: socket.userName,
      isTyping: false
    });
  });

  // Video call signaling
  socket.on('call-request', ({ callRoomId, to }) => {
    console.log(`📞 Call request from ${socket.userName} to ${to}`);
    socket.to(callRoomId).emit('incoming-call', {
      from: socket.userId,
      fromSocketId: socket.id,
      fromName: socket.userName,
      fromType: socket.userType,
      callRoomId
    });
  });

  socket.on('call-accepted', ({ callRoomId }) => {
    console.log(`✅ Call accepted in room ${callRoomId}`);
    socket.to(callRoomId).emit('call-accepted', {
      by: socket.userId,
      bySocketId: socket.id,
      byName: socket.userName
    });
  });

  socket.on('call-rejected', ({ callRoomId }) => {
    console.log(`❌ Call rejected in room ${callRoomId}`);
    socket.to(callRoomId).emit('call-rejected', {
      by: socket.userId,
      bySocketId: socket.id,
      byName: socket.userName
    });
  });

  socket.on('call-ended', ({ callRoomId }) => {
    console.log(`📴 Call ended in room ${callRoomId}`);
    socket.to(callRoomId).emit('call-ended', {
      by: socket.userId,
      bySocketId: socket.id,
      byName: socket.userName
    });
  });

  // WebRTC targeted / broadcast signaling
  socket.on('webrtc-offer', ({ callRoomId, offer, targetSocketId, to }) => {
    const dest = targetSocketId || to;
    const payload = {
      offer,
      from: socket.userId,
      fromSocketId: socket.id,
      fromName: socket.userName,
      fromType: socket.userType,
      callRoomId
    };
    if (dest) {
      io.to(dest).emit('webrtc-offer', payload);
    } else if (callRoomId) {
      socket.to(callRoomId).emit('webrtc-offer', payload);
    }
  });

  socket.on('webrtc-answer', ({ callRoomId, answer, targetSocketId, to }) => {
    const dest = targetSocketId || to;
    const payload = {
      answer,
      from: socket.userId,
      fromSocketId: socket.id,
      fromName: socket.userName,
      fromType: socket.userType,
      callRoomId
    };
    if (dest) {
      io.to(dest).emit('webrtc-answer', payload);
    } else if (callRoomId) {
      socket.to(callRoomId).emit('webrtc-answer', payload);
    }
  });

  socket.on('webrtc-ice-candidate', ({ callRoomId, candidate, targetSocketId, to }) => {
    const dest = targetSocketId || to;
    const payload = {
      candidate,
      from: socket.userId,
      fromSocketId: socket.id,
      callRoomId
    };
    if (dest) {
      io.to(dest).emit('webrtc-ice-candidate', payload);
    } else if (callRoomId) {
      socket.to(callRoomId).emit('webrtc-ice-candidate', payload);
    }
  });

  // Media mute/unmute state broadcast
  socket.on('media-state-change', ({ callRoomId, isAudioMuted, isVideoMuted }) => {
    if (callRoomId) {
      socket.to(callRoomId).emit('user-media-state-change', {
        socketId: socket.id,
        userId: socket.userId,
        userName: socket.userName,
        isAudioMuted,
        isVideoMuted
      });
    }
  });

  // Disconnect handling
  socket.on('disconnect', () => {
    console.log(`🔌 User disconnected: ${socket.id} (${socket.userName || 'unknown'})`);
    
    // Clean up rooms & notify peers
    for (const [roomId, socketIds] of activeRooms.entries()) {
      if (socketIds.has(socket.id)) {
        socketIds.delete(socket.id);
        socket.to(roomId).emit('user-left-room', {
          socketId: socket.id,
          userId: socket.userId,
          userName: socket.userName
        });
        if (socketIds.size === 0) {
          activeRooms.delete(roomId);
        }
      }
    }

    if (socket.userId) {
      // Remove from active users
      activeUsers.delete(socket.userId);
      
      // Clean up typing indicators
      for (const [roomId, userIds] of typingUsers.entries()) {
        if (userIds.has(socket.userId)) {
          userIds.delete(socket.userId);
          socket.to(roomId).emit('user-typing', {
            userId: socket.userId,
            userName: socket.userName,
            isTyping: false
          });
        }
      }

      // Notify others about offline status
      socket.broadcast.emit('user-status-change', {
        userId: socket.userId,
        userType: socket.userType,
        userName: socket.userName,
        isOnline: false
      });
    }
  });
});

// Make io available to other modules
app.set('io', io);

connectdb()
  .then(() => {
    server.listen(process.env.PORT || 5001, () => {
      console.log(`🚀 Server is running on port ${process.env.PORT || 5001}`);
      console.log(`🔗 Socket.io server is ready for connections`);
    });
  })
  .catch(err => {
    console.error("Failed to connect to the database", err);
    process.exit(1);
  });
