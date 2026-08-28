import jwt from "jsonwebtoken";
import { User } from "../models/User.models.js";
import { Admin } from "../models/Admin.models.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const DEFAULT_SECRET = "remedyease-secure-jwt-secret-fallback-key-2026";

/**
 * Verify Patient / User Authentication
 */
export const verifyUser = asyncHandler(async (req, res, next) => {
  try {
    const authHeader = req.header("Authorization") || req.header("authorization");
    let token = null;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.replace("Bearer ", "").trim();
    } else if (req.cookies?.accessToken || req.cookies?.userAccessToken) {
      token = req.cookies.accessToken || req.cookies.userAccessToken;
    }

    if (!token) {
      throw new ApiError(401, "Authentication required. Please log in.");
    }

    const secret = process.env.ACCESS_TOKEN_SECRET || process.env.JWT_SECRET || DEFAULT_SECRET;
    let decoded;
    try {
      decoded = jwt.verify(token, secret);
    } catch (err) {
      throw new ApiError(401, "Invalid or expired authentication token. Please log in again.");
    }

    if (!decoded || (!decoded._id && !decoded.id && !decoded.email)) {
      throw new ApiError(401, "Invalid token payload.");
    }

    const query = decoded._id
      ? { _id: decoded._id }
      : decoded.id
      ? { _id: decoded.id }
      : { email: decoded.email.toLowerCase() };

    const user = await User.findOne(query).select("-password -confirmPassword -refreshToken");

    if (!user) {
      throw new ApiError(401, "User account not found.");
    }

    if (user.isBlocked) {
      throw new ApiError(403, "Your account has been suspended. Please contact customer support.");
    }

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(401, error?.message || "Authentication failed.");
  }
});

/**
 * Verify Admin Authentication
 */
export const verifyAdmin = asyncHandler(async (req, res, next) => {
  try {
    const authHeader = req.header("Authorization") || req.header("authorization");
    let token = null;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.replace("Bearer ", "").trim();
    } else if (req.cookies?.accessToken || req.cookies?.adminToken) {
      token = req.cookies.accessToken || req.cookies.adminToken;
    }

    if (!token) {
      throw new ApiError(401, "Admin authentication required.");
    }

    const secret = process.env.ACCESS_TOKEN_SECRET || process.env.JWT_SECRET || DEFAULT_SECRET;
    let decoded;
    try {
      decoded = jwt.verify(token, secret);
    } catch (err) {
      throw new ApiError(401, "Invalid or expired admin token.");
    }

    if (!decoded || (!decoded._id && !decoded.email)) {
      throw new ApiError(401, "Invalid admin token payload.");
    }

    const authorizedAdminEmail = (process.env.AUTHORIZED_ADMIN_EMAIL || "ramitgoyal1987@gmail.com").trim().toLowerCase();

    if (decoded.email && decoded.email.toLowerCase() !== authorizedAdminEmail) {
      throw new ApiError(403, "Access denied: Unauthorized admin privilege.");
    }

    const adminQuery = decoded._id ? { _id: decoded._id } : { email: decoded.email.toLowerCase() };
    const admin = await Admin.findOne(adminQuery).select("-password -refreshToken");

    if (!admin) {
      throw new ApiError(401, "Admin profile not found.");
    }

    req.admin = admin;
    next();
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(401, error?.message || "Admin authorization failed.");
  }
});

/**
 * Optional User Auth: attaches req.user if token is present, continues otherwise
 */
export const optionalUserAuth = asyncHandler(async (req, res, next) => {
  try {
    const authHeader = req.header("Authorization") || req.header("authorization");
    let token = null;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.replace("Bearer ", "").trim();
    } else if (req.cookies?.accessToken || req.cookies?.userAccessToken) {
      token = req.cookies.accessToken || req.cookies.userAccessToken;
    }

    if (token) {
      const secret = process.env.ACCESS_TOKEN_SECRET || process.env.JWT_SECRET || DEFAULT_SECRET;
      const decoded = jwt.verify(token, secret);
      if (decoded && (decoded._id || decoded.email)) {
        const query = decoded._id ? { _id: decoded._id } : { email: decoded.email.toLowerCase() };
        const user = await User.findOne(query).select("-password -confirmPassword -refreshToken");
        if (user && !user.isBlocked) {
          req.user = user;
        }
      }
    }
  } catch (e) {
    // Ignore error for optional auth
  }
  next();
});
