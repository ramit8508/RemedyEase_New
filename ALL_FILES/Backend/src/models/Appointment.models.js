import mongoose from "mongoose";

const AppointmentSchema = new mongoose.Schema({
  doctorEmail: { type: String, required: true },
  doctorName: { type: String, required: true },
  userEmail: { type: String, required: true },
  userName: { type: String, required: true },
  date: { type: String, required: true },
  time: { type: String, required: true },
  status: { type: String, default: "pending" },
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

export const Appointment = mongoose.model("appointments", AppointmentSchema);