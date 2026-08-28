import mongoose from "mongoose";

const otpSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    otp: {
      type: String,
      required: true,
    },
    purpose: {
      type: String,
      enum: ["signup", "login", "reset-password"],
      default: "signup",
      required: true,
      index: true,
    },
    attempts: {
      type: Number,
      default: 0,
    },
    lastSentAt: {
      type: Date,
      default: Date.now,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 300, // Automatically deleted by MongoDB after 5 minutes (300 seconds)
    },
  },
  { timestamps: true }
);

// Compound index for fast scoped lookups
otpSchema.index({ email: 1, purpose: 1 });

export const Otp = mongoose.model("Otp", otpSchema);
