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

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(express.static("public"));

app.use(cookieParser());

app.use((req, res, next) => {
  console.log("➡️ Incoming request:", req.method, req.url, "body:", req.body);
  console.log(
    "DEBUG:",
    req.method,
    req.url,
    req.headers["content-type"],
    req.body
  );
  next();
});
// import  routes
import userRouter from "./routes/user.routes.js";

// routes declaration
app.use("/api/v1/users", userRouter);

//imprt ai routes
import aiRouter from "./routes/ai.routes.js";

//router declaration
app.use("/api/v1/ai", aiRouter);

export { app };
