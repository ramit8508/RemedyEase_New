import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
// This import is crucial for the error handler to work correctly.
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
app.use(express.urlencoded({ extended: true, limit: "32mb" }));
app.use(express.static("public"));
app.use(cookieParser());

// --- Route Imports ---
import doctorRouter from "./routes/Doctor.routes.js";
import aiRouter from "./routes/Ai.routes.js";
import appointmentRouter from "./routes/Appointment.routes.js";
import liveFeaturesRouter from "./routes/LiveFeatures.routes.js";

// --- Route Declarations ---
app.use("/api/v1/doctors", doctorRouter);
app.use("/api/v1/doctor-ai", aiRouter);
app.use("/api/v1/appointments", appointmentRouter);
app.use("/api/v1/live", liveFeaturesRouter);


app.get("/", (req, res) => {
  res.status(200).json({ message: "RemedyEase Doctor Backend is responsive!" });
});


app.use((err, req, res, next) => {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.errors || [],
    });
  }


  console.error("UNEXPECTED DOCTOR BACKEND ERROR:", err);
  return res.status(500).json({
    success: false,
    message: "An internal server error occurred on the doctor service.",
  });
});

export { app };
