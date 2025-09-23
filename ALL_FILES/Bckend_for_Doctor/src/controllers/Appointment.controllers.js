import { Appointment } from "../models/Appointments.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/ApiHandler.js";

// Book appointment (user)
export const bookAppointment = asyncHandler(async (req, res) => {
  const { doctorEmail, doctorName, date, time, userEmail, userName, symptoms } = req.body;
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
    symptoms,
    status: "pending"
  });
  return res.status(201).json(new ApiResponse(201, appointment, "Appointment booked successfully"));
});

// Get appointments for doctor by email
export const getDoctorAppointments = asyncHandler(async (req, res) => {
  const { doctorEmail } = req.params;
  const appointments = await Appointment.find({ doctorEmail }).sort({ date: -1, time: -1 });
  console.log("Doctor email:", doctorEmail); 
  console.log("Appointments found:", appointments); 
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

// Get appointments for user by email
export const getUserAppointments = asyncHandler(async (req, res) => {
  const { userEmail } = req.params;
  console.log("Fetching appointments for user:", userEmail);
  
  const appointments = await Appointment.find({ userEmail }).sort({
    date: -1,
    time: -1,
  });
  
  console.log("Found appointments:", appointments);
  return res.status(200).json(new ApiResponse(200, appointments, "User appointments fetched"));
});

// Get consultation history for doctor
export const getDoctorConsultationHistory = asyncHandler(async (req, res) => {
  const { doctorEmail } = req.params;
  
  try {
    const consultations = await Appointment.find({ 
      doctorEmail: doctorEmail 
    }).sort({ createdAt: -1 });
    
    return res.status(200).json(new ApiResponse(200, consultations, "Consultation history fetched successfully"));
  } catch (error) {
    throw new ApiError(500, "Failed to fetch consultation history");
  }
});

// Add treatment details to appointment
export const addTreatmentDetails = asyncHandler(async (req, res) => {
  const { appointmentId } = req.params;
  const { treatment, treatedBy, treatmentDate, prescription, followUpRequired, followUpDate, consultationNotes } = req.body;
  
  try {
    const appointment = await Appointment.findById(appointmentId);
    
    if (!appointment) {
      throw new ApiError(404, "Appointment not found");
    }
    
    // Update appointment with treatment details
    appointment.treatment = treatment;
    appointment.treatedBy = treatedBy;
    appointment.treatmentDate = treatmentDate || new Date();
    appointment.prescription = prescription;
    appointment.followUpRequired = followUpRequired || false;
    appointment.followUpDate = followUpDate;
    appointment.consultationNotes = consultationNotes;
    appointment.status = "completed";
    
    await appointment.save();
    
    return res.status(200).json(new ApiResponse(200, appointment, "Treatment details added successfully"));
  } catch (error) {
    throw new ApiError(500, "Failed to add treatment details");
  }
});

// Update appointment with symptoms (for better history tracking)
export const addSymptomsToAppointment = asyncHandler(async (req, res) => {
  const { appointmentId } = req.params;
  const { symptoms } = req.body;
  
  try {
    const appointment = await Appointment.findById(appointmentId);
    
    if (!appointment) {
      throw new ApiError(404, "Appointment not found");
    }
    
    appointment.symptoms = symptoms;
    await appointment.save();
    
    return res.status(200).json(new ApiResponse(200, appointment, "Symptoms added successfully"));
  } catch (error) {
    throw new ApiError(500, "Failed to add symptoms");
  }
});