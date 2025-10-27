import { Doctor } from "../models/Doctor.models.js";
import { Appointment } from "../models/Appointments.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendApprovalEmail, sendRejectionEmail } from "../utils/emailService.js";

// Get all doctors (for admin)
export const getAllDoctors = asyncHandler(async (req, res) => {
  const doctors = await Doctor.find().select("-password -refreshToken").sort({ createdAt: -1 });
  return res.status(200).json(new ApiResponse(200, doctors, "Doctors fetched successfully"));
});

// Get pending doctors
export const getPendingDoctors = asyncHandler(async (req, res) => {
  const doctors = await Doctor.find({ approvalStatus: 'pending' })
    .select("-password -refreshToken")
    .sort({ createdAt: -1 });
  return res.status(200).json(new ApiResponse(200, doctors, "Pending doctors fetched successfully"));
});

// Approve/Reject doctor
export const updateDoctorApproval = asyncHandler(async (req, res) => {
  const { doctorId } = req.params;
  const { approvalStatus, rejectionReason } = req.body;

  if (!['approved', 'rejected'].includes(approvalStatus)) {
    throw new ApiError(400, "Invalid approval status");
  }

  const updateData = { approvalStatus };
  if (approvalStatus === 'rejected' && rejectionReason) {
    updateData.rejectionReason = rejectionReason;
  }

  const doctor = await Doctor.findByIdAndUpdate(
    doctorId,
    updateData,
    { new: true }
  ).select("-password -refreshToken");

  if (!doctor) {
    throw new ApiError(404, "Doctor not found");
  }

  // Send email notification
  try {
    if (approvalStatus === 'approved') {
      await sendApprovalEmail(doctor.email, doctor.fullname);
      console.log(`Approval email sent to ${doctor.email}`);
    } else if (approvalStatus === 'rejected') {
      await sendRejectionEmail(doctor.email, doctor.fullname, rejectionReason || 'Not specified');
      console.log(`Rejection email sent to ${doctor.email}`);
    }
  } catch (emailError) {
    console.error('Error sending email notification:', emailError);
    // Don't fail the approval/rejection if email fails
  }

  return res.status(200).json(
    new ApiResponse(200, doctor, `Doctor ${approvalStatus} successfully. Email notification sent.`)
  );
});

// Block/Unblock doctor
export const toggleDoctorBlock = asyncHandler(async (req, res) => {
  const { doctorId } = req.params;
  const { isBlocked } = req.body;

  const doctor = await Doctor.findByIdAndUpdate(
    doctorId,
    { isBlocked: isBlocked },
    { new: true }
  ).select("-password -refreshToken");

  if (!doctor) {
    throw new ApiError(404, "Doctor not found");
  }

  return res.status(200).json(
    new ApiResponse(200, doctor, `Doctor ${isBlocked ? 'blocked' : 'unblocked'} successfully`)
  );
});

// Get all appointments (for admin)
export const getAllAppointments = asyncHandler(async (req, res) => {
  const appointments = await Appointment.find().sort({ createdAt: -1 });
  return res.status(200).json(new ApiResponse(200, appointments, "All appointments fetched successfully"));
});

// Cancel appointment (admin)
export const cancelAppointment = asyncHandler(async (req, res) => {
  const { appointmentId } = req.params;
  const { reason } = req.body;

  const appointment = await Appointment.findByIdAndUpdate(
    appointmentId,
    { 
      status: 'cancelled',
      consultationNotes: reason || 'Cancelled by admin'
    },
    { new: true }
  );

  if (!appointment) {
    throw new ApiError(404, "Appointment not found");
  }

  return res.status(200).json(
    new ApiResponse(200, appointment, "Appointment cancelled successfully")
  );
});

// Get all prescriptions (admin)
export const getAllPrescriptions = asyncHandler(async (req, res) => {
  const appointments = await Appointment.find({ 
    prescriptionFile: { $exists: true, $ne: null } 
  }).sort({ prescriptionUploadedAt: -1 });

  return res.status(200).json(
    new ApiResponse(200, appointments, "All prescriptions fetched successfully")
  );
});

// Get doctor statistics
export const getDoctorStats = asyncHandler(async (req, res) => {
  const total = await Doctor.countDocuments();
  const pending = await Doctor.countDocuments({ approvalStatus: 'pending' });
  const approved = await Doctor.countDocuments({ approvalStatus: 'approved' });
  const rejected = await Doctor.countDocuments({ approvalStatus: 'rejected' });
  const blocked = await Doctor.countDocuments({ isBlocked: true });

  return res.status(200).json(
    new ApiResponse(200, { total, pending, approved, rejected, blocked }, "Doctor stats fetched")
  );
});

// Get appointment statistics
export const getAppointmentStats = asyncHandler(async (req, res) => {
  const total = await Appointment.countDocuments();
  const pending = await Appointment.countDocuments({ status: 'pending' });
  const confirmed = await Appointment.countDocuments({ status: 'confirmed' });
  const completed = await Appointment.countDocuments({ status: 'completed' });
  const cancelled = await Appointment.countDocuments({ status: 'cancelled' });

  return res.status(200).json(
    new ApiResponse(200, { total, pending, confirmed, completed, cancelled }, "Appointment stats fetched")
  );
});

// Get prescription statistics
export const getPrescriptionStats = asyncHandler(async (req, res) => {
  const totalPrescriptions = await Appointment.countDocuments({ 
    prescriptionFile: { $exists: true, $ne: null } 
  });

  return res.status(200).json(
    new ApiResponse(200, { total: totalPrescriptions }, "Prescription stats fetched")
  );
});
