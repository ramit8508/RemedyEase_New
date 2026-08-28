import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { ApiError } from "./utils/ApiError.js";

const app = express();

// 1. Security Headers Middleware
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(self), microphone=(self), geolocation=()");
  if (process.env.NODE_ENV === "production") {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  }
  next();
});

// 2. Simple In-Memory Rate Limiting for Auth & AI Protection
const rateLimitMap = new Map();

function rateLimiter(options = { windowMs: 60 * 1000, maxRequests: 60, message: "Too many requests. Please wait." }) {
  return (req, res, next) => {
    const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "global";
    const key = `${ip}:${req.baseUrl || req.path}`;
    const now = Date.now();

    let record = rateLimitMap.get(key);
    if (!record || now - record.startTime > options.windowMs) {
      record = { count: 1, startTime: now };
      rateLimitMap.set(key, record);
    } else {
      record.count += 1;
    }

    // Cleanup periodically
    if (rateLimitMap.size > 1000) {
      for (const [k, v] of rateLimitMap) {
        if (now - v.startTime > 300000) rateLimitMap.delete(k);
      }
    }

    if (record.count > options.maxRequests) {
      return res.status(429).json({
        success: false,
        message: options.message,
      });
    }

    next();
  };
}

// 3. CORS Configuration
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:3000",
  "https://remedy-ease-new.vercel.app",
  process.env.CORS_ORIGIN,
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      const isAllowed = allowedOrigins.some((allowed) => {
        if (allowed === "*") return true;
        return allowed.toLowerCase() === origin.toLowerCase();
      });

      if (isAllowed) {
        callback(null, true);
      } else {
        callback(new Error("Request origin not allowed by CORS security policy"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Doctor-Email", "X-Doctor-Id"],
  })
);

app.use(express.json({ limit: "16mb" }));
app.use(express.urlencoded({ extended: true, limit: "16mb" }));
app.use(express.static("public"));
app.use(cookieParser());

// 4. Route Rate Limiters
const authLimiter = rateLimiter({ windowMs: 15 * 60 * 1000, maxRequests: 40, message: "Too many login attempts. Please try again in 15 minutes." });
const aiLimiter = rateLimiter({ windowMs: 60 * 1000, maxRequests: 30, message: "AI rate limit reached. Please wait a minute." });

// 5. Route Imports
import userRouter from "./routes/user.routes.js";
import aiRouter from "./routes/Ai.routes.js";
import adminRouter from "./routes/admin.routes.js";
import medicineRouter from "./routes/Medicine.routes.js";
import orderRouter from "./routes/Order.routes.js";

app.use("/api/v1/users/login", authLimiter);
app.use("/api/v1/admin/login", authLimiter);
app.use("/api/v1/ai", aiLimiter);

app.use("/api/v1/users", userRouter);
app.use("/api/v1/ai", aiRouter);
app.use("/api/v1/admin", adminRouter);
app.use("/api/v1/medicines", medicineRouter);
app.use("/api/v1/orders", orderRouter);

app.get("/", (req, res) => {
  res.status(200).json({ message: "RemedyEase User Backend is active and secure!" });
});

// 6. Safe Error Handling Middleware
app.use((err, req, res, next) => {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.errors || [],
    });
  }

  // Handle Mongoose / Cast errors
  if (err.name === "CastError") {
    return res.status(400).json({
      success: false,
      message: `Invalid format for resource identifier.`,
    });
  }

  // Prevent leaking internal errors
  const isDev = process.env.NODE_ENV !== "production";
  console.error("SERVER ERROR:", err.message);

  return res.status(500).json({
    success: false,
    message: isDev ? err.message : "An internal server error occurred. Please try again later.",
  });
});

export { app };