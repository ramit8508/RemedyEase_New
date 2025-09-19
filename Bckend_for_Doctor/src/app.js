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
app.use("/api/v1/ais", AiRouter);

import appointmentRoutes from "./routes/Appointment.routes.js";
app.use("/api/v1/appointments", appointmentRoutes);

export { app };