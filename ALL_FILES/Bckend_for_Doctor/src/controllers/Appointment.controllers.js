import { Appointment } from "../models/Appointments.models.js";
import { Timeslot } from "../models/Timeslot.models.js";
import { Doctor } from "../models/Doctor.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/Cloudinary.js";

// Book appointment (user)
export const bookAppointment = asyncHandler(async (req, res) => {
  const { doctorEmail, doctorName, date, time, userEmail, userName, symptoms, doctorId } = req.body;
  console.log('[BOOK] Incoming booking request:', { doctorEmail, doctorName, date, time, userEmail, userName, hasDoctorId: !!doctorId });
  
  if (!doctorEmail || !date || !time || !userEmail || !userName) {
    throw new ApiError(400, "All fields (doctor, date, time, patient information) are required");
  }

  // 1. Identify the doctor
  let doctorDoc = null;
  if (doctorId) {
    doctorDoc = await Doctor.findById(doctorId);
  }
  if (!doctorDoc && doctorEmail) {
    doctorDoc = await Doctor.findOne({ email: doctorEmail });
  }

  const effectiveDoctorId = doctorDoc?._id || doctorId;
  const effectiveDoctorName = doctorDoc?.fullname || doctorName || "Doctor";

  // 2. Validate and reserve the doctor-published timeslot
  if (effectiveDoctorId) {
    const timeslotDoc = await Timeslot.findOne({ 
      doctor: effectiveDoctorId, 
      date: date 
    });

    if (timeslotDoc && Array.isArray(timeslotDoc.slots) && timeslotDoc.slots.length > 0) {
      const slotIndex = timeslotDoc.slots.findIndex(s => s.time === time || s === time);
      
      if (slotIndex === -1) {
        throw new ApiError(400, "The selected time slot was not published by this doctor.");
      }

      const slot = timeslotDoc.slots[slotIndex];
      const isAlreadyBooked = typeof slot === "object" ? slot.booked : false;

      if (isAlreadyBooked) {
        throw new ApiError(400, "This time slot is already booked. Please choose another available slot.");
      }

      // Mark slot as booked
      if (typeof slot === "object") {
        timeslotDoc.slots[slotIndex].booked = true;
        timeslotDoc.slots[slotIndex].bookedBy = userEmail;
      } else {
        timeslotDoc.slots[slotIndex] = {
          time: slot,
          booked: true,
          bookedBy: userEmail
        };
      }
      
      try {
        await timeslotDoc.save();
        console.log('[BOOK] Timeslot reserved successfully for:', time);
      } catch (slotErr) {
        console.error('[BOOK] Failed to reserve timeslot:', slotErr.message);
        throw new ApiError(500, "Unable to reserve the selected time slot. Please try again.");
      }
    }
  }

  // 3. Prevent duplicate active appointments for same user, doctor, date, time
  const existingAppt = await Appointment.findOne({
    doctorEmail,
    userEmail,
    date,
    time,
    status: { $in: ["pending", "confirmed", "approved"] }
  });

  if (existingAppt) {
    throw new ApiError(400, "You already have an active appointment scheduled for this time slot.");
  }

  // 4. Create the appointment
  try {
    const appointment = await Appointment.create({
      doctorEmail,
      doctorName: effectiveDoctorName,
      userEmail,
      userName,
      date,
      time,
      symptoms: symptoms?.trim() || "General Consultation",
      status: "pending"
    });
    
    console.log('[BOOK] Appointment created successfully:', appointment._id);
    return res.status(201).json(new ApiResponse(201, appointment, "Appointment booked successfully"));
  } catch (createErr) {
    console.error('[BOOK] Failed to create appointment:', createErr.message);
    if (createErr.name === 'ValidationError') {
      const messages = Object.values(createErr.errors).map(e => e.message).join(', ');
      throw new ApiError(400, `Validation error: ${messages}`);
    }
    throw new ApiError(500, "Unable to book the appointment right now. Please try again.");
  }
});

// Get appointments for doctor by email
export const getDoctorAppointments = asyncHandler(async (req, res) => {
  const { doctorEmail } = req.params;
  const appointments = await Appointment.find({ doctorEmail }).sort({ date: -1, time: -1 });
  console.log("Doctor email:", doctorEmail); 
  console.log("Appointments found:", appointments); 
  return res.status(200).json(new ApiResponse(200, appointments, "Doctor appointments fetched"));
});

// Get single appointment by ID
export const getAppointmentById = asyncHandler(async (req, res) => {
  const { appointmentId } = req.params;
  const appointment = await Appointment.findById(appointmentId);
  if (!appointment) {
    throw new ApiError(404, "Appointment not found");
  }
  return res.status(200).json(new ApiResponse(200, appointment, "Appointment fetched successfully"));
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

// Approve appointment (doctor approves the booking)
export const approveAppointment = asyncHandler(async (req, res) => {
  const { appointmentId } = req.params;
  const { doctorEmail } = req.body;
  
  console.log('[APPROVE] Approving appointment:', appointmentId, 'by doctor:', doctorEmail);
  
  const appointment = await Appointment.findOne({ _id: appointmentId, doctorEmail });
  
  if (!appointment) {
    throw new ApiError(404, "Appointment not found or you don't have permission");
  }
  
  if (appointment.status === "cancelled") {
    throw new ApiError(400, "Cannot approve a cancelled appointment");
  }
  
  appointment.status = "approved";
  await appointment.save();
  
  console.log('[APPROVE] Appointment approved successfully');
  return res.status(200).json(new ApiResponse(200, appointment, "Appointment approved successfully"));
});

// Cancel appointment (doctor or patient cancels the booking)
export const cancelAppointment = asyncHandler(async (req, res) => {
  const { appointmentId } = req.params;
  const { doctorEmail, userEmail, reason } = req.body;
  
  let query = { _id: appointmentId };
  if (doctorEmail) {
    query.doctorEmail = doctorEmail;
  } else if (userEmail) {
    query.userEmail = userEmail;
  }
  
  const appointment = await Appointment.findOne(query);
  
  if (!appointment) {
    throw new ApiError(404, "Appointment not found or you don't have permission");
  }
  
  if (appointment.status === "completed") {
    throw new ApiError(400, "Cannot cancel an already completed appointment");
  }
  
  appointment.status = "cancelled";
  appointment.consultationNotes = reason 
    ? `Cancelled: ${reason}` 
    : (userEmail ? "Cancelled by patient" : "Cancelled by doctor");
  await appointment.save();

  // Free the timeslot so it can be re-booked
  try {
    const doctorDoc = await Doctor.findOne({ email: appointment.doctorEmail });
    if (doctorDoc) {
      await Timeslot.updateOne(
        { doctor: doctorDoc._id, date: appointment.date, "slots.time": appointment.time },
        { "$set": { "slots.$.booked": false, "slots.$.bookedBy": null } }
      );
    }
  } catch (err) {
    console.error("Failed to free timeslot on cancellation:", err);
  }
  
  console.log('[CANCEL] Appointment cancelled successfully:', appointmentId);
  return res.status(200).json(new ApiResponse(200, appointment, "Appointment cancelled successfully"));
});

// Get appointments for user by email
export const getUserAppointments = asyncHandler(async (req, res) => {
  const { userEmail } = req.params;
  console.log('[FETCH] Fetching appointments for user:', userEmail);
  const appointments = await Appointment.find({ userEmail }).sort({
    date: -1,
    time: -1,
  });
  console.log('[FETCH] Found appointments:', appointments);
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

// Upload prescription file for appointment
export const uploadPrescription = asyncHandler(async (req, res) => {
  const { appointmentId } = req.params;
  const { doctorEmail } = req.body;
  
  try {
    // Check if file was uploaded
    if (!req.file) {
      throw new ApiError(400, "No prescription file uploaded");
    }
    
    // Find the appointment
    const appointment = await Appointment.findById(appointmentId);
    
    if (!appointment) {
      throw new ApiError(404, "Appointment not found");
    }
    
    // Verify doctor owns this appointment
    if (appointment.doctorEmail !== doctorEmail) {
      throw new ApiError(403, "Unauthorized to upload prescription for this appointment");
    }
    
    // Upload file to Cloudinary
    const uploadResult = await uploadOnCloudinary(req.file.buffer);
    
    if (!uploadResult || !uploadResult.secure_url) {
      throw new ApiError(500, "Failed to upload prescription file");
    }
    
    // Update appointment with prescription file URL
    appointment.prescriptionFile = uploadResult.secure_url;
    appointment.prescriptionUploadedAt = new Date();
    appointment.prescriptionUploadedBy = doctorEmail;
    
    await appointment.save();
    
    return res.status(200).json(
      new ApiResponse(200, appointment, "Prescription uploaded successfully")
    );
  } catch (error) {
    console.error("Prescription upload error:", error);
    throw new ApiError(500, error.message || "Failed to upload prescription");
  }
});

// Get prescription for appointment
export const getPrescription = asyncHandler(async (req, res) => {
  const { appointmentId } = req.params;
  
  try {
    const appointment = await Appointment.findById(appointmentId);
    
    if (!appointment) {
      throw new ApiError(404, "Appointment not found");
    }
    
    if (!appointment.prescriptionFile) {
      throw new ApiError(404, "No prescription found for this appointment");
    }
    
    return res.status(200).json(
      new ApiResponse(200, {
        prescriptionFile: appointment.prescriptionFile,
        uploadedAt: appointment.prescriptionUploadedAt,
        uploadedBy: appointment.prescriptionUploadedBy
      }, "Prescription fetched successfully")
    );
  } catch (error) {
    throw new ApiError(500, "Failed to fetch prescription");
  }
});
