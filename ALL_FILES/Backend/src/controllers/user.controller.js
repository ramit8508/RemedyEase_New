import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/User.models.js";
import { uploadOnCloudinary } from "../utils/Cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import fetch from "node-fetch";

// Sanitize string to prevent basic XSS
function sanitizeInput(str, maxLen = 500) {
  if (typeof str !== "string") return "";
  return str.replace(/<[^>]*>/g, "").trim().slice(0, maxLen);
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

export {
  registerUser,
  loginUser,
  logoutUser,
  getUserAppointments,
  getUserProfile,
  updateUserProfile,
  updateUserAvatar,
  getUserPrescriptions,
};