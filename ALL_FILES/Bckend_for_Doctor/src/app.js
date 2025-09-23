console.log("[SERVER LOG] 1. app.js is running.");
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);
import dotenv from "dotenv";
dotenv.config();

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(express.static("public"));
app.use(cookieParser());

app.use((req, res, next) => {
  console.log("DEBUG:", req.method, req.url, req.headers["content-type"], req.body);
  next();
});

// import routes
import DoctorRouter from "./routes/Doctor.routes.js";
app.use("/api/v1/doctors", DoctorRouter);

import AiRouter from "./routes/Ai.routes.js";
app.use("/api/v1/doctor-ai", AiRouter);

import appointmentRoutes from "./routes/Appointment.routes.js";
app.use("/api/v1/appointments", appointmentRoutes);

import liveFeaturesRoutes from "./routes/LiveFeatures.routes.js";
app.use("/api/v1/live", liveFeaturesRoutes);

// Add welcome route for root path
app.get("/", (req, res) => {
  res.json({
    message: "🩺 RemedyEase Doctor Backend API is running!",
    version: "1.0.0",
    endpoints: {
      doctors: "/api/v1/doctors",
      ai: "/api/v1/doctor-ai",
      appointments: "/api/v1/appointments",
      live: "/api/v1/live"
    },
    features: ["Real-time Chat", "Video Calls", "Appointment Management", "AI Assistance"],
    status: "✅ Doctor Server is healthy"
  });
});

export { app };