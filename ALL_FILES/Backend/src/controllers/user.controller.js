import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/User.models.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { v2 as cloudinary } from "cloudinary";
import streamifier from "streamifier";
import fetch from "node-fetch";

// Helper function to upload a buffer to Cloudinary
const uploadBufferToCloudinary = (fileBuffer) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: "remedyease_avatars" },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    streamifier.createReadStream(fileBuffer).pipe(uploadStream);
  });
};

const registerUser = asyncHandler(async (req, res) => {
  const { fullname, email, password, confirmPassword } = req.body;

  if (
    [fullname, email, password, confirmPassword].some(
      (field) => !field || field.trim() === ""
    )
  ) {
    throw new ApiError(400, "All fields are required");
  }
  if (password !== confirmPassword) {
    throw new ApiError(400, "Passwords do not match");
  }
  if (!req.file) {
    throw new ApiError(400, "Avatar image is required");
  }

  const existedUser = await User.findOne({ email });
  if (existedUser) {
    throw new ApiError(409, "User with this email already exists");
  }

  const cloudinaryResponse = await uploadBufferToCloudinary(req.file.buffer);
  if (!cloudinaryResponse || !cloudinaryResponse.secure_url) {
    throw new ApiError(500, "File upload to Cloudinary failed");
  }

  const user = await User.create({
    fullname,
    email,
    password, // The model's pre-save hook will handle hashing
    avatar: cloudinaryResponse.secure_url,
  });

  const createdUser = await User.findById(user._id).select(
    "-password -confirmPassword -refreshToken"
  );
  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  return res
    .status(201)
    .json(new ApiResponse(201, createdUser, "User registered successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(404, "User not registered");
  }

  const isMatch = await user.isPasswordCorrect(password);
  if (!isMatch) {
    throw new ApiError(401, "Invalid credentials");
  }

  const accessToken = user.generateAccessToken();
  const loggedInUser = await User.findById(user._id).select(
    "-password -confirmPassword -refreshToken"
  );

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { user: loggedInUser, accessToken },
        "Login successful"
      )
    );
});

const getUserProfile = asyncHandler(async (req, res) => {
  const email = req.user?.email || req.query.email;
  if (!email) throw new ApiError(400, "User email is required");

  const user = await User.findOne({ email }).select(
    "-password -confirmPassword -refreshToken"
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
  }).select("-password -confirmPassword -refreshToken");
  if (!user) throw new ApiError(404, "User not found");
  return res.status(200).json(new ApiResponse(200, user, "Profile updated"));
});

const getUserAppointments = asyncHandler(async (req, res) => {
  const { userEmail } = req.params;
  const doctorBackendUrl = process.env.DOCTOR_BACKEND_URL;
  if (!doctorBackendUrl) {
    throw new ApiError(500, "Doctor service URL is not configured");
  }

  try {
    const response = await fetch(
      `${doctorBackendUrl}/api/v1/appointments/user/${userEmail}`
    );
    const appointmentsData = await response.json();

    if (response.ok) {
      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            appointmentsData.data,
            "User appointments fetched"
          )
        );
    } else {
      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            [],
            "No appointments found or error fetching them"
          )
        );
    }
  } catch (error) {
    console.error("Error fetching appointments from doctor backend:", error);
    throw new ApiError(503, "Could not connect to the appointments service.");
  }
});

export {
  registerUser,
  loginUser,
  getUserAppointments,
  getUserProfile,
  updateUserProfile,
};
