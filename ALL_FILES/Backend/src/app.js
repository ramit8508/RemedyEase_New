import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

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

// --- ROUTES ---
import userRouter from "./routes/user.routes.js";
import aiRouter from "./routes/Ai.routes.js";

// Routes Declaration
app.use("/api/v1/users", userRouter);
app.use("/api/v1/ai", aiRouter);

// Health check route
app.get("/", (req, res) => {
  res.status(200).json({ message: "RemedyEase User Backend is responsive!" });
});

// --- FINAL ERROR HANDLING MIDDLEWARE ---
// This is the crucial new addition. It will catch all errors
// thrown by your controllers and format them into a clean JSON response.
// It MUST be the last middleware added to the app.
app.use((err, req, res, next) => {
    // Check if the error is an instance of our custom ApiError
    if (err instanceof ApiError) {
        return res.status(err.statusCode).json({
            success: false,
            message: err.message,
            errors: err.errors
        });
    }

    // For any other unexpected errors, send a generic 500 response
    console.error("An unexpected error occurred:", err);
    return res.status(500).json({
        success: false,
        message: "Internal Server Error"
    });
});

export { app };

