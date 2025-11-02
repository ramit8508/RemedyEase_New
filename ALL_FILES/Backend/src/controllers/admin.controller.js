import { Admin } from "../models/Admin.models.js";
import { User } from "../models/User.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Admin Login
export const adminLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  // Only allow this specific email to access admin panel
  const AUTHORIZED_ADMIN_EMAIL = "ramitgoyal1987@gmail.com";
  
  // Normalize email by trimming and converting to lowercase
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedAuthorizedEmail = AUTHORIZED_ADMIN_EMAIL.trim().toLowerCase();
  
  if (normalizedEmail !== normalizedAuthorizedEmail) {
    console.log(`Unauthorized admin login attempt: ${email}`);
    throw new ApiError(403, "Unauthorized access. You do not have admin privileges.");
  }

  const admin = await Admin.findOne({ email: normalizedEmail });

  if (!admin) {
    console.log(`Admin not found for email: ${normalizedEmail}`);
    throw new ApiError(401, "Invalid credentials");
  }

  const isPasswordValid = await admin.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid credentials");
  }

  const accessToken = admin.generateAccessToken();
  const refreshToken = admin.generateRefreshToken();

  admin.refreshToken = refreshToken;
  await admin.save({ validateBeforeSave: false });

  const loggedInAdmin = await Admin.findById(admin._id).select("-password -refreshToken");

  const options = {
    httpOnly: true,
    secure: true
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          admin: loggedInAdmin,
          accessToken,
          refreshToken
        },
        "Admin logged in successfully"
      )
    );
});

// Get All Users (for admin)
export const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find().select("-password -refreshToken").sort({ createdAt: -1 });
  return res.status(200).json(new ApiResponse(200, users, "Users fetched successfully"));
});

// Block/Unblock User
export const toggleUserBlock = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { isBlocked } = req.body;

  const user = await User.findByIdAndUpdate(
    userId,
    { isBlocked: isBlocked },
    { new: true }
  ).select("-password -refreshToken");

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return res.status(200).json(
    new ApiResponse(200, user, `User ${isBlocked ? 'blocked' : 'unblocked'} successfully`)
  );
});

// Get Admin Stats
export const getAdminStats = asyncHandler(async (req, res) => {
  try {
    // Count total users
    const totalUsers = await User.countDocuments();
    const blockedUsers = await User.countDocuments({ isBlocked: true });
    const activeUsers = totalUsers - blockedUsers;

    return res.status(200).json(
      new ApiResponse(200, {
        totalUsers,
        blockedUsers,
        activeUsers
      }, "Admin stats fetched successfully")
    );
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    throw new ApiError(500, "Failed to fetch admin statistics");
  }
});

// Change Admin Password
export const changeAdminPassword = asyncHandler(async (req, res) => {
  const { email, currentPassword, newPassword } = req.body;

  if (!email || !currentPassword || !newPassword) {
    throw new ApiError(400, "Email, current password, and new password are required");
  }

  // Verify authorized admin email
  const AUTHORIZED_ADMIN_EMAIL = "ramitgoyal1987@gmail.com";
  const normalizedEmail = email.trim().toLowerCase();
  
  if (normalizedEmail !== AUTHORIZED_ADMIN_EMAIL.toLowerCase()) {
    console.log(`Unauthorized password change attempt: ${email}`);
    throw new ApiError(403, "Unauthorized access. Only authorized admin can change password.");
  }

  // Password validation
  if (newPassword.length < 8) {
    throw new ApiError(400, "New password must be at least 8 characters long");
  }

  if (newPassword === currentPassword) {
    throw new ApiError(400, "New password must be different from current password");
  }

  // Find admin
  const admin = await Admin.findOne({ email: normalizedEmail });

  if (!admin) {
    throw new ApiError(404, "Admin account not found");
  }

  // Verify current password
  const isPasswordValid = await admin.isPasswordCorrect(currentPassword);

  if (!isPasswordValid) {
    throw new ApiError(401, "Current password is incorrect");
  }

  // Update password (will be hashed by pre-save hook)
  admin.password = newPassword;
  await admin.save();

  console.log(`✅ Password changed successfully for admin: ${email}`);

  return res.status(200).json(
    new ApiResponse(200, {}, "Password changed successfully. Please login again with new password.")
  );
});
