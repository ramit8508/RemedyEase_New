import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { Doctor } from "../models/Doctor.models.js";
import { uploadOnCloudinary } from "../utils/Cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const registerDoctor = asyncHandler(async (req, res) => {
    const { 
        fullname, email, registrationNumber, password, confirmPassword, 
        degree, specialization, bio, experience 
    } = req.body;
    if (!fullname || !email || !registrationNumber || !password || !degree || !specialization) {
        throw new ApiError(400, "All required fields must be filled");
    }
    if (password !== confirmPassword) {
        throw new ApiError(400, "Password and Confirm Password do not match");
    }
    if (!req.file || !req.file.buffer) {
        throw new ApiError(400, "Avatar file is required");
    }
    const existedDoctor = await Doctor.findOne({ $or: [{ email }, { registrationNumber }] });
    if (existedDoctor) {
        throw new ApiError(409, "Doctor with this email or registration number already exists");
    }
    const cloudinaryResponse = await uploadOnCloudinary(req.file.buffer);
    if (!cloudinaryResponse || !cloudinaryResponse.secure_url) {
        throw new ApiError(500, "Avatar upload to Cloudinary failed");
    }
    const avatarUrl = cloudinaryResponse.secure_url;
    const doctor = await Doctor.create({
        fullname, email, password, confirmPassword, degree, specialization,
        registrationNumber, avatar: avatarUrl, bio: bio || "", experience: experience || ""
    });
    const createdDoctor = await Doctor.findById(doctor._id).select("-password -confirmPassword -refreshToken");
    if (!createdDoctor) {
        throw new ApiError(500, "Something went wrong while registering the doctor");
    }
    return res.status(201).json(new ApiResponse(201, createdDoctor, "Doctor registered successfully"));
});

const loginDoctor = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        throw new ApiError(400, "Email and password are required");
    }
    const doctor = await Doctor.findOne({ email });
    if (!doctor) {
        throw new ApiError(404, "Doctor not found with this email");
    }
    
    // Check if doctor is blocked
    if (doctor.isBlocked) {
        throw new ApiError(403, "Your account has been blocked by the admin. Please contact support.");
    }
    
    // Check approval status
    if (doctor.approvalStatus === 'pending') {
        throw new ApiError(403, "Your account is pending approval. Please wait for admin verification. You will be notified via email once approved.");
    }
    
    if (doctor.approvalStatus === 'rejected') {
        const reason = doctor.rejectionReason || "Your application was not approved.";
        throw new ApiError(403, `Your account has been rejected. Reason: ${reason}`);
    }
    
    const isPasswordCorrect = await doctor.isPasswordCorrect(password);
    if (!isPasswordCorrect) {
        throw new ApiError(401, "Incorrect password");
    }
    const loggedInDoctor = await Doctor.findById(doctor._id).select("-password -confirmPassword");
    return res.status(200).json(new ApiResponse(200, { doctor: loggedInDoctor }, "Doctor logged in successfully"));
});

const getDoctorProfile = asyncHandler(async (req, res) => {
    const email = req.query.email;
    if (!email) {
        throw new ApiError(400, "Doctor email is required in the query string");
    }
    const doctor = await Doctor.findOne({ email }).select("-password -confirmPassword");
    if (!doctor) {
        throw new ApiError(404, "Doctor not found");
    }
    return res.status(200).json(new ApiResponse(200, doctor, "Doctor profile fetched successfully"));
});

const updateDoctorProfile = asyncHandler(async (req, res) => {
    const { email, ...updateFields } = req.body;
    if (!email) {
        throw new ApiError(400, "Email is required to identify the doctor to update");
    }
    const doctor = await Doctor.findOneAndUpdate({ email }, updateFields, { new: true }).select("-password -confirmPassword");
    if (!doctor) {
        throw new ApiError(404, "Doctor not found");
    }
    return res.status(200).json(new ApiResponse(200, doctor, "Profile updated successfully"));
});

// --- THIS IS THE NEW FUNCTION ---
// It finds all doctors in the database and sends them back as a list.
const getAllDoctors = asyncHandler(async (req, res) => {
    const doctors = await Doctor.find({}).select("-password -confirmPassword -refreshToken");

    if (!doctors) {
        throw new ApiError(404, "No doctors found in the database");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, doctors, "All doctors fetched successfully"));
});

export { 
    registerDoctor, 
    loginDoctor, 
    getDoctorProfile, 
    updateDoctorProfile,
    getAllDoctors // Add the new function to the list of exports
};

