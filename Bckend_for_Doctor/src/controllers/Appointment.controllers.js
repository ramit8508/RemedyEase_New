import { Appointment } from "../models/Appointments.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/ApiHandler.js";

export const bookAppointment = asyncHandler(async (req, res) => {
  const { doctorId, doctorName, date, time } = req.body;
  // Get user info from req.user or req.body (adjust as needed)
  const userId = req.user?._id || req.body.userId;
  const userName = req.user?.fullname || req.body.userName;

  if (!doctorId || !doctorName || !date || !time || !userId || !userName) {
    throw new ApiError(400, "All fields are required");
  }

  const appointment = await Appointment.create({
    doctorId,
    doctorName,
    userId,
    userName,
    date,
    time
  });

  return res.status(201).json(new ApiResponse(201, appointment, "Appointment booked successfully"));
});