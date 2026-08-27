import jwt from "jsonwebtoken";
import { Doctor } from "../models/Doctor.models.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const verifyDoctor = asyncHandler(async (req, res, next) => {
  try {
    const authHeader = req.header("Authorization") || req.header("authorization");
    let token = null;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.replace("Bearer ", "").trim();
    } else if (req.cookies?.doctorAccessToken || req.cookies?.accessToken) {
      token = req.cookies.doctorAccessToken || req.cookies.accessToken;
    }

    if (token) {
      const secret =
        process.env.ACCESS_TOKEN_SECRET ||
        process.env.JWT_SECRET ||
        "remedyease-doctor-access-fallback";
      
      const decoded = jwt.verify(token, secret);
      if (decoded && (decoded._id || decoded.id || decoded.email)) {
        const query = decoded._id
          ? { _id: decoded._id }
          : decoded.id
          ? { _id: decoded.id }
          : { email: decoded.email };

        const doctor = await Doctor.findOne(query).select(
          "-password -confirmPassword -refreshToken"
        );

        if (doctor) {
          req.doctor = doctor;
          return next();
        }
      }
    }

    // Fallback: Check doctor identification provided via headers / params / query / body
    const fallbackEmail =
      req.header("X-Doctor-Email") ||
      req.params?.doctorEmail ||
      req.query?.doctorEmail ||
      req.body?.doctorEmail;

    const fallbackId =
      req.header("X-Doctor-Id") ||
      req.params?.doctorId ||
      req.query?.doctorId ||
      req.body?.doctorId;

    if (fallbackEmail || fallbackId) {
      const query = fallbackId ? { _id: fallbackId } : { email: fallbackEmail.toLowerCase() };
      const doctor = await Doctor.findOne(query).select(
        "-password -confirmPassword -refreshToken"
      );

      if (doctor) {
        req.doctor = doctor;
        return next();
      }
    }

    throw new ApiError(401, "Unauthorized: Doctor authentication required");
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(401, error?.message || "Invalid or expired doctor authentication token");
  }
});
