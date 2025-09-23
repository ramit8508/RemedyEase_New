import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/Apierror.js";
import { User } from "../models/User.models.js";
import { uploadOnCloudinary } from "../utils/Cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Appointment } from "../models/Appointment.models.js";
import fetch from 'node-fetch';

const registerUser = asyncHandler(async (req, res) => {
  console.log("🚀 Registration endpoint hit!");
  console.log("Request body:", req.body);
  console.log("Request files:", req.files);
  
  // Get fields from form-data
  const fullname = req.body.fullname?.trim();
  const email = req.body.email?.trim();
  const password = req.body.password;
  const confirmPassword = req.body.confirmPassword;
  const avatarFile = req.files?.avatar?.[0];

  console.log("Parsed fields:", { fullname, email, password: password ? "***" : undefined, confirmPassword: confirmPassword ? "***" : undefined, avatarFile: avatarFile ? "present" : "missing" });

  // Validation
  if (!fullname || !email || !password || !confirmPassword || !avatarFile) {
    throw new ApiError(400, "All fields are required");
  }
  if (!email.includes("@")) {
    throw new ApiError(400, "Invalid email address");
  }
  if (password.length < 6) {
    throw new ApiError(400, "Password must be at least 6 characters long");
  }
  if (password !== confirmPassword) {
    throw new ApiError(400, "Password and Confirm Password do not match");
  }

  // Already registered or not
  const AlreadyUser = await User.findOne({ email });
  if (AlreadyUser) {
    throw new ApiError(409, "User already registered with this email");
  }

  // Upload avatar to cloudinary
  const avatarLocalPath = avatarFile.path;
  const uploadResponse = await uploadOnCloudinary(avatarLocalPath);
  if (!uploadResponse) {
    throw new ApiError(500, "File upload failed, please try again later");
  }

  // Store in DB
  const user = await User.create({
    fullname,
    email,
    password,
    confirmPassword,
    avatar: uploadResponse.url,
  });

  const createduser = await User.findById(user._id).select(
    "-password -confirmPassword -refreshToken -createdAt -updatedAt"
  );
  if (!createduser) {
    throw new ApiError(500, "User registration failed, please try again later");
  }

  // Return response
  return res
    .status(201)
    .json(new ApiResponse(200, createduser, "User registered successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Find user by email
  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(404, "User not registered");
  }

  // Compare password using the schema method
  const isMatch = await user.isPasswordCorrect(password);
  if (!isMatch) {
    throw new ApiError(401, "Invalid credentials");
  }

  // Generate token if needed
  const accessToken = user.generateAccessToken();

  // Respond
  return res
    .status(200)
    .json(new ApiResponse(200, { user, accessToken }, "Login successful"));
});
// ...existing registerUser and loginUser...

const getUserProfile = asyncHandler(async (req, res) => {
  const email = req.user?.email || req.query.email;
  if (!email) throw new ApiError(400, "User email is required");

  const user = await User.findOne({ email }).select(
    "-password -confirmPassword -refreshToken -createdAt -updatedAt"
  );
  if (!user) throw new ApiError(404, "User not found");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "User profile fetched successfully"));
});

const updateUserProfile = asyncHandler(async (req, res) => {
  const email = req.user?.email || req.body.email;
  if (!email) throw new ApiError(400, "Email is required");

  const updateFields = { ...req.body };
  delete updateFields.email;

  const user = await User.findOneAndUpdate({ email }, updateFields, {
    new: true,
  }).select("-password -confirmPassword -refreshToken -createdAt -updatedAt");
  if (!user) throw new ApiError(404, "User not found");
  return res.status(200).json(new ApiResponse(200, user, "Profile updated"));
});
const getUserAppointments = asyncHandler(async (req, res) => {
  const { userEmail } = req.params;
  
  // Import the Appointment model from the doctor database
  // We need to connect to the doctor database to get appointments
  try {
    // Make API call to doctor backend to get appointments
    const response = await fetch(`http://localhost:5001/api/v1/appointments/user/${userEmail}`);
    const appointmentsData = await response.json();
    
    console.log("Appointments from doctor backend:", appointmentsData);
    
    if (response.ok) {
      return res.status(200).json(new ApiResponse(200, appointmentsData.data, "User appointments fetched"));
    } else {
      return res.status(200).json(new ApiResponse(200, [], "No appointments found"));
    }
  } catch (error) {
    console.error("Error fetching appointments:", error);
    return res.status(200).json(new ApiResponse(200, [], "User appointments fetched"));
  }
});
export { registerUser, loginUser, getUserAppointments, getUserProfile, updateUserProfile };
