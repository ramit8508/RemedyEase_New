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
  socket.on('join-appointment-room', ({ appointmentId, chatRoomId, callRoomId }) => {
    console.log(`🏠 User ${socket.userName} joining appointment room: ${appointmentId}`);
    
    // Join both chat and call rooms
    socket.join(chatRoomId);
    socket.join(callRoomId);
    socket.join(`appointment_${appointmentId}`);
    
    // Track room membership
    if (!activeRooms.has(chatRoomId)) {
      activeRooms.set(chatRoomId, new Set());
    }
    activeRooms.get(chatRoomId).add(socket.id);
    
    // Notify others in the room
    socket.to(chatRoomId).emit('user-joined-room', {
      userId: socket.userId,
      userName: socket.userName,
      userType: socket.userType
    });
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
      fromName: socket.userName,
      fromType: socket.userType,
      callRoomId
    });
  });

  socket.on('call-accepted', ({ callRoomId }) => {
    console.log(`✅ Call accepted in room ${callRoomId}`);
    socket.to(callRoomId).emit('call-accepted', {
      by: socket.userId,
      byName: socket.userName
    });
  });

  socket.on('call-rejected', ({ callRoomId }) => {
    console.log(`❌ Call rejected in room ${callRoomId}`);
    socket.to(callRoomId).emit('call-rejected', {
      by: socket.userId,
      byName: socket.userName
    });
  });

  socket.on('call-ended', ({ callRoomId }) => {
    console.log(`📴 Call ended in room ${callRoomId}`);
    socket.to(callRoomId).emit('call-ended', {
      by: socket.userId,
      byName: socket.userName
    });
  });

  // WebRTC signaling
  socket.on('webrtc-offer', ({ callRoomId, offer }) => {
    socket.to(callRoomId).emit('webrtc-offer', {
      offer,
      from: socket.userId
    });
  });

  socket.on('webrtc-answer', ({ callRoomId, answer }) => {
    socket.to(callRoomId).emit('webrtc-answer', {
      answer,
      from: socket.userId
    });
  });

  socket.on('webrtc-ice-candidate', ({ callRoomId, candidate }) => {
    socket.to(callRoomId).emit('webrtc-ice-candidate', {
      candidate,
      from: socket.userId
    });
  });

  // Disconnect handling
  socket.on('disconnect', () => {
    console.log(`🔌 User disconnected: ${socket.id}`);
    
    if (socket.userId) {
      // Remove from active users
      activeUsers.delete(socket.userId);
      
      // Clean up rooms
      for (const [roomId, socketIds] of activeRooms.entries()) {
        if (socketIds.has(socket.id)) {
          socketIds.delete(socket.id);
          if (socketIds.size === 0) {
            activeRooms.delete(roomId);
          }
        }
      }
      
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
