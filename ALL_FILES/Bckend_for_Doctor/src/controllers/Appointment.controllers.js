import { Appointment } from "../models/Appointments.models.js";
import { Timeslot } from "../models/Timeslot.models.js";
import { Doctor } from "../models/Doctor.models.js";
import { Notification } from "../models/Notification.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/Cloudinary.js";
import { createDoctorNotification } from "./Notification.controllers.js";

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
    doctorDoc = await Doctor.findOne({ email: doctorEmail.toLowerCase() });
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
    doctorEmail: doctorEmail.toLowerCase(),
    userEmail: userEmail.toLowerCase(),
    date,
    time,
    status: { $in: ["pending", "confirmed", "approved"] }
  });

  if (existingAppt) {
    throw new ApiError(400, "You already have an active appointment scheduled for this time slot.");
  }

  // 4. Create the appointment
  let appointment;
  try {
    appointment = await Appointment.create({
      doctorId: effectiveDoctorId || undefined,
      doctorEmail: doctorEmail.toLowerCase(),
      doctorName: effectiveDoctorName,
      userEmail: userEmail.toLowerCase(),
      userName,
      date,
      time,
      symptoms: symptoms?.trim() || "General Consultation",
      status: "pending"
    });
    
    console.log('[BOOK] Appointment created successfully:', appointment._id);
  } catch (createErr) {
    console.error('[BOOK] Failed to create appointment:', createErr.message);
    if (createErr.name === 'ValidationError') {
      const messages = Object.values(createErr.errors).map(e => e.message).join(', ');
      throw new ApiError(400, `Validation error: ${messages}`);
    }
    throw new ApiError(500, "Unable to book the appointment right now. Please try again.");
  }

  // 5. Create persistent notification for the doctor ONLY AFTER appointment is saved
  let notification = null;
  if (effectiveDoctorId && appointment) {
    try {
      notification = await createDoctorNotification({
        recipientDoctorId: effectiveDoctorId,
        recipientDoctorEmail: doctorEmail.toLowerCase(),
        type: "APPOINTMENT_REQUEST",
        title: "New Appointment Request",
        message: `${userName} requested an appointment for ${date} at ${time}.`,
        patientName: userName,
        patientEmail: userEmail,
        appointmentId: appointment._id,
        date,
        time,
      });

      // Real-time broadcast via Socket.io
      const io = req.app.get("io");
      if (io) {
        const notifPayload = {
          notification,
          appointmentId: appointment._id,
          recipientDoctorEmail: doctorEmail.toLowerCase(),
          recipientDoctorId: effectiveDoctorId,
          patientName: userName,
          date,
          time,
        };
        io.emit("new-notification", notifPayload);
        io.emit("new-appointment-request", notifPayload);
        io.to(`doctor_${doctorEmail.toLowerCase()}`).emit("new-notification", notifPayload);
      }
    } catch (notifErr) {
      console.error("[BOOK] Error creating doctor notification:", notifErr.message);
    }
  }

  return res.status(201).json(new ApiResponse(201, appointment, "Appointment booked successfully"));
});

// Get appointments for doctor by email or authenticated doctor
export const getDoctorAppointments = asyncHandler(async (req, res) => {
  const doctorEmail = req.doctor?.email || req.params.doctorEmail || req.query.doctorEmail;
  if (!doctorEmail) {
    throw new ApiError(400, "Doctor email or authentication is required");
  }

  const query = {
    $or: [
      { doctorEmail: doctorEmail.toLowerCase() },
      ...(req.doctor?._id ? [{ doctorId: req.doctor._id }] : [])
    ]
  };

  const appointments = await Appointment.find(query).sort({ date: -1, time: -1 });
  return res.status(200).json(new ApiResponse(200, appointments, "Doctor appointments fetched successfully"));
});

// Get single appointment by ID
export const getAppointmentById = asyncHandler(async (req, res) => {
  const { appointmentId } = req.params;
  const appointment = await Appointment.findById(appointmentId);
  if (!appointment) {
    throw new ApiError(404, "Appointment could not be found.");
  }
  return res.status(200).json(new ApiResponse(200, appointment, "Appointment fetched successfully"));
});

// Helper to verify doctor authorization for an appointment
const verifyDoctorAppointmentOwnership = (appointment, doctor, fallbackEmail) => {
  if (doctor) {
    const emailMatches = doctor.email && appointment.doctorEmail && doctor.email.toLowerCase() === appointment.doctorEmail.toLowerCase();
    const idMatches = doctor._id && appointment.doctorId && doctor._id.toString() === appointment.doctorId.toString();
    return emailMatches || idMatches;
  }
  if (fallbackEmail && appointment.doctorEmail) {
    return fallbackEmail.toLowerCase() === appointment.doctorEmail.toLowerCase();
  }
  return false;
};

// Confirm appointment (Doctor accepts pending appointment)
export const confirmAppointment = asyncHandler(async (req, res) => {
  const { appointmentId } = req.params;
  const authenticatedDoctor = req.doctor;
  const clientDoctorEmail = req.body?.doctorEmail || req.header("X-Doctor-Email");

  console.log('[CONFIRM] Processing appointment confirmation:', {
    appointmentId,
    authDoctorEmail: authenticatedDoctor?.email,
    authDoctorId: authenticatedDoctor?._id
  });

  // 1. Find the target appointment
  const appointment = await Appointment.findById(appointmentId);
  if (!appointment) {
    throw new ApiError(404, "Appointment could not be found.");
  }

  // 2. Enforce authorization: Authenticated doctor must own this appointment
  const isAuthorized = verifyDoctorAppointmentOwnership(appointment, authenticatedDoctor, clientDoctorEmail);
  if (!isAuthorized && authenticatedDoctor) {
    throw new ApiError(403, "You are not authorized to manage this appointment.");
  }

  // 3. Validate state transitions
  if (appointment.status === "cancelled") {
    throw new ApiError(409, "Cannot confirm a cancelled appointment.");
  }
  if (appointment.status === "completed") {
    throw new ApiError(409, "Cannot confirm an already completed appointment.");
  }
  if (appointment.status === "confirmed" || appointment.status === "approved") {
    // Idempotent: If already confirmed, return success without duplicate changes
    return res.status(200).json(new ApiResponse(200, appointment, "Appointment is already confirmed."));
  }

  // 4. Update status to confirmed
  appointment.status = "confirmed";
  if (!appointment.doctorId && authenticatedDoctor?._id) {
    appointment.doctorId = authenticatedDoctor._id;
  }
  await appointment.save();

  // 5. Ensure timeslot remains reserved for this appointment
  try {
    const docQuery = appointment.doctorId ? { _id: appointment.doctorId } : { email: appointment.doctorEmail.toLowerCase() };
    const doctorDoc = await Doctor.findOne(docQuery);
    if (doctorDoc) {
      await Timeslot.updateOne(
        { doctor: doctorDoc._id, date: appointment.date, "slots.time": appointment.time },
        { "$set": { "slots.$.booked": true, "slots.$.bookedBy": appointment.userEmail } }
      );
    }
  } catch (slotErr) {
    console.warn("[CONFIRM] Timeslot sync warning:", slotErr.message);
  }

  // 6. Resolve / mark existing appointment-request notifications as read for this doctor
  try {
    await Notification.updateMany(
      { appointmentId: appointment._id },
      { $set: { isRead: true } }
    );
  } catch (notifErr) {
    console.warn("[CONFIRM] Notification update warning:", notifErr.message);
  }

  // 7. Emit real-time Socket.io event for real-time dashboard and patient synchronization
  const io = req.app.get("io");
  if (io) {
    const statusPayload = {
      appointmentId: appointment._id,
      status: "confirmed",
      doctorEmail: appointment.doctorEmail,
      userEmail: appointment.userEmail,
      date: appointment.date,
      time: appointment.time
    };
    io.emit("appointment-status-updated", statusPayload);
    io.to(`appointment_${appointment._id}`).emit("appointment-confirmed", statusPayload);
  }

  console.log('[CONFIRM] Appointment confirmed successfully:', appointment._id);
  return res.status(200).json(new ApiResponse(200, appointment, "Appointment confirmed successfully"));
});

// Approve appointment (Alias for confirmation)
export const approveAppointment = confirmAppointment;

// Cancel appointment (Doctor or Patient rejects/cancels appointment)
export const cancelAppointment = asyncHandler(async (req, res) => {
  const { appointmentId } = req.params;
  const authenticatedDoctor = req.doctor;
  const { doctorEmail, userEmail, reason } = req.body;

  console.log('[CANCEL] Processing cancellation for:', {
    appointmentId,
    authDoctorEmail: authenticatedDoctor?.email,
    bodyUserEmail: userEmail,
    reason
  });

  // 1. Find the target appointment
  const appointment = await Appointment.findById(appointmentId);
  if (!appointment) {
    throw new ApiError(404, "Appointment could not be found.");
  }

  // 2. Enforce authorization
  const isDoctor = verifyDoctorAppointmentOwnership(appointment, authenticatedDoctor, doctorEmail);
  const isPatient = userEmail && appointment.userEmail && userEmail.toLowerCase() === appointment.userEmail.toLowerCase();

  if (!isDoctor && !isPatient && authenticatedDoctor) {
    throw new ApiError(403, "You are not authorized to cancel this appointment.");
  }

  // 3. Validate state transitions
  if (appointment.status === "completed") {
    throw new ApiError(400, "Cannot cancel an already completed appointment.");
  }
  if (appointment.status === "cancelled") {
    throw new ApiError(409, "This appointment is already cancelled.");
  }

  // 4. Update status to cancelled
  appointment.status = "cancelled";
  appointment.consultationNotes = reason 
    ? `Cancelled: ${reason}` 
    : (isPatient ? "Cancelled by patient" : "Cancelled by doctor");
  await appointment.save();

  // 5. Free the reserved timeslot so other patients can re-book it
  try {
    const docQuery = appointment.doctorId ? { _id: appointment.doctorId } : { email: appointment.doctorEmail.toLowerCase() };
    const doctorDoc = await Doctor.findOne(docQuery);
    if (doctorDoc) {
      await Timeslot.updateOne(
        { doctor: doctorDoc._id, date: appointment.date, "slots.time": appointment.time },
        { "$set": { "slots.$.booked": false, "slots.$.bookedBy": null } }
      );
      console.log('[CANCEL] Timeslot released for re-booking:', appointment.date, appointment.time);
    }
  } catch (err) {
    console.error("Failed to free timeslot on cancellation:", err);
  }

  // 6. Resolve notifications
  try {
    await Notification.updateMany(
      { appointmentId: appointment._id },
      { $set: { isRead: true } }
    );
  } catch (notifErr) {
    console.warn("[CANCEL] Notification update warning:", notifErr.message);
  }

  // 7. Emit real-time Socket.io event
  const io = req.app.get("io");
  if (io) {
    const statusPayload = {
      appointmentId: appointment._id,
      status: "cancelled",
      doctorEmail: appointment.doctorEmail,
      userEmail: appointment.userEmail,
      reason: appointment.consultationNotes
    };
    io.emit("appointment-status-updated", statusPayload);
    io.to(`appointment_${appointment._id}`).emit("appointment-cancelled", statusPayload);
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
