import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { ApiError } from "./utils/ApiError.js";

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN || "*", credentials: true }));
app.use(express.json({ limit: "16mb" }));
app.use(express.urlencoded({ extended: true, limit: "16mb" }));
app.use(express.static("public"));
app.use(cookieParser());

import userRouter from "./routes/user.routes.js";
import aiRouter from "./routes/Ai.routes.js";

app.use("/api/v1/users", userRouter);
app.use("/api/v1/ai", aiRouter);

app.get("/", (req, res) => {
  res.status(200).json({ message: "RemedyEase User Backend is responsive!" });
});

// Final Error Handling Middleware
app.use((err, req, res, next) => {
    if (err instanceof ApiError) {
        return res.status(err.statusCode).json({
            success: false,
            message: err.message,
            errors: err.errors || []
        });
    }
    console.error("UNEXPECTED ERROR:", err);
    return res.status(500).json({
        success: false,
        message: "Internal Server Error"
    });
});

export { app };