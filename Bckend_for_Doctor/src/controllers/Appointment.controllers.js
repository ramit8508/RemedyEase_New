import { Appointment } from "../models/Appointments.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/ApiHandler.js";

// Book appointment (user)
export const bookAppointment = asyncHandler(async (req, res) => {
  const { doctorEmail, doctorName, date, time, userEmail, userName } = req.body;
  if (!doctorEmail || !doctorName || !date || !time || !userEmail || !userName) {
    throw new ApiError(400, "All fields are required");
  }
  const appointment = await Appointment.create({
    doctorEmail,
    doctorName,
    userEmail,
    userName,
    date,
    time,
    status: "pending"
  });
  return res.status(201).json(new ApiResponse(201, appointment, "Appointment booked successfully"));
});

// Get appointments for doctor by email
export const getDoctorAppointments = asyncHandler(async (req, res) => {
  const { doctorEmail } = req.params;
  const appointments = await Appointment.find({ doctorEmail }).sort({ date: -1, time: -1 });
  console.log("Doctor email:", doctorEmail); // <-- Add here
  console.log("Appointments found:", appointments); // <-- Add here
  return res.status(200).json(new ApiResponse(200, appointments, "Doctor appointments fetched"));
});

// Confirm appointment by email
export const confirmAppointment = asyncHandler(async (req, res) => {
  const { appointmentId } = req.params;
  const { doctorEmail } = req.body;
  const appointment = await Appointment.findOneAndUpdate(
    { _id: appointmentId, doctorEmail },
    { status: "confirmed" },
    { new: true }
  );
  if (!appointment) {
    throw new ApiError(404, "Appointment not found or email mismatch");
  }
  return res.status(200).json(new ApiResponse(200, appointment, "Appointment confirmed"));
});