import mongoose from "mongoose";

const ChatMessageSchema = new mongoose.Schema({
  appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'appointments', required: true },
  chatRoomId: { type: String, required: true },
  senderId: { type: String, required: true }, // user email or doctor email
  senderName: { type: String, required: true },
  senderType: { type: String, enum: ['user', 'doctor'], required: true },
  message: { type: String, required: true },
  messageType: { type: String, enum: ['text', 'file', 'prescription'], default: 'text' },
  fileUrl: { type: String },
  fileName: { type: String },
  isRead: { type: Boolean, default: false },
  readAt: { type: Date }
}, { timestamps: true });

// Index for fast queries
ChatMessageSchema.index({ chatRoomId: 1, createdAt: 1 });
ChatMessageSchema.index({ appointmentId: 1 });

export const ChatMessage = mongoose.model("chatMessages", ChatMessageSchema);