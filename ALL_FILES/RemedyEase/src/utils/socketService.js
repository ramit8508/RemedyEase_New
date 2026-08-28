import { io } from "socket.io-client";

// Verified Production Doctor Backend Hosting (Persistent WebSocket Server)
const DEFAULT_PROD_DOCTOR_BACKEND = "https://remedyease-new-doctor.onrender.com";
const DEFAULT_DEV_DOCTOR_BACKEND = "http://localhost:5001";

/**
 * Resolves the correct Socket.IO backend URL.
 * NEVER connects to Vercel frontend origin because Vercel does not host WebSockets.
 */
export function getSocketServerUrl() {
  // 1. Explicit socket URL from env
  const envSocketUrl = import.meta.env.VITE_SOCKET_URL;
  if (envSocketUrl && typeof envSocketUrl === "string" && envSocketUrl.trim() !== "") {
    return envSocketUrl.trim();
  }

  // 2. Doctor backend URL from env
  const envDoctorUrl = import.meta.env.VITE_DOCTOR_BACKEND_URL;
  if (envDoctorUrl && typeof envDoctorUrl === "string" && envDoctorUrl.trim() !== "") {
    const trimmed = envDoctorUrl.trim();
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
      return trimmed;
    }
  }

  // 3. In local development mode, use local doctor backend
  if (import.meta.env.DEV) {
    return DEFAULT_DEV_DOCTOR_BACKEND;
  }

  // 4. In production deployment, use persistent Doctor backend deployment
  return DEFAULT_PROD_DOCTOR_BACKEND;
}

/**
 * Creates a configured Socket.IO client instance with bounded reconnects and clean diagnostics.
 */
export function createSocketClient(customOptions = {}) {
  const socketUrl = getSocketServerUrl();

  const options = {
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: 4,
    reconnectionDelay: 2000,
    reconnectionDelayMax: 8000,
    timeout: 12000,
    autoConnect: true,
    withCredentials: true,
    ...customOptions,
  };

  const socket = io(socketUrl, options);

  // Non-intrusive connection error diagnostics
  socket.on("connect_error", (error) => {
    // Only warn once if reconnection attempts are exhausted
    if (socket.io?._reconnectionAttempts && socket.io._reconnectionAttempts >= 4) {
      console.warn(
        `[RemedyEase Realtime] Socket server at ${socketUrl} is currently unavailable. Operating in HTTP fallback mode.`
      );
    }
  });

  return socket;
}
