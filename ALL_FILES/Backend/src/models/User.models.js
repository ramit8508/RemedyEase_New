import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const userSchema = new mongoose.Schema(
  {
    fullname: {
      type: String,
      required: true,
      trim: true,
      index: true,
      lowercase: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      match: [/\S+@\S+\.\S+/, "is not a valid email address."],
    },
    avatar: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
      minlength: [6, "password must be at least 6 characters long"],
    },
    confirmPassword: {
      type: String,
      required: true,
      minlength: [6, "password must be at least 6 characters long"],
      validate: {
        validator: function (value) {
          return value === this.password;
        },
        message: "Password and Confirm Password do not match",
      },
    },
    phone: { type: String, default: "" },
    gender: { type: String, default: "" },
    dob: { type: String, default: "" },
    address: { type: String, default: "" },
    allergies: { type: String, default: "" },
    medications: { type: String, default: "" },
    bloodGroup: { type: String, default: "" },
    emergencyContact: { type: String, default: "" },
    isBlocked: { type: Boolean, default: false },
    refreshToken: {
      type: String,
    },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  // Don't hash confirmPassword separately, just store the same hashed password
  this.confirmPassword = this.password;
  next();
});
userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};
userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this.id,
      email: this.email,
      fullname: this.fullname,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    }
  );
};
userSchema.methods.generateRefreshToken = function () {
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

export const User = mongoose.model("User", userSchema);