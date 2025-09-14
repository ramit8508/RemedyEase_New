import { asyncHandler } from "../utils/ApiHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { Doctor } from "../models/Doctor.models.js";
import { uploadOnCloudinary } from "../utils/Cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const registerDoctor = asyncHandler(async (req, res) => {
    // Get fields from form-data
    const fullname = req.body.fullname?.trim();
    const email = req.body.email?.trim();
    const registrationNumber = req.body.registrationNumber?.trim();
    const password = req.body.password;
    const confirmPassword = req.body.confirmPassword;
    const degree = req.body.degree?.trim();
    const specialization = req.body.specialization?.trim();

    // Validation
    if (
        !fullname || !email || !registrationNumber ||
        !password || !confirmPassword || !degree || !specialization
    ) {
        throw new ApiError(400, "All fields are required");
    }
    if (!email.includes("@")) {
        throw new ApiError(400, "Invalid email address");
    }
    if (!registrationNumber.length) {
        throw new ApiError(400, "Provide valid registration number");
    }
    if (password.length < 6) {
        throw new ApiError(400, "Password must be at least 6 characters long");
    }
    if (password !== confirmPassword) {
        throw new ApiError(400, "Password and Confirm Password do not match");
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
    });

    const createddoctor = await Doctor.findById(doctor._id).select("-password -confirmPassword -createdAt -updatedAt");
    if (!createddoctor) {
        throw new ApiError(500, "Doctor registration failed, please try again later");
    }

    // Return response
    return res.status(201).json(
        new ApiResponse(200, createddoctor, "Doctor registered successfully")
    );
});

export { registerDoctor };