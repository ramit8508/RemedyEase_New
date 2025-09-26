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

// NOTE: The "/api/v1/live" route has been removed. 
// Live features are handled by the Doctor Backend, and the frontend
// communicates with it directly via the proxy/rewrite rules.

// Health check route
app.get("/", (req, res) => {
  res.status(200).json({ message: "RemedyEase User Backend is running!" });
});

export { app };
