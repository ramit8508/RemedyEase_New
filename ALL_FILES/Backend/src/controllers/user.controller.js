import crypto from "crypto";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/User.models.js";
import { Otp } from "../models/Otp.models.js";
import { uploadOnCloudinary } from "../utils/Cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { sendSignupOtpEmail, sendLoginOtpEmail } from "../utils/emailService.js";
import fetch from "node-fetch";

// Sanitize string to prevent basic XSS
function sanitizeInput(str, maxLen = 500) {
  if (typeof str !== "string") return "";
  return str.replace(/<[^>]*>/g, "").trim().slice(0, maxLen);
}

// Generate cryptographically secure 6-digit OTP
function generateSecureOtp() {
  return crypto.randomInt(100000, 1000000).toString();
}

// Standard cookie options helper
function getAuthCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };
}

const registerUser = asyncHandler(async (req, res) => {
  const { fullname, email, password, confirmPassword } = req.body;

  // 1. Validate required fields
  if (!fullname || !email || !password || !confirmPassword) {
    throw new ApiError(400, "All fields are required");
  }

  const cleanEmail = email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(cleanEmail)) {
    throw new ApiError(400, "Please provide a valid email address");
  }

  if (password.length < 6) {
    throw new ApiError(400, "Password must be at least 6 characters long");
  }

  if (password !== confirmPassword) {
    throw new ApiError(400, "Password and Confirm Password do not match");
  }

  if (!req.file || !req.file.buffer) {
    throw new ApiError(400, "Avatar image file is required");
  }

  // 2. Check if user already exists
  const existedUser = await User.findOne({ email: cleanEmail });
  if (existedUser) {
    throw new ApiError(409, "An account with this email address already exists");
  }

  // 3. Upload avatar
  const cloudinaryResponse = await uploadOnCloudinary(req.file.buffer);
  if (!cloudinaryResponse || !cloudinaryResponse.secure_url) {
    throw new ApiError(500, "Avatar upload failed. Please try again.");
  }
  const avatarUrl = cloudinaryResponse.secure_url;

  // 4. Create the user
  const user = await User.create({
    fullname: sanitizeInput(fullname, 100),
    email: cleanEmail,
    password,
    confirmPassword,
    avatar: avatarUrl,
  });

  const createdUser = await User.findById(user._id).select("-password -confirmPassword -refreshToken");
  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while creating your account");
  }

  return res.status(201).json(new ApiResponse(201, createdUser, "User registered successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  const cleanEmail = email.trim().toLowerCase();
  const user = await User.findOne({ email: cleanEmail });

  if (!user) {
    throw new ApiError(401, "Invalid email or password");
  }

  if (user.isBlocked) {
    throw new ApiError(403, "Your account has been suspended. Please contact support.");
  }

  const isMatch = await user.isPasswordCorrect(password);
  if (!isMatch) {
    throw new ApiError(401, "Invalid email or password");
  }

  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();

  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  const loggedInUser = await User.findById(user._id).select("-password -confirmPassword -refreshToken");

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("userAccessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "Login successful"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  if (req.user?._id) {
    await User.findByIdAndUpdate(req.user._id, { $unset: { refreshToken: 1 } });
  }

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  };

  return res
    .status(200)
    .clearCookie("accessToken", cookieOptions)
    .clearCookie("userAccessToken", cookieOptions)
    .clearCookie("refreshToken", cookieOptions)
    .json(new ApiResponse(200, {}, "Logged out successfully"));
});

const getUserProfile = asyncHandler(async (req, res) => {
  // Enforce server-verified user identity
  const user = req.user;
  if (!user) {
    throw new ApiError(401, "Authentication required");
  }
  return res.status(200).json(new ApiResponse(200, user, "User profile fetched successfully"));
});

// Allowed profile fields
const ALLOWED_PROFILE_FIELDS = [
  "fullname",
  "phone",
  "gender",
  "dob",
  "address",
  "bloodGroup",
  "emergencyContact",
  "allergies",
  "medications",
];

const updateUserProfile = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const updateFields = {};
  for (const field of ALLOWED_PROFILE_FIELDS) {
    if (req.body[field] !== undefined) {
      updateFields[field] = sanitizeInput(String(req.body[field]), 300);
    }
  }

  if (Object.keys(updateFields).length === 0) {
    throw new ApiError(400, "No valid fields provided for update");
  }

  const updatedUser = await User.findByIdAndUpdate(userId, updateFields, { new: true }).select(
    "-password -confirmPassword -refreshToken"
  );

  if (!updatedUser) {
    throw new ApiError(404, "User profile not found");
  }

  return res.status(200).json(new ApiResponse(200, updatedUser, "Profile updated successfully"));
});

const updateUserAvatar = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  if (!req.file || !req.file.buffer) {
    throw new ApiError(400, "Avatar file is required");
  }

  const cloudinaryResponse = await uploadOnCloudinary(req.file.buffer);
  if (!cloudinaryResponse || !cloudinaryResponse.secure_url) {
    throw new ApiError(500, "Avatar upload failed. Please try again.");
  }

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { avatar: cloudinaryResponse.secure_url },
    { new: true }
  ).select("-password -confirmPassword -refreshToken");

  return res.status(200).json(new ApiResponse(200, updatedUser, "Avatar updated successfully"));
});

const getUserAppointments = asyncHandler(async (req, res) => {
  const requestedEmail = req.params.userEmail?.toLowerCase()?.trim();
  const authenticatedEmail = req.user.email.toLowerCase();

  // IDOR Protection: User can only query their own appointments
  if (requestedEmail && requestedEmail !== authenticatedEmail) {
    throw new ApiError(403, "Access denied: You can only view your own appointments.");
  }

  const doctorBackendUrl = process.env.DOCTOR_BACKEND_URL;
  if (!doctorBackendUrl) {
    throw new ApiError(500, "Doctor service URL is not configured");
  }

  try {
    const authHeader = req.header("Authorization");
    const response = await fetch(`${doctorBackendUrl}/api/v1/appointments/user/${authenticatedEmail}`, {
      headers: authHeader ? { Authorization: authHeader } : {},
    });
    const appointmentsData = await response.json();
    if (response.ok && appointmentsData.data) {
      return res.status(200).json(new ApiResponse(200, appointmentsData.data, "User appointments fetched"));
    }
    return res.status(200).json(new ApiResponse(200, [], "No appointments found"));
  } catch (error) {
    console.error("[User Controller] Error fetching appointments from doctor service:", error.message);
    throw new ApiError(503, "Could not connect to the appointments service.");
  }
});

const getUserPrescriptions = asyncHandler(async (req, res) => {
  const authenticatedEmail = req.user.email.toLowerCase();

  const doctorBackendUrl = process.env.DOCTOR_BACKEND_URL;
  if (!doctorBackendUrl) {
    throw new ApiError(500, "Doctor service URL is not configured");
  }

  try {
    const authHeader = req.header("Authorization");
    const response = await fetch(`${doctorBackendUrl}/api/v1/appointments/user/${authenticatedEmail}`, {
      headers: authHeader ? { Authorization: authHeader } : {},
    });
    const appointmentsData = await response.json();

    if (response.ok && appointmentsData.data) {
      const prescriptions = appointmentsData.data
        .filter((appointment) => appointment.prescription || appointment.prescriptionFile)
        .map((appointment) => ({
          appointmentId: appointment._id,
          doctorName: appointment.doctorName,
          doctorEmail: appointment.doctorEmail,
          date: appointment.date,
          time: appointment.time,
          prescriptionFile: appointment.prescription || appointment.prescriptionFile,
          uploadedAt: appointment.treatmentDate || appointment.updatedAt,
          consultationNotes: appointment.consultationNotes,
          treatment: appointment.treatment,
        }));

      return res.status(200).json(new ApiResponse(200, prescriptions, "User prescriptions fetched successfully"));
    }
    return res.status(200).json(new ApiResponse(200, [], "No prescriptions found"));
  } catch (error) {
    console.error("[User Controller] Error fetching prescriptions:", error.message);
    throw new ApiError(503, "Could not connect to the appointments service.");
  }
});

/**
 * 1. Send OTP for Patient Signup
 */
const sendSignupOtp = asyncHandler(async (req, res) => {
  const { fullname, email, password, confirmPassword } = req.body;

  if (!fullname || !email || !password || !confirmPassword) {
    throw new ApiError(400, "All fields (Full Name, Email, Password, Confirm Password) are required.");
  }

  const cleanEmail = email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(cleanEmail)) {
    throw new ApiError(400, "Please provide a valid email address.");
  }

  if (password.length < 6) {
    throw new ApiError(400, "Password must be at least 6 characters long.");
  }

  if (password !== confirmPassword) {
    throw new ApiError(400, "Password and Confirm Password do not match.");
  }

  // Check if account already exists
  const existingUser = await User.findOne({ email: cleanEmail });
  if (existingUser) {
    throw new ApiError(409, "An account already exists with this email. Please log in instead.");
  }

  // Abuse Protection: Check 45-second cooldown for the same email
  const existingOtp = await Otp.findOne({ email: cleanEmail, purpose: "signup" });
  if (existingOtp) {
    const elapsedMs = Date.now() - new Date(existingOtp.lastSentAt).getTime();
    if (elapsedMs < 45000) {
      const waitSec = Math.ceil((45000 - elapsedMs) / 1000);
      throw new ApiError(429, `Please wait ${waitSec} seconds before requesting a new code.`);
    }
    // Delete previous OTP records
    await Otp.deleteMany({ email: cleanEmail, purpose: "signup" });
  }

  // Generate cryptographically secure 6-digit OTP
  const otp = generateSecureOtp();

  // Save OTP document
  await Otp.create({
    email: cleanEmail,
    otp,
    purpose: "signup",
    attempts: 0,
    lastSentAt: new Date(),
  });

  // Dispatch branded verification email
  try {
    await sendSignupOtpEmail(cleanEmail, otp, sanitizeInput(fullname, 50));
  } catch (emailError) {
    await Otp.deleteMany({ email: cleanEmail, purpose: "signup" });
    console.error("[sendSignupOtp] Failed to deliver email:", emailError.message);
    throw new ApiError(500, "Could not send verification email. Please verify your email configuration and try again.");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, { email: cleanEmail }, "Verification code sent to your email."));
});

/**
 * 2. Verify OTP & Create Patient Account
 */
const verifySignupOtp = asyncHandler(async (req, res) => {
  const { fullname, email, password, confirmPassword, otp } = req.body;

  if (!fullname || !email || !password || !confirmPassword || !otp) {
    throw new ApiError(400, "All fields (Full Name, Email, Password, Confirm Password, and OTP) are required.");
  }

  const cleanEmail = email.trim().toLowerCase();
  const cleanOtp = String(otp).trim();

  if (!/^\d{6}$/.test(cleanOtp)) {
    throw new ApiError(400, "Verification code must be exactly 6 digits.");
  }

  // Validate password constraints
  if (password.length < 6) {
    throw new ApiError(400, "Password must be at least 6 characters long.");
  }

  if (password !== confirmPassword) {
    throw new ApiError(400, "Password and Confirm Password do not match.");
  }

  // Guard against race conditions: verify email availability
  const existingUser = await User.findOne({ email: cleanEmail });
  if (existingUser) {
    throw new ApiError(409, "An account already exists with this email. Please log in instead.");
  }

  // Find scoped signup OTP
  const otpRecord = await Otp.findOne({ email: cleanEmail, purpose: "signup" });
  if (!otpRecord) {
    throw new ApiError(400, "Verification code has expired or was not requested. Please request a new code.");
  }

  // Attempt limit protection (max 5 failed attempts per OTP)
  if (otpRecord.attempts >= 5) {
    await Otp.deleteOne({ _id: otpRecord._id });
    throw new ApiError(400, "Too many failed attempts. This code has been invalidated. Please request a new one.");
  }

  // Check if OTP matches
  if (otpRecord.otp !== cleanOtp) {
    otpRecord.attempts += 1;
    await otpRecord.save();
    const remaining = 5 - otpRecord.attempts;
    throw new ApiError(400, `Invalid verification code. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.`);
  }

  // Single-use guarantee: Invalidate OTP immediately upon success
  await Otp.deleteOne({ _id: otpRecord._id });

  // Create Patient User in MongoDB
  const user = await User.create({
    fullname: sanitizeInput(fullname, 100),
    email: cleanEmail,
    password,
    confirmPassword,
    avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(fullname.trim())}`,
  });

  // Generate tokens using existing Mongoose schema methods
  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();

  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  // Retrieve sanitized user object
  const loggedInUser = await User.findById(user._id).select("-password -confirmPassword -refreshToken");
  if (!loggedInUser) {
    throw new ApiError(500, "Account created, but failed to retrieve user profile. Please log in.");
  }

  const cookieOptions = getAuthCookieOptions();

  return res
    .status(201)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("userAccessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(
      new ApiResponse(
        201,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "Account verified and created successfully."
      )
    );
});

/**
 * 3. Send OTP for Patient Login
 */
const sendLoginOtp = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) {
    throw new ApiError(400, "Email address is required.");
  }

  const cleanEmail = email.trim().toLowerCase();
  const user = await User.findOne({ email: cleanEmail });

  if (!user) {
    throw new ApiError(404, "No account found with this email address.");
  }

  if (user.isBlocked) {
    throw new ApiError(403, "Your account has been suspended. Please contact support.");
  }

  // Abuse Protection: 45-second cooldown
  const existingOtp = await Otp.findOne({ email: cleanEmail, purpose: "login" });
  if (existingOtp) {
    const elapsedMs = Date.now() - new Date(existingOtp.lastSentAt).getTime();
    if (elapsedMs < 45000) {
      const waitSec = Math.ceil((45000 - elapsedMs) / 1000);
      throw new ApiError(429, `Please wait ${waitSec} seconds before requesting a new code.`);
    }
    await Otp.deleteMany({ email: cleanEmail, purpose: "login" });
  }

  const otp = generateSecureOtp();
  await Otp.create({
    email: cleanEmail,
    otp,
    purpose: "login",
    attempts: 0,
    lastSentAt: new Date(),
  });

  try {
    await sendLoginOtpEmail(cleanEmail, otp);
  } catch (emailError) {
    await Otp.deleteMany({ email: cleanEmail, purpose: "login" });
    console.error("[sendLoginOtp] Failed to deliver login email:", emailError.message);
    throw new ApiError(500, "Could not send login code. Please check your email configuration and try again.");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, { email: cleanEmail }, "Login code sent to your email."));
});

/**
 * 4. Verify OTP & Log In
 */
const verifyLoginOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    throw new ApiError(400, "Email and OTP are required.");
  }

  const cleanEmail = email.trim().toLowerCase();
  const cleanOtp = String(otp).trim();

  if (!/^\d{6}$/.test(cleanOtp)) {
    throw new ApiError(400, "Login code must be exactly 6 digits.");
  }

  const otpRecord = await Otp.findOne({ email: cleanEmail, purpose: "login" });
  if (!otpRecord) {
    throw new ApiError(400, "Login code has expired or was not requested. Please request a new code.");
  }

  if (otpRecord.attempts >= 5) {
    await Otp.deleteOne({ _id: otpRecord._id });
    throw new ApiError(400, "Too many failed attempts. This code has been invalidated. Please request a new one.");
  }

  if (otpRecord.otp !== cleanOtp) {
    otpRecord.attempts += 1;
    await otpRecord.save();
    const remaining = 5 - otpRecord.attempts;
    throw new ApiError(400, `Invalid login code. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.`);
  }

  // Single-use: Delete verified OTP
  await Otp.deleteOne({ _id: otpRecord._id });

  const user = await User.findOne({ email: cleanEmail });
  if (!user) {
    throw new ApiError(404, "User account not found.");
  }

  if (user.isBlocked) {
    throw new ApiError(403, "Your account has been suspended. Please contact support.");
  }

  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();

  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  const loggedInUser = await User.findById(user._id).select("-password -confirmPassword -refreshToken");
  const cookieOptions = getAuthCookieOptions();

  return res
    .status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("userAccessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "Login successful."
      )
    );
});

export {
  registerUser,
  loginUser,
  logoutUser,
  sendSignupOtp,
  verifySignupOtp,
  sendLoginOtp,
  verifyLoginOtp,
  getUserAppointments,
  getUserProfile,
  updateUserProfile,
  updateUserAvatar,
  getUserPrescriptions,
};