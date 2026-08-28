import { Admin } from "../models/Admin.models.js";
import { User } from "../models/User.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getAuthorizedAdminEmail = () => {
  return (process.env.AUTHORIZED_ADMIN_EMAIL || "ramitgoyal1987@gmail.com").trim().toLowerCase();
};

// Admin Login
export const adminLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  const normalizedEmail = email.trim().toLowerCase();
  const authorizedAdminEmail = getAuthorizedAdminEmail();

  if (normalizedEmail !== authorizedAdminEmail) {
    throw new ApiError(403, "Access denied: You do not have admin privileges.");
  }

  const admin = await Admin.findOne({ email: normalizedEmail });
  if (!admin) {
    throw new ApiError(401, "Invalid administrative credentials");
  }

  const isPasswordValid = await admin.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid administrative credentials");
  }

  const accessToken = admin.generateAccessToken();
  const refreshToken = admin.generateRefreshToken();

  admin.refreshToken = refreshToken;
  await admin.save({ validateBeforeSave: false });

  const loggedInAdmin = await Admin.findById(admin._id).select("-password -refreshToken");

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("adminToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(
      new ApiResponse(
        200,
        {
          admin: loggedInAdmin,
          accessToken,
          refreshToken,
        },
        "Admin logged in successfully"
      )
    );
});

// Admin Logout
export const adminLogout = asyncHandler(async (req, res) => {
  if (req.admin?._id) {
    await Admin.findByIdAndUpdate(req.admin._id, { $unset: { refreshToken: 1 } });
  }

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  };

  return res
    .status(200)
    .clearCookie("accessToken", cookieOptions)
    .clearCookie("adminToken", cookieOptions)
    .clearCookie("refreshToken", cookieOptions)
    .json(new ApiResponse(200, {}, "Admin logged out successfully"));
});

// Get All Users (for admin)
export const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find().select("-password -confirmPassword -refreshToken").sort({ createdAt: -1 });
  return res.status(200).json(new ApiResponse(200, users, "Users fetched successfully"));
});

// Block/Unblock User
export const toggleUserBlock = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { isBlocked } = req.body;

  if (typeof isBlocked !== "boolean") {
    throw new ApiError(400, "isBlocked boolean status is required");
  }

  const user = await User.findByIdAndUpdate(
    userId,
    { isBlocked: isBlocked },
    { new: true }
  ).select("-password -confirmPassword -refreshToken");

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return res.status(200).json(
    new ApiResponse(200, user, `User account ${isBlocked ? "suspended" : "reactivated"} successfully`)
  );
});

// Get Admin Stats
export const getAdminStats = asyncHandler(async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const blockedUsers = await User.countDocuments({ isBlocked: true });
    const activeUsers = totalUsers - blockedUsers;

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          totalUsers,
          blockedUsers,
          activeUsers,
        },
        "Admin statistics fetched successfully"
      )
    );
  } catch (error) {
    console.error("Error fetching admin stats:", error.message);
    throw new ApiError(500, "Failed to fetch admin statistics");
  }
});

// Change Admin Password
export const changeAdminPassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const adminId = req.admin._id;

  if (!currentPassword || !newPassword) {
    throw new ApiError(400, "Current password and new password are required");
  }

  if (newPassword.length < 8) {
    throw new ApiError(400, "New password must be at least 8 characters long");
  }

  if (newPassword === currentPassword) {
    throw new ApiError(400, "New password must be different from current password");
  }

  const admin = await Admin.findById(adminId);
  if (!admin) {
    throw new ApiError(404, "Admin account not found");
  }

  const isPasswordValid = await admin.isPasswordCorrect(currentPassword);
  if (!isPasswordValid) {
    throw new ApiError(401, "Current password is incorrect");
  }

  admin.password = newPassword;
  await admin.save();

  return res.status(200).json(
    new ApiResponse(200, {}, "Password updated successfully. Please log in with your new password.")
  );
});
