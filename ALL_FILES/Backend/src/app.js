import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { ApiError } from "./utils/ApiError.js";

const app = express();

// --- Standard Middleware ---
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "*",
    credentials: true,
  })
);
app.use(express.json({ limit: "16mb" }));
app.use(express.urlencoded({ extended: true, limit: "16mb" }));
app.use(express.static("public"));
app.use(cookieParser());

// --- Route Imports ---
// CRITICAL: These paths must exactly match your file system.
// It expects files at:
// src/routes/user.routes.js
// src/routes/Ai.routes.js
import userRouter from "./routes/user.routes.js";
import aiRouter from "./routes/Ai.routes.js";

// --- Route Declarations ---
app.use("/api/v1/users", userRouter);
app.use("/api/v1/ai", aiRouter);

// Health check for the root URL
app.get("/", (req, res) => {
  res.status(200).json({ message: "RemedyEase User Backend is responsive!" });
});

// --- FINAL ERROR HANDLING MIDDLEWARE ---
// This must be the LAST `app.use()` call in your file.
app.use((err, req, res, next) => {
  // If it's a known error we created, send a clean JSON response.
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.errors || [],
    });
  }

  // For any other unexpected errors, log it and send a generic 500 error.
  console.error("UNEXPECTED SERVER ERROR:", err);
  return res.status(500).json({
    success: false,
    message: "An internal server error occurred.",
  });
});

export { app };