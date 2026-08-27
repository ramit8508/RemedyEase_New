import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema(
  {
    recipientDoctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "doctors",
      required: true,
      index: true,
    },
    recipientDoctorEmail: {
      type: String,
      required: true,
      index: true,
      lowercase: true,
      trim: true,
    },
    type: {
      type: String,
      required: true,
      enum: [
        "APPOINTMENT_REQUEST",
        "APPOINTMENT_CANCELLED",
        "APPOINTMENT_CONFIRMED",
        "LIVE_SESSION",
        "GENERAL",
      ],
      default: "APPOINTMENT_REQUEST",
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    patientName: {
      type: String,
      trim: true,
      default: "Patient",
    },
    patientEmail: {
      type: String,
      trim: true,
    },
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "appointments",
      index: true,
    },
    date: {
      type: String,
    },
    time: {
      type: String,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true }
);

// Indexes for high performance querying
NotificationSchema.index({ recipientDoctorId: 1, isRead: 1 });
NotificationSchema.index({ recipientDoctorEmail: 1, isRead: 1 });
NotificationSchema.index({ appointmentId: 1, type: 1 });

export const Notification = mongoose.model("notifications", NotificationSchema);
