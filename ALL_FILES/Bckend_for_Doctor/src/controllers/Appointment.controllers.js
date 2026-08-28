import { Appointment } from "../models/Appointments.models.js";
import { Timeslot } from "../models/Timeslot.models.js";
import { Doctor } from "../models/Doctor.models.js";
import { Notification } from "../models/Notification.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/Cloudinary.js";
import { createDoctorNotification } from "./Notification.controllers.js";

function sanitizeString(str, maxLen = 300) {
  if (typeof str !== "string") return "";
  return str.replace(/<[^>]*>/g, "").trim().slice(0, maxLen);
}

// 1. Book appointment (Patient)
export const bookAppointment = asyncHandler(async (req, res) => {
  const { doctorEmail, doctorName, date, time, userEmail, userName, symptoms, doctorId } = req.body;

  if (!doctorEmail || !date || !time || !userEmail || !userName) {
    throw new ApiError(400, "All fields (doctor, date, time, patient information) are required");
  }

  const cleanDocEmail = doctorEmail.trim().toLowerCase();
  const cleanUserEmail = userEmail.trim().toLowerCase();
  const cleanDate = sanitizeString(date, 20);
  const cleanTime = sanitizeString(time, 20);
  const cleanUserName = sanitizeString(userName, 100);
  const cleanSymptoms = sanitizeString(symptoms || "General Consultation", 500);

  // 1. Identify the doctor
  let doctorDoc = null;
  if (doctorId) {
    doctorDoc = await Doctor.findById(doctorId);
  }
  if (!doctorDoc && cleanDocEmail) {
    doctorDoc = await Doctor.findOne({ email: cleanDocEmail });
  }

  if (!doctorDoc) {
    throw new ApiError(404, "Selected doctor could not be found.");
  }

  if (doctorDoc.isBlocked || doctorDoc.approvalStatus !== "approved") {
    throw new ApiError(400, "Selected doctor is currently not accepting appointments.");
  }

  const effectiveDoctorId = doctorDoc._id;
  const effectiveDoctorName = doctorDoc.fullname || doctorName || "Doctor";

  // 2. Validate and reserve the doctor-published timeslot
  const timeslotDoc = await Timeslot.findOne({
    doctor: effectiveDoctorId,
    date: cleanDate,
  });

  if (timeslotDoc && Array.isArray(timeslotDoc.slots) && timeslotDoc.slots.length > 0) {
    const slotIndex = timeslotDoc.slots.findIndex((s) => s.time === cleanTime || s === cleanTime);

    if (slotIndex === -1) {
      throw new ApiError(400, "The selected time slot was not published by this doctor.");
    }

    const slot = timeslotDoc.slots[slotIndex];
    const isAlreadyBooked = typeof slot === "object" ? slot.booked : false;

    if (isAlreadyBooked) {
      throw new ApiError(400, "This time slot is already booked. Please choose another available slot.");
    }

    // Atomically mark slot as booked
    if (typeof slot === "object") {
      timeslotDoc.slots[slotIndex].booked = true;
      timeslotDoc.slots[slotIndex].bookedBy = cleanUserEmail;
    } else {
      timeslotDoc.slots[slotIndex] = {
        time: slot,
        booked: true,
        bookedBy: cleanUserEmail,
      };
    }

    await timeslotDoc.save();
  }

  // 3. Prevent duplicate active appointments
  const existingAppt = await Appointment.findOne({
    doctorEmail: cleanDocEmail,
    userEmail: cleanUserEmail,
    date: cleanDate,
    time: cleanTime,
    status: { $in: ["pending", "confirmed", "approved"] },
  });

  if (existingAppt) {
    throw new ApiError(400, "You already have an active appointment scheduled for this time slot.");
  }

  // 4. Create the appointment
  const appointment = await Appointment.create({
    doctorId: effectiveDoctorId,
    doctorEmail: cleanDocEmail,
    doctorName: effectiveDoctorName,
    userEmail: cleanUserEmail,
    userName: cleanUserName,
    date: cleanDate,
    time: cleanTime,
    symptoms: cleanSymptoms,
    status: "pending",
  });

  // 5. Create notification for the doctor
  try {
    const notification = await createDoctorNotification({
      recipientDoctorId: effectiveDoctorId,
      recipientDoctorEmail: cleanDocEmail,
      type: "APPOINTMENT_REQUEST",
      title: "New Appointment Request",
      message: `${cleanUserName} requested an appointment for ${cleanDate} at ${cleanTime}.`,
      patientName: cleanUserName,
      patientEmail: cleanUserEmail,
      appointmentId: appointment._id,
      date: cleanDate,
      time: cleanTime,
    });

    const io = req.app.get("io");
    if (io) {
      const notifPayload = {
        notification,
        appointmentId: appointment._id,
        recipientDoctorEmail: cleanDocEmail,
        recipientDoctorId: effectiveDoctorId,
        patientName: cleanUserName,
        date: cleanDate,
        time: cleanTime,
      };
      io.emit("new-notification", notifPayload);
      io.emit("new-appointment-request", notifPayload);
      io.to(`doctor_${cleanDocEmail}`).emit("new-notification", notifPayload);
    }
  } catch (notifErr) {
    console.warn("[Appointment Controller] Notification creation warning:", notifErr.message);
  }

  return res.status(201).json(new ApiResponse(201, appointment, "Appointment booked successfully"));
});

// 2. Get appointments for doctor (Protected by verifyDoctor)
export const getDoctorAppointments = asyncHandler(async (req, res) => {
  const authenticatedDoctor = req.doctor;
  const requestedEmail = req.params.doctorEmail?.toLowerCase()?.trim();

  // IDOR Protection: Doctor can only access their own appointments
  if (authenticatedDoctor && requestedEmail && authenticatedDoctor.email.toLowerCase() !== requestedEmail) {
    throw new ApiError(403, "Access denied: You cannot view appointments of another doctor.");
  }

  const effectiveDoctorEmail = authenticatedDoctor?.email?.toLowerCase() || requestedEmail;
  if (!effectiveDoctorEmail) {
    throw new ApiError(400, "Doctor authentication is required");
  }

  const query = {
    $or: [
      { doctorEmail: effectiveDoctorEmail },
      ...(authenticatedDoctor?._id ? [{ doctorId: authenticatedDoctor._id }] : []),
    ],
  };

  const appointments = await Appointment.find(query).sort({ date: -1, time: -1 });
  return res.status(200).json(new ApiResponse(200, appointments, "Doctor appointments fetched successfully"));
});

// 3. Get single appointment by ID (Protected by verifyAppointmentParticipant)
export const getAppointmentById = asyncHandler(async (req, res) => {
  const appointment = req.appointment;
  if (!appointment) {
    throw new ApiError(404, "Appointment could not be found.");
  }
  return res.status(200).json(new ApiResponse(200, appointment, "Appointment fetched successfully"));
});

// Helper to check doctor ownership
const isDoctorOwner = (appointment, doctor, fallbackEmail) => {
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

// 4. Confirm appointment (Doctor accepts pending appointment)
export const confirmAppointment = asyncHandler(async (req, res) => {
  const { appointmentId } = req.params;
  const authenticatedDoctor = req.doctor;
  const clientDoctorEmail = req.body?.doctorEmail || req.header("X-Doctor-Email");

  const appointment = await Appointment.findById(appointmentId);
  if (!appointment) {
    throw new ApiError(404, "Appointment could not be found.");
  }

  // Enforce doctor ownership
  if (!isDoctorOwner(appointment, authenticatedDoctor, clientDoctorEmail)) {
    throw new ApiError(403, "Access denied: You are not authorized to manage this appointment.");
  }

  if (appointment.status === "cancelled") {
    throw new ApiError(409, "Cannot confirm a cancelled appointment.");
  }
  if (appointment.status === "completed") {
    throw new ApiError(409, "Cannot confirm an already completed appointment.");
  }
  if (appointment.status === "confirmed" || appointment.status === "approved") {
    return res.status(200).json(new ApiResponse(200, appointment, "Appointment is already confirmed."));
  }

  appointment.status = "confirmed";
  if (!appointment.doctorId && authenticatedDoctor?._id) {
    appointment.doctorId = authenticatedDoctor._id;
  }
  await appointment.save();

  // Mark timeslot as booked
  try {
    const docQuery = appointment.doctorId ? { _id: appointment.doctorId } : { email: appointment.doctorEmail.toLowerCase() };
    const doctorDoc = await Doctor.findOne(docQuery);
    if (doctorDoc) {
      await Timeslot.updateOne(
        { doctor: doctorDoc._id, date: appointment.date, "slots.time": appointment.time },
        { $set: { "slots.$.booked": true, "slots.$.bookedBy": appointment.userEmail } }
      );
    }
  } catch (slotErr) {
    console.warn("[Appointment Controller] Timeslot sync warning:", slotErr.message);
  }

  // Mark notification read
  try {
    await Notification.updateMany({ appointmentId: appointment._id }, { $set: { isRead: true } });
  } catch (notifErr) {
    // Ignore
  }

  // Broadcast real-time Socket.io event
  const io = req.app.get("io");
  if (io) {
    const statusPayload = {
      appointmentId: appointment._id,
      status: "confirmed",
      doctorEmail: appointment.doctorEmail,
      userEmail: appointment.userEmail,
      date: appointment.date,
      time: appointment.time,
    };
    io.emit("appointment-status-updated", statusPayload);
    io.to(`appointment_${appointment._id}`).emit("appointment-confirmed", statusPayload);
  }

  return res.status(200).json(new ApiResponse(200, appointment, "Appointment confirmed successfully"));
});

export const approveAppointment = confirmAppointment;

// 5. Cancel appointment (Doctor or Patient)
export const cancelAppointment = asyncHandler(async (req, res) => {
  const { appointmentId } = req.params;
  const authenticatedDoctor = req.doctor;
  const { doctorEmail, userEmail, reason } = req.body;

  const appointment = await Appointment.findById(appointmentId);
  if (!appointment) {
    throw new ApiError(404, "Appointment could not be found.");
  }

  const isDoc = isDoctorOwner(appointment, authenticatedDoctor, doctorEmail);
  const isPat = userEmail && appointment.userEmail && userEmail.toLowerCase() === appointment.userEmail.toLowerCase();

  if (!isDoc && !isPat) {
    throw new ApiError(403, "Access denied: You are not authorized to cancel this appointment.");
  }

  if (appointment.status === "completed") {
    throw new ApiError(400, "Cannot cancel an already completed appointment.");
  }
  if (appointment.status === "cancelled") {
    throw new ApiError(409, "This appointment is already cancelled.");
  }

  appointment.status = "cancelled";
  appointment.consultationNotes = reason
    ? `Cancelled: ${sanitizeString(reason, 200)}`
    : isPat
    ? "Cancelled by patient"
    : "Cancelled by doctor";
  await appointment.save();

  // Free the timeslot
  try {
    const docQuery = appointment.doctorId ? { _id: appointment.doctorId } : { email: appointment.doctorEmail.toLowerCase() };
    const doctorDoc = await Doctor.findOne(docQuery);
    if (doctorDoc) {
      await Timeslot.updateOne(
        { doctor: doctorDoc._id, date: appointment.date, "slots.time": appointment.time },
        { $set: { "slots.$.booked": false, "slots.$.bookedBy": null } }
      );
    }
  } catch (err) {
    console.error("Failed to free timeslot on cancellation:", err.message);
  }

  // Resolve notifications
  try {
    await Notification.updateMany({ appointmentId: appointment._id }, { $set: { isRead: true } });
  } catch (notifErr) {
    // Ignore
  }

  // Socket.io event
  const io = req.app.get("io");
  if (io) {
    const statusPayload = {
      appointmentId: appointment._id,
      status: "cancelled",
      doctorEmail: appointment.doctorEmail,
      userEmail: appointment.userEmail,
      reason: appointment.consultationNotes,
    };
    io.emit("appointment-status-updated", statusPayload);
    io.to(`appointment_${appointment._id}`).emit("appointment-cancelled", statusPayload);
  }

  return res.status(200).json(new ApiResponse(200, appointment, "Appointment cancelled successfully"));
});

// 6. Get appointments for user by email
export const getUserAppointments = asyncHandler(async (req, res) => {
  const { userEmail } = req.params;
  const cleanEmail = userEmail?.trim()?.toLowerCase();

  const appointments = await Appointment.find({ userEmail: cleanEmail }).sort({
    date: -1,
    time: -1,
  });

  return res.status(200).json(new ApiResponse(200, appointments, "User appointments fetched"));
});

// 7. Get consultation history for doctor (Protected by verifyDoctor)
export const getDoctorConsultationHistory = asyncHandler(async (req, res) => {
  const { doctorEmail } = req.params;
  const authenticatedDoctor = req.doctor;

  const targetEmail = (authenticatedDoctor?.email || doctorEmail)?.toLowerCase()?.trim();
  if (!targetEmail) {
    throw new ApiError(400, "Doctor email is required");
  }

  const consultations = await Appointment.find({
    doctorEmail: targetEmail,
  }).sort({ createdAt: -1 });

  return res.status(200).json(new ApiResponse(200, consultations, "Consultation history fetched successfully"));
});

// 8. Add treatment details to appointment
export const addTreatmentDetails = asyncHandler(async (req, res) => {
  const { appointmentId } = req.params;
  const authenticatedDoctor = req.doctor;
  const { treatment, treatedBy, treatmentDate, prescription, followUpRequired, followUpDate, consultationNotes } = req.body;

  const appointment = await Appointment.findById(appointmentId);
  if (!appointment) {
    throw new ApiError(404, "Appointment not found");
  }

  if (authenticatedDoctor && !isDoctorOwner(appointment, authenticatedDoctor)) {
    throw new ApiError(403, "Access denied: You are not the assigned doctor for this appointment.");
  }

  appointment.treatment = sanitizeString(treatment || "", 500);
  appointment.treatedBy = sanitizeString(treatedBy || authenticatedDoctor?.fullname || appointment.doctorName, 100);
  appointment.treatmentDate = treatmentDate || new Date().toISOString();
  if (prescription) appointment.prescription = sanitizeString(prescription, 500);
  appointment.followUpRequired = Boolean(followUpRequired);
  if (followUpDate) appointment.followUpDate = sanitizeString(followUpDate, 30);
  if (consultationNotes) appointment.consultationNotes = sanitizeString(consultationNotes, 1000);
  appointment.status = "completed";

  await appointment.save();
  return res.status(200).json(new ApiResponse(200, appointment, "Treatment details recorded successfully"));
});

// 9. Add symptoms to appointment
export const addSymptomsToAppointment = asyncHandler(async (req, res) => {
  const { appointmentId } = req.params;
  const { symptoms } = req.body;

  if (!symptoms) {
    throw new ApiError(400, "Symptoms text is required");
  }

  const appointment = await Appointment.findByIdAndUpdate(
    appointmentId,
    { symptoms: sanitizeString(symptoms, 500) },
    { new: true }
  );

  if (!appointment) {
    throw new ApiError(404, "Appointment not found");
  }

  return res.status(200).json(new ApiResponse(200, appointment, "Symptoms updated successfully"));
});

// 10. Upload Prescription (Protected by verifyDoctor)
export const uploadPrescription = asyncHandler(async (req, res) => {
  const { appointmentId } = req.params;
  const authenticatedDoctor = req.doctor;

  const appointment = await Appointment.findById(appointmentId);
  if (!appointment) {
    throw new ApiError(404, "Appointment not found");
  }

  if (authenticatedDoctor && !isDoctorOwner(appointment, authenticatedDoctor)) {
    throw new ApiError(403, "Access denied: Only the attending doctor can upload prescriptions.");
  }

  if (!req.file || !req.file.buffer) {
    throw new ApiError(400, "Prescription document or image file is required");
  }

  const cloudinaryResponse = await uploadOnCloudinary(req.file.buffer);
  if (!cloudinaryResponse || !cloudinaryResponse.secure_url) {
    throw new ApiError(500, "Prescription upload failed. Please try again.");
  }

  appointment.prescription = cloudinaryResponse.secure_url;
  appointment.prescriptionFile = cloudinaryResponse.secure_url;
  appointment.prescriptionUploadedAt = new Date();
  await appointment.save();

  return res.status(200).json(
    new ApiResponse(200, { prescriptionUrl: cloudinaryResponse.secure_url }, "Prescription uploaded successfully")
  );
});

// 11. Get Prescription (Protected by verifyAppointmentParticipant)
export const getPrescription = asyncHandler(async (req, res) => {
  const appointment = req.appointment;
  if (!appointment || (!appointment.prescription && !appointment.prescriptionFile)) {
    throw new ApiError(404, "Prescription not found for this appointment.");
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        prescriptionUrl: appointment.prescription || appointment.prescriptionFile,
        appointmentId: appointment._id,
        doctorName: appointment.doctorName,
        date: appointment.date,
      },
      "Prescription fetched successfully"
    )
  );
});
