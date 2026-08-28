import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { Doctor } from "../models/Doctor.models.js";
import { uploadOnCloudinary } from "../utils/Cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Timeslot } from "../models/Timeslot.models.js";

function sanitizeString(str, maxLen = 300) {
  if (typeof str !== "string") return "";
  return str.replace(/<[^>]*>/g, "").trim().slice(0, maxLen);
}

const registerDoctor = asyncHandler(async (req, res) => {
  const {
    fullname,
    email,
    registrationNumber,
    password,
    confirmPassword,
    degree,
    specialization,
    bio,
    experience,
    clinic,
  } = req.body;

  if (!fullname || !email || !registrationNumber || !password || !degree || !specialization) {
    throw new ApiError(400, "All required fields must be filled");
  }

  const cleanEmail = email.trim().toLowerCase();
  const cleanRegNo = registrationNumber.trim().toUpperCase();

  if (password !== confirmPassword) {
    throw new ApiError(400, "Password and Confirm Password do not match");
  }

  if (password.length < 6) {
    throw new ApiError(400, "Password must be at least 6 characters long");
  }

  if (!req.file || !req.file.buffer) {
    throw new ApiError(400, "Avatar file is required");
  }

  const existedDoctor = await Doctor.findOne({
    $or: [{ email: cleanEmail }, { registrationNumber: cleanRegNo }],
  });

  if (existedDoctor) {
    throw new ApiError(409, "Doctor with this email or registration number already exists");
  }

  const cloudinaryResponse = await uploadOnCloudinary(req.file.buffer);
  if (!cloudinaryResponse || !cloudinaryResponse.secure_url) {
    throw new ApiError(500, "Avatar upload to Cloudinary failed");
  }
  const avatarUrl = cloudinaryResponse.secure_url;

  const doctor = await Doctor.create({
    fullname: sanitizeString(fullname, 100),
    email: cleanEmail,
    password,
    confirmPassword,
    degree: sanitizeString(degree, 100),
    specialization: sanitizeString(specialization, 100),
    registrationNumber: cleanRegNo,
    avatar: avatarUrl,
    bio: sanitizeString(bio || "", 1000),
    experience: sanitizeString(experience || "", 50),
    clinic: sanitizeString(clinic || "", 200),
    approvalStatus: "pending",
  });

  const createdDoctor = await Doctor.findById(doctor._id).select(
    "-password -confirmPassword -refreshToken"
  );

  return res
    .status(201)
    .json(new ApiResponse(201, createdDoctor, "Doctor registered successfully. Awaiting administrative approval."));
});

const loginDoctor = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  const cleanEmail = email.trim().toLowerCase();
  const doctor = await Doctor.findOne({ email: cleanEmail });
  if (!doctor) {
    throw new ApiError(401, "Invalid doctor email or password");
  }

  if (doctor.isBlocked) {
    throw new ApiError(403, "Your account has been suspended by the administrator.");
  }

  if (doctor.approvalStatus === "pending") {
    throw new ApiError(
      403,
      "Your account is pending verification. You will receive an approval email once reviewed."
    );
  }

  if (doctor.approvalStatus === "rejected") {
    const reason = doctor.rejectionReason || "Application criteria not met.";
    throw new ApiError(403, `Your account application was not approved. Reason: ${reason}`);
  }

  const isPasswordCorrect = await doctor.isPasswordCorrect(password);
  if (!isPasswordCorrect) {
    throw new ApiError(401, "Invalid doctor email or password");
  }

  const accessToken = doctor.generateAccessToken();
  const refreshToken = doctor.generateRefreshToken();

  doctor.refreshToken = refreshToken;
  await doctor.save({ validateBeforeSave: false });

  const loggedInDoctor = await Doctor.findById(doctor._id).select(
    "-password -confirmPassword -refreshToken"
  );

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };

  return res
    .status(200)
    .cookie("doctorAccessToken", accessToken, cookieOptions)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(
      new ApiResponse(
        200,
        {
          doctor: loggedInDoctor,
          accessToken,
          refreshToken,
        },
        "Doctor logged in successfully"
      )
    );
});

const getDoctorProfile = asyncHandler(async (req, res) => {
  const email = (req.doctor?.email || req.query.email)?.trim()?.toLowerCase();
  if (!email) {
    throw new ApiError(400, "Doctor email or authentication is required");
  }

  const doctor = await Doctor.findOne({ email }).select(
    "-password -confirmPassword -refreshToken"
  );

  if (!doctor) {
    throw new ApiError(404, "Doctor not found");
  }

  return res.status(200).json(new ApiResponse(200, doctor, "Doctor profile fetched successfully"));
});

const ALLOWED_DOCTOR_PROFILE_FIELDS = [
  "fullname",
  "degree",
  "specialization",
  "bio",
  "experience",
  "clinic",
  "phone",
  "consultationFee",
];

const updateDoctorProfile = asyncHandler(async (req, res) => {
  const doctorId = req.doctor?._id;
  const email = (req.doctor?.email || req.body.email)?.trim()?.toLowerCase();

  const query = doctorId ? { _id: doctorId } : { email };
  if (!query._id && !query.email) {
    throw new ApiError(400, "Doctor authentication required to update profile");
  }

  const updateFields = {};
  for (const field of ALLOWED_DOCTOR_PROFILE_FIELDS) {
    if (req.body[field] !== undefined) {
      updateFields[field] = sanitizeString(String(req.body[field]), 500);
    }
  }

  const doctor = await Doctor.findOneAndUpdate(query, updateFields, { new: true }).select(
    "-password -confirmPassword -refreshToken"
  );

  if (!doctor) {
    throw new ApiError(404, "Doctor not found");
  }

  return res.status(200).json(new ApiResponse(200, doctor, "Profile updated successfully"));
});

const getAllDoctors = asyncHandler(async (req, res) => {
  const { search, specialization, sort } = req.query;

  let query = {
    isBlocked: { $ne: true },
    approvalStatus: "approved",
  };

  if (specialization && specialization !== "All" && specialization !== "all") {
    query.specialization = { $regex: new RegExp(`^${sanitizeString(specialization.trim(), 50)}$`, "i") };
  }

  if (search && search.trim()) {
    const searchRegex = new RegExp(sanitizeString(search.trim(), 100), "i");
    query.$or = [
      { fullname: searchRegex },
      { specialization: searchRegex },
      { clinic: searchRegex },
      { degree: searchRegex },
      { bio: searchRegex },
    ];
  }

  let sortOption = { createdAt: -1 };
  if (sort === "experience") {
    sortOption = { experience: -1 };
  } else if (sort === "name") {
    sortOption = { fullname: 1 };
  }

  const doctors = await Doctor.find(query)
    .select("-password -confirmPassword -refreshToken")
    .sort(sortOption);

  return res.status(200).json(new ApiResponse(200, doctors || [], "All doctors fetched successfully"));
});

// Set available timeslots for a doctor (Protected)
const setDoctorTimeslots = asyncHandler(async (req, res) => {
  const doctorId = req.doctor?._id || req.body.doctorId;
  const { date, slots } = req.body;

  if (!doctorId || !date || !Array.isArray(slots)) {
    throw new ApiError(400, "Doctor, date, and slots are required");
  }

  const cleanDate = sanitizeString(date, 20);
  const validatedSlots = slots.map((s) => {
    if (typeof s === "string") {
      return { time: sanitizeString(s, 20), booked: false };
    }
    return {
      time: sanitizeString(s.time, 20),
      booked: Boolean(s.booked),
      bookedBy: s.bookedBy ? sanitizeString(s.bookedBy, 100) : undefined,
    };
  });

  const timeslotDoc = await Timeslot.findOneAndUpdate(
    { doctor: doctorId, date: cleanDate },
    { doctor: doctorId, date: cleanDate, slots: validatedSlots },
    { upsert: true, new: true }
  );

  return res.status(200).json(new ApiResponse(200, timeslotDoc, "Timeslots set successfully"));
});

// Get all timeslots for a doctor
const getDoctorTimeslots = asyncHandler(async (req, res) => {
  const { doctorId, date } = req.query;
  if (!doctorId) {
    throw new ApiError(400, "doctorId is required");
  }

  let query = { doctor: doctorId };
  if (date) query.date = sanitizeString(date, 20);
  const timeslots = await Timeslot.find(query);

  const normalized = timeslots.map((doc) => {
    const docObj = doc.toObject();
    if (Array.isArray(docObj.slots)) {
      docObj.slots = docObj.slots.map((s) => {
        if (typeof s === "string") {
          return { time: s, booked: false };
        }
        return {
          time: s.time,
          booked: Boolean(s.booked),
        };
      });
    } else {
      docObj.slots = [];
    }
    return docObj;
  });

  return res.status(200).json(new ApiResponse(200, normalized, "Timeslots fetched successfully"));
});

export {
  registerDoctor,
  loginDoctor,
  getDoctorProfile,
  updateDoctorProfile,
  getAllDoctors,
  setDoctorTimeslots,
  getDoctorTimeslots,
};
