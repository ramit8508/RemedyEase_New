import mongoose from "mongoose";

const AppointmentSchema = new mongoose.Schema({
  doctorEmail: { type: String, required: true },
  doctorName: { type: String, required: true },
  userEmail: { type: String, required: true },
  userName: { type: String, required: true },
  date: { type: String, required: true },
  time: { type: String, required: true },
  status: { type: String, default: "pending" }
}, { timestamps: true });

export const Appointment = mongoose.model("appointments", AppointmentSchema);