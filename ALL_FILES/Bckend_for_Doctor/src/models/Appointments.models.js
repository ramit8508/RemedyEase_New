import mongoose from "mongoose";

const AppointmentSchema = new mongoose.Schema({
  doctorEmail: { type: String, required: true },
  doctorName: { type: String, required: true },
  userEmail: { type: String, required: true },
  userName: { type: String, required: true },
  date: { type: String, required: true },
  time: { type: String, required: true },
  status: { type: String, default: "pending" },
  // Live Features
  callRoomId: { type: String, unique: true },
  chatRoomId: { type: String, unique: true },
  isCallActive: { type: Boolean, default: false },
  isChatActive: { type: Boolean, default: false },
  callStartTime: { type: Date },
  callEndTime: { type: Date },
  // Online Status
  doctorOnline: { type: Boolean, default: false },
  userOnline: { type: Boolean, default: false },
  lastDoctorActivity: { type: Date },
  lastUserActivity: { type: Date },
  // Treatment History
  symptoms: { type: String },
  treatment: { type: String },
  treatedBy: { type: String },
  treatmentDate: { type: Date },
  prescription: { type: String },
  followUpRequired: { type: Boolean, default: false },
  followUpDate: { type: Date },
  consultationNotes: { type: String }
}, { timestamps: true });

// Generate unique room IDs before saving
AppointmentSchema.pre('save', function(next) {
  if (this.isNew) {
    this.callRoomId = `call_${this._id}_${Date.now()}`;
    this.chatRoomId = `chat_${this._id}_${Date.now()}`;
  }
  next();
});

export const Appointment = mongoose.model("appointments", AppointmentSchema);