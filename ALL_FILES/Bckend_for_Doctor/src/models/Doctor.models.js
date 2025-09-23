import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { registerDoctor } from "../controllers/Doctor.controllers.js";
import { upload } from "../middleware/multer.middlewares.js";

const DoctorSchema = new mongoose.Schema(
  {
    fullname: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please fill a valid email address",
      ],
      lowercase: true,
      trim: true,
    },
    specialization: {
      type: String,
      required: true,
      trim: true,
    },
    avatar: {
      type: String,
      required: true,
    },
    registrationNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    degree: {
      type: String,
      required: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      trim: true,
      minlength: [6, "password must be at least 6 characters long"],
    },
    confirmPassword: {
      type: String,
      required: true,
      trim: true,
      minlength: [6, "password must be at least 6 characters long"],
      validate: {
        validator: function (value) {
          return value === this.password;
        },
        message: "Password and Confirm Password do not match",
      },
    },
    bio: {
      type: String,
      default: "",
      trim: true,
    },
    experience: {
      type: String,
      default: "",
      trim: true,
    },
    phone: { type: String, default: "" },
    clinic: { type: String, default: "" },
    address: { type: String, default: "" },
    timings: { type: String, default: "" },
    fee: { type: String, default: "" },
    languages: { type: String, default: "" },
  },
  { timestamps: true }
);

DoctorSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  // Remove confirmPassword before saving to prevent double hashing
  this.confirmPassword = undefined;
  next();
});
DoctorSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};
DoctorSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this.id,
      email: this.email,
      fullname: this.fullname,
      degree: this.degree,
      specialization: this.specialization,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    }
  );
};
DoctorSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this.id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    }
  );
};

export const Doctor = mongoose.model("doctors", DoctorSchema);
