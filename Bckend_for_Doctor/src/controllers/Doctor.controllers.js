import { asyncHandler } from "../utils/ApiHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { Doctor } from "../models/Doctor.models.js";
import { uploadOnCloudinary } from "../utils/Cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const registerDoctor = asyncHandler(async (req, res) => {

  const fullname = req.body.fullname?.trim();
  const email = req.body.email?.trim();
  const registrationNumber = req.body.registrationNumber?.trim();
  const password = req.body.password;
  const confirmPassword = req.body.confirmPassword;
  const degree = req.body.degree?.trim();
  const specialization = req.body.specialization?.trim();
  const bio = req.body.bio?.trim() || "";
  const experience = req.body.experience?.trim() || "";

  // Validation
  if (
    !fullname ||
    !email ||
    !registrationNumber ||
    !password ||
    !confirmPassword ||
    !degree ||
    !specialization
  ) {
    throw new ApiError(400, "All fields are required");
  }

  // Already registered or not
  const AlreadyDoctor = await Doctor.findOne({ email });
  if (AlreadyDoctor) {
    throw new ApiError(409, "Doctor already registered with this email");
  }

  // Check avatar file
  const avatarLocalPath = req.files?.avatar?.[0]?.path;
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }

  // Upload to cloudinary
  const uploadResponse = await uploadOnCloudinary(avatarLocalPath);
  if (!uploadResponse) {
    throw new ApiError(500, "File upload failed, please try again later");
  }

  // Store in DB
  const doctor = await Doctor.create({
    fullname,
    email,
    password,
    confirmPassword,
    degree,
    specialization,
    registrationNumber,
    avatar: uploadResponse.url,
    bio,
    experience
  });

  const createddoctor = await Doctor.findById(doctor._id).select(
    "-password -confirmPassword -createdAt -updatedAt"
  );
  if (!createddoctor) {
    throw new ApiError(
      500,
      "Doctor registration failed, please try again later"
    );
  }


  return res
    .status(201)
    .json(
      new ApiResponse(200, createddoctor, "Doctor registered successfully")
    );
});
const loginDoctor = asyncHandler(async (req, res) => {
  console.log("Login request body:", req.body);
  const { email, password } = req.body;
  // Find doctor by email
  const doctor = await Doctor.findOne({ email });
  if (!doctor) {
    throw new ApiError(404, "Doctor not found with this email");
  }
  // Check password
  const isPasswordMatched = await doctor.isPasswordCorrect(password);
  if (!isPasswordMatched) {
    throw new ApiError(401, "Incorrect password");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { doctor },
        "Doctor logged in successfully"
      )
    );
});
 const getDoctorProfile = asyncHandler(async (req, res) => {
  const email = req.user?.email || req.query.email;
  if (!email) {
    throw new ApiError(400, "Doctor email is required");
  }

  const doctor = await Doctor.findOne({ email }).select(
    "-password -confirmPassword -createdAt -updatedAt"
  );
  if (!doctor) {
    throw new ApiError(404, "Doctor not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, doctor, "Doctor profile fetched successfully"));
});
const updateDoctorProfile = asyncHandler(async (req, res) => {
  const email = req.user?.email || req.body.email;
  if (!email) throw new ApiError(400, "Email is required");

  // Only update provided fields
  const updateFields = { ...req.body };
  delete updateFields.email; // Don't allow email change

  const doctor = await Doctor.findOneAndUpdate(
    { email },
    updateFields,
    { new: true }
  ).select("-password -confirmPassword -createdAt -updatedAt");
  if (!doctor) throw new ApiError(404, "Doctor not found");

  return res.status(200).json(new ApiResponse(200, doctor, "Profile updated"));
});

export { registerDoctor, loginDoctor, getDoctorProfile, updateDoctorProfile };
