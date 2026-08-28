import React, { useState, useEffect, useRef, useCallback } from "react";
import { createSocketClient } from "../utils/socketService";
import {
  FiMic,
  FiMicOff,
  FiVideo,
  FiVideoOff,
  FiPhoneOff,
  FiMessageSquare,
  FiMaximize,
  FiMinimize,
  FiShare,
  FiRefreshCw,
  FiAlertCircle,
  FiGrid
} from "react-icons/fi";
import "../Css_for_all/VideoCall.css";

const SOCKET_URL = import.meta.env.VITE_DOCTOR_BACKEND_URL || "";
const API_BASE = import.meta.env.VITE_DOCTOR_BACKEND_URL || "";

const pcConfig = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
  ],
  iceCandidatePoolSize: 10,
};

export default function VideoCall({
  appointmentId,
  currentUser = {},
  userType = "doctor",
  onClose,
  roomId,
  userId: propUserId,
  userName: propUserName,
}) {
  const navigate = useNavigate();

  // Normalized current user credentials
  const effectiveUserId =
    currentUser?.id ||
    currentUser?._id ||
    propUserId ||
    currentUser?.email ||
    "guest";
  const effectiveUserName =
    currentUser?.fullname ||
    currentUser?.name ||
    propUserName ||
    currentUser?.email?.split("@")[0] ||
    (userType === "doctor" ? "Doctor" : "Patient");

  // State Management
  const [appointment, setAppointment] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const [remoteParticipants, setRemoteParticipants] = useState(new Map()); // socketId -> { socketId, userId, userName, userType, stream, isAudioMuted, isVideoMuted }

  // Media Controls
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [layoutMode, setLayoutMode] = useState("auto"); // "auto" | "grid" | "focus"

  // Connection & Diagnostics
  const [connectionStatus, setConnectionStatus] = useState("connecting"); // "connected" | "connecting" | "reconnecting" | "failed"
  const [statusMessage, setStatusMessage] = useState("Initializing media devices...");
  const [errorMessage, setErrorMessage] = useState(null);
  const [callDuration, setCallDuration] = useState(0);

  // DOM and WebRTC References
  const containerRef = useRef(null);
  const localVideoRef = useRef(null);
  const screenTrackRef = useRef(null);
  const cameraTrackRef = useRef(null);
  const localStreamRef = useRef(null);
  const socketRef = useRef(null);
  const peersRef = useRef(new Map()); // socketId -> { pc, candidateQueue: [] }
  const appointmentRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const isMountedRef = useRef(true);

  // Helper to get initials for fallback avatars
  const getInitials = (name = "") => {
    const parts = name.replace(/^Dr\.\s*/i, "").trim().split(/\s+/);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return (parts[0]?.[0] || "U").toUpperCase();
  };

  // Format call duration (MM:SS or HH:MM:SS)
  const formatDuration = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Start call timer when connected
  useEffect(() => {
    if (connectionStatus === "connected" && !timerIntervalRef.current) {
      timerIntervalRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, [connectionStatus]);

  // Clean peer creation helper
  const createPeerConnection = useCallback((targetSocketId, targetUserMeta = {}) => {
    if (peersRef.current.has(targetSocketId)) {
      const existing = peersRef.current.get(targetSocketId);
      if (existing.pc.signalingState !== "closed") {
        return existing.pc;
      }
    }

    console.log(`[WebRTC] Creating RTCPeerConnection for target: ${targetSocketId}`);
    const pc = new RTCPeerConnection(pcConfig);
    const peerEntry = {
      socketId: targetSocketId,
      pc,
      candidateQueue: [],
      meta: targetUserMeta,
    };
    peersRef.current.set(targetSocketId, peerEntry);

    // Add all local tracks to this peer connection
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current);
      });
    }

    // Handle remote track arrival
    pc.ontrack = (event) => {
      console.log(`[WebRTC] Received remote stream track from: ${targetSocketId}`, event.streams);
      const [remoteStream] = event.streams;
      if (!remoteStream) return;

      setRemoteParticipants((prev) => {
        const next = new Map(prev);
        const existing = next.get(targetSocketId) || {};
        next.set(targetSocketId, {
          ...existing,
          socketId: targetSocketId,
          userId: targetUserMeta.userId || existing.userId || targetSocketId,
          userName: targetUserMeta.userName || existing.userName || "Participant",
          userType: targetUserMeta.userType || existing.userType || "user",
          stream: remoteStream,
          isAudioMuted: false,
          isVideoMuted: false,
        });
        return next;
      });

      setConnectionStatus("connected");
      setStatusMessage("Connected");
      setErrorMessage(null);
    };

    // Send local ICE candidates to target peer
    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        const appt = appointmentRef.current;
        socketRef.current.emit("webrtc-ice-candidate", {
          callRoomId: appt?.callRoomId || roomId,
          candidate: event.candidate,
          targetSocketId,
        });
      }
    };

    // Monitor ICE connection state
    pc.oniceconnectionstatechange = () => {
      console.log(`[WebRTC] ICE state with ${targetSocketId}:`, pc.iceConnectionState);
      if (pc.iceConnectionState === "connected" || pc.iceConnectionState === "completed") {
        setConnectionStatus("connected");
        setStatusMessage("Connected");
        setErrorMessage(null);
      } else if (pc.iceConnectionState === "disconnected") {
        setConnectionStatus("reconnecting");
        setStatusMessage("Reconnecting...");
      } else if (pc.iceConnectionState === "failed") {
        setConnectionStatus("failed");
        setStatusMessage("Connection failed");
        setErrorMessage("Connection to participant interrupted. Attempting to recover...");
        // Automatic ICE restart
        try {
          pc.restartIce();
        } catch (e) {
          console.warn("[WebRTC] restartIce failed:", e);
        }
      }
    };

    return pc;
  }, [roomId]);

  // Main effect to initialize media & socket signaling
  useEffect(() => {
    isMountedRef.current = true;

    // 1. Fetch appointment details
    const fetchAppointment = async () => {
      if (!appointmentId) return;
      try {
        const res = await fetch(`${API_BASE}/api/v1/appointments/${appointmentId}`);
        const data = await res.json();
        if (data.success && data.data) {
          appointmentRef.current = data.data;
          if (isMountedRef.current) {
            setAppointment(data.data);
          }
        }
      } catch (err) {
        console.warn("[VideoCall] Failed to load appointment details:", err);
      }
    };

    // 2. Start local user media
    const initMediaAndSocket = async () => {
      try {
        setStatusMessage("Requesting camera and microphone access...");
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280, max: 1920 },
            height: { ideal: 720, max: 1080 },
            frameRate: { ideal: 30, max: 30 },
          },
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });

        if (!isMountedRef.current) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        localStreamRef.current = stream;
        setLocalStream(stream);
        cameraTrackRef.current = stream.getVideoTracks()[0];

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        // 3. Connect to signaling socket
        await fetchAppointment();
        setupSignalingSocket();
      } catch (mediaErr) {
        console.error("[VideoCall] getUserMedia error:", mediaErr);
        if (!isMountedRef.current) return;
        setConnectionStatus("failed");
        if (mediaErr.name === "NotAllowedError" || mediaErr.name === "PermissionDeniedError") {
          setErrorMessage("Camera/Microphone permission was denied. Please allow access in your browser settings.");
        } else if (mediaErr.name === "NotFoundError" || mediaErr.name === "DevicesNotFoundError") {
          setErrorMessage("No camera or microphone found. Please connect a device and retry.");
        } else if (mediaErr.name === "NotReadableError" || mediaErr.name === "TrackStartError") {
          setErrorMessage("Camera or microphone is already in use by another application.");
        } else {
          setErrorMessage("Failed to access camera/mic: " + mediaErr.message);
        }
      }
    };

    const setupSignalingSocket = () => {
      const appt = appointmentRef.current;
      const callRoomId = appt?.callRoomId || roomId || `call_${appointmentId}`;
      const chatRoomId = appt?.chatRoomId || `chat_${appointmentId}`;

      socketRef.current = createSocketClient({
        query: {
          appointmentId,
          userId: effectiveUserId,
          userType,
        },
      });

      const socket = socketRef.current;

      socket.on("connect", () => {
        console.log(`[Socket] Connected to signaling server: ${socket.id}`);
        setStatusMessage("Joining consultation room...");
        setConnectionStatus("connecting");

        socket.emit("join-appointment-room", {
          appointmentId,
          chatRoomId,
          callRoomId,
          userId: effectiveUserId,
          userName: effectiveUserName,
          userType,
        });
      });

      // Existing participants in the room when we join -> We initiate offers to them
      socket.on("existing-room-users", async ({ users }) => {
        console.log("[Socket] Existing participants in room:", users);
        if (!Array.isArray(users) || users.length === 0) {
          setStatusMessage("Waiting for other participant to join...");
          return;
        }

        setStatusMessage("Connecting to participants...");
        for (const peer of users) {
          try {
            const pc = createPeerConnection(peer.socketId, peer);
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);

            socket.emit("webrtc-offer", {
              callRoomId,
              offer,
              targetSocketId: peer.socketId,
            });
          } catch (err) {
            console.error("[WebRTC] Error initiating offer to peer:", peer.socketId, err);
          }
        }
      });

      // New peer joined the room -> They will send an offer, we update status
      socket.on("user-joined-room", (peer) => {
        if (peer.socketId === socket.id) return;
        console.log("[Socket] Remote user joined room:", peer);
        setStatusMessage(`${peer.userName || "Participant"} joined the consultation.`);
      });

      // Handle incoming WebRTC offer
      socket.on("webrtc-offer", async ({ offer, fromSocketId, fromName, fromType, from }) => {
        console.log(`[WebRTC] Received offer from: ${fromSocketId} (${fromName})`);
        try {
          const pc = createPeerConnection(fromSocketId, {
            userId: from,
            userName: fromName,
            userType: fromType,
          });

          await pc.setRemoteDescription(new RTCSessionDescription(offer));

          // Drain any queued ICE candidates for this peer
          const peerEntry = peersRef.current.get(fromSocketId);
          if (peerEntry && peerEntry.candidateQueue.length > 0) {
            for (const cand of peerEntry.candidateQueue) {
              try {
                await pc.addIceCandidate(new RTCIceCandidate(cand));
              } catch (iceErr) {
                console.warn("[WebRTC] Error adding queued ICE candidate:", iceErr);
              }
            }
            peerEntry.candidateQueue = [];
          }

          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);

          socket.emit("webrtc-answer", {
            callRoomId,
            answer,
            targetSocketId: fromSocketId,
          });
        } catch (err) {
          console.error("[WebRTC] Error handling offer:", err);
          setErrorMessage("Failed to establish video link: " + err.message);
        }
      });

      // Handle incoming WebRTC answer
      socket.on("webrtc-answer", async ({ answer, fromSocketId }) => {
        console.log(`[WebRTC] Received answer from: ${fromSocketId}`);
        try {
          const peerEntry = peersRef.current.get(fromSocketId);
          if (!peerEntry) {
            console.warn("[WebRTC] No peer entry found for answer:", fromSocketId);
            return;
          }

          const pc = peerEntry.pc;
          if (pc.signalingState === "have-local-offer") {
            await pc.setRemoteDescription(new RTCSessionDescription(answer));

            // Drain queued ICE candidates
            if (peerEntry.candidateQueue.length > 0) {
              for (const cand of peerEntry.candidateQueue) {
                try {
                  await pc.addIceCandidate(new RTCIceCandidate(cand));
                } catch (iceErr) {
                  console.warn("[WebRTC] Error adding queued ICE candidate:", iceErr);
                }
              }
              peerEntry.candidateQueue = [];
            }
          }
        } catch (err) {
          console.error("[WebRTC] Error setting remote answer:", err);
        }
      });

      // Handle incoming ICE candidate
      socket.on("webrtc-ice-candidate", async ({ candidate, fromSocketId }) => {
        if (!candidate) return;
        const peerEntry = peersRef.current.get(fromSocketId);
        if (!peerEntry) return;

        const pc = peerEntry.pc;
        if (pc.remoteDescription && pc.remoteDescription.type) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (iceErr) {
            console.warn("[WebRTC] Error adding ICE candidate:", iceErr);
          }
        } else {
          // Queue until remote description is set
          peerEntry.candidateQueue.push(candidate);
        }
      });

      // Handle peer leaving
      socket.on("user-left-room", ({ socketId, userName }) => {
        console.log(`[Socket] Peer left room: ${socketId} (${userName})`);
        if (peersRef.current.has(socketId)) {
          const entry = peersRef.current.get(socketId);
          entry.pc.close();
          peersRef.current.delete(socketId);
        }
        setRemoteParticipants((prev) => {
          const next = new Map(prev);
          next.delete(socketId);
          return next;
        });

        if (peersRef.current.size === 0) {
          setStatusMessage("Other participant left the consultation.");
        }
      });

      // Handle media mute/unmute changes from remote peer
      socket.on("user-media-state-change", ({ socketId, isAudioMuted: remoteAudioMuted, isVideoMuted: remoteVideoMuted }) => {
        setRemoteParticipants((prev) => {
          if (!prev.has(socketId)) return prev;
          const next = new Map(prev);
          const current = next.get(socketId);
          next.set(socketId, {
            ...current,
            isAudioMuted: remoteAudioMuted !== undefined ? remoteAudioMuted : current.isAudioMuted,
            isVideoMuted: remoteVideoMuted !== undefined ? remoteVideoMuted : current.isVideoMuted,
          });
          return next;
        });
      });

      // Handle call ended event
      socket.on("call-ended", () => {
        setStatusMessage("Consultation ended by remote participant.");
        handleEndCall(false);
      });

      socket.on("connect_error", (err) => {
        console.error("[Socket] Connection error:", err);
        setConnectionStatus("reconnecting");
        setStatusMessage("Connecting to signaling network...");
      });
    };

    initMediaAndSocket();

    // Comprehensive unmount cleanup
    return () => {
      isMountedRef.current = false;
      cleanupCallSession();
    };
  }, [appointmentId, createPeerConnection, effectiveUserId, effectiveUserName, roomId, userType]);

  // Clean all streams, peers, and socket
  const cleanupCallSession = () => {
    // 1. Stop local tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    if (screenTrackRef.current) {
      screenTrackRef.current.stop();
      screenTrackRef.current = null;
    }

    // 2. Close peer connections
    peersRef.current.forEach((entry) => {
      try {
        entry.pc.close();
      } catch (e) {}
    });
    peersRef.current.clear();

    // 3. Disconnect socket
    if (socketRef.current) {
      const appt = appointmentRef.current;
      socketRef.current.emit("leave-appointment-room", {
        appointmentId,
        chatRoomId: appt?.chatRoomId,
        callRoomId: appt?.callRoomId || roomId,
      });
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  };

  // Toggle Microphone
  const toggleAudio = () => {
    if (!localStreamRef.current) return;
    const audioTrack = localStreamRef.current.getAudioTracks()[0];
    if (audioTrack) {
      const newEnabled = !audioTrack.enabled;
      audioTrack.enabled = newEnabled;
      setIsAudioMuted(!newEnabled);

      // Broadcast media state
      const appt = appointmentRef.current;
      if (socketRef.current) {
        socketRef.current.emit("media-state-change", {
          callRoomId: appt?.callRoomId || roomId,
          isAudioMuted: !newEnabled,
          isVideoMuted,
        });
      }
    }
  };

  // Toggle Camera
  const toggleVideo = () => {
    if (!localStreamRef.current) return;
    const videoTrack = localStreamRef.current.getVideoTracks()[0];
    if (videoTrack) {
      const newEnabled = !videoTrack.enabled;
      videoTrack.enabled = newEnabled;
      setIsVideoMuted(!newEnabled);

      // Broadcast media state
      const appt = appointmentRef.current;
      if (socketRef.current) {
        socketRef.current.emit("media-state-change", {
          callRoomId: appt?.callRoomId || roomId,
          isAudioMuted,
          isVideoMuted: !newEnabled,
        });
      }
    }
  };

  // Screen Sharing
  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      // Revert back to camera track
      if (cameraTrackRef.current && localStreamRef.current) {
        const screenTrack = screenTrackRef.current;
        if (screenTrack) screenTrack.stop();

        peersRef.current.forEach(({ pc }) => {
          const senders = pc.getSenders();
          const videoSender = senders.find((s) => s.track && s.track.kind === "video");
          if (videoSender) {
            videoSender.replaceTrack(cameraTrackRef.current);
          }
        });

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = localStreamRef.current;
        }
      }
      setIsScreenSharing(false);
      screenTrackRef.current = null;
    } else {
      try {
        const displayStream = await navigator.mediaDevices.getDisplayMedia({
          video: { cursor: "always" },
          audio: false,
        });
        const screenTrack = displayStream.getVideoTracks()[0];
        screenTrackRef.current = screenTrack;

        peersRef.current.forEach(({ pc }) => {
          const senders = pc.getSenders();
          const videoSender = senders.find((s) => s.track && s.track.kind === "video");
          if (videoSender) {
            videoSender.replaceTrack(screenTrack);
          }
        });

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = displayStream;
        }

        setIsScreenSharing(true);

        // Handle user stopping screen share via browser floating bar
        screenTrack.onended = () => {
          toggleScreenShare();
        };
      } catch (err) {
        console.warn("[VideoCall] Screen share cancelled or unsupported:", err);
      }
    }
  };

  // Toggle Fullscreen
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // Navigate directly to Messages & Chat (Preserving context)
  const handleOpenLiveChat = () => {
    cleanupCallSession();
    if (onClose) onClose();

    const targetRoute = userType === "doctor" ? "/doctor/dashboard/chat" : "/user/dashboard/chat";
    const appt = appointmentRef.current || appointment;

    navigate(targetRoute, {
      state: {
        activeAppointmentId: appointmentId,
        appointment: appt,
        doctorEmail: appt?.doctorEmail,
        userEmail: appt?.userEmail,
      },
    });
  };

  // End Call handler
  const handleEndCall = (notifyServer = true) => {
    if (notifyServer && socketRef.current) {
      const appt = appointmentRef.current;
      socketRef.current.emit("call-ended", {
        callRoomId: appt?.callRoomId || roomId,
      });
    }
    cleanupCallSession();
    if (onClose) onClose();
  };

  // Retry Connection after failure
  const handleRetryConnection = () => {
    setErrorMessage(null);
    setConnectionStatus("connecting");
    setStatusMessage("Retrying connection...");
    cleanupCallSession();
    if (appointmentId) {
      window.location.reload();
    }
  };

  // Calculate layout configuration based on remote count
  const remoteArray = Array.from(remoteParticipants.values());
  const totalParticipants = remoteArray.length + 1; // +1 for local

  return (
    <div
      ref={containerRef}
      className={`vc-telemedicine-container ${isFullscreen ? "vc-fullscreen" : ""}`}
    >
      {/* ─── Top Telemedicine App Header ─── */}
      <header className="vc-header">
        <div className="vc-header-left">
          <div className="vc-brand">
            <span className="vc-brand-icon">🩺</span>
            <div className="vc-brand-meta">
              <h2>Video Consultation</h2>
              <span className="vc-appt-pill">
                {appointment?.userName && appointment?.doctorName
                  ? `${appointment.userName} ↔ Dr. ${appointment.doctorName}`
                  : "Clinical Telehealth Session"}
              </span>
            </div>
          </div>
        </div>

        <div className="vc-header-center">
          <div className="vc-duration-badge">
            <span className="vc-pulse-dot" />
            <span>{formatDuration(callDuration)}</span>
          </div>

          <div className={`vc-status-badge vc-status-${connectionStatus}`}>
            <span className="vc-status-dot" />
            <span className="vc-status-text">
              {connectionStatus === "connected"
                ? "Secure & Encrypted"
                : connectionStatus === "reconnecting"
                ? "Reconnecting..."
                : connectionStatus === "failed"
                ? "Connection Issue"
                : "Connecting..."}
            </span>
          </div>
        </div>

        <div className="vc-header-right">
          <button
            type="button"
            className="vc-head-btn"
            onClick={() => setLayoutMode(layoutMode === "grid" ? "auto" : "grid")}
            title={layoutMode === "grid" ? "Switch to Focus Layout" : "Switch to Grid Layout"}
          >
            <FiGrid size={15} />
            <span className="vc-btn-label">{layoutMode === "grid" ? "Focus" : "Grid"}</span>
          </button>

          <button
            type="button"
            className="vc-head-btn"
            onClick={toggleFullscreen}
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <FiMinimize size={15} /> : <FiMaximize size={15} />}
          </button>

          <button
            type="button"
            className="vc-head-close-btn"
            onClick={() => handleEndCall(true)}
            title="End and close consultation"
          >
            ✕
          </button>
        </div>
      </header>

      {/* ─── Non-blocking Toast / Warning Banner ─── */}
      {errorMessage && (
        <div className="vc-error-banner">
          <FiAlertCircle size={18} />
          <div className="vc-error-content">
            <p>{errorMessage}</p>
          </div>
          <button type="button" className="vc-retry-btn" onClick={handleRetryConnection}>
            <FiRefreshCw size={13} /> Retry
          </button>
        </div>
      )}

      {/* ─── Main Video Viewport ─── */}
      <main className="vc-viewport">
        {/* Layout: Single Remote Participant Focus Mode */}
        {remoteArray.length === 0 && (
          <div className="vc-waiting-stage">
            <div className="vc-waiting-card">
              <div className="vc-waiting-avatar-ring">
                <div className="vc-waiting-avatar">
                  {userType === "doctor" ? "👤" : "🩺"}
                </div>
              </div>
              <h3>Waiting for {userType === "doctor" ? "Patient" : "Doctor"} to join...</h3>
              <p className="vc-waiting-sub">
                {appointment?.date
                  ? `Scheduled for ${appointment.date} at ${appointment.time}`
                  : "Both parties will be automatically connected when present in the room."}
              </p>
              <div className="vc-waiting-spinner-wrap">
                <div className="vc-spinner" />
                <span>Room ID: {appointment?.callRoomId || roomId || appointmentId}</span>
              </div>
            </div>
          </div>
        )}

        {remoteArray.length > 0 && (
          <div
            className={`vc-video-grid vc-grid-${
              layoutMode === "grid"
                ? `auto-${totalParticipants}`
                : remoteArray.length === 1
                ? "single-focus"
                : remoteArray.length === 2
                ? "dual"
                : "multi"
            }`}
          >
            {remoteArray.map((peer) => (
              <RemoteVideoTile
                key={peer.socketId}
                peer={peer}
                getInitials={getInitials}
              />
            ))}
          </div>
        )}

        {/* Local Participant Preview (Picture-in-Picture or Grid Tile) */}
        <div
          className={`vc-local-tile ${
            remoteArray.length === 0 || layoutMode !== "grid"
              ? "vc-local-tile--pip"
              : "vc-local-tile--grid"
          }`}
        >
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="vc-local-video"
          />
          {isVideoMuted && (
            <div className="vc-local-muted-fallback">
              <div className="vc-avatar-circle">{getInitials(effectiveUserName)}</div>
              <span>Camera Off</span>
            </div>
          )}
          <div className="vc-tile-badge">
            <span className="vc-tile-name">You ({effectiveUserName})</span>
            {isAudioMuted && <span className="vc-badge-mute" title="Microphone muted">🔇</span>}
            {isScreenSharing && <span className="vc-badge-share">🖥️ Sharing</span>}
          </div>
        </div>
      </main>

      {/* ─── Bottom Floating Telemedicine Controls ─── */}
      <footer className="vc-controls-bar">
        <div className="vc-controls-group">
          {/* Microphone Toggle */}
          <button
            type="button"
            className={`vc-ctrl-btn ${isAudioMuted ? "vc-ctrl-btn--danger" : "vc-ctrl-btn--active"}`}
            onClick={toggleAudio}
            title={isAudioMuted ? "Unmute Microphone" : "Mute Microphone"}
          >
            {isAudioMuted ? <FiMicOff size={20} /> : <FiMic size={20} />}
            <span className="vc-ctrl-label">{isAudioMuted ? "Unmute" : "Mute"}</span>
          </button>

          {/* Camera Toggle */}
          <button
            type="button"
            className={`vc-ctrl-btn ${isVideoMuted ? "vc-ctrl-btn--danger" : "vc-ctrl-btn--active"}`}
            onClick={toggleVideo}
            title={isVideoMuted ? "Turn Camera On" : "Turn Camera Off"}
          >
            {isVideoMuted ? <FiVideoOff size={20} /> : <FiVideo size={20} />}
            <span className="vc-ctrl-label">{isVideoMuted ? "Start Video" : "Stop Video"}</span>
          </button>

          {/* Screen Share */}
          <button
            type="button"
            className={`vc-ctrl-btn ${isScreenSharing ? "vc-ctrl-btn--highlight" : ""}`}
            onClick={toggleScreenShare}
            title={isScreenSharing ? "Stop Screen Sharing" : "Share Screen"}
          >
            <FiShare size={20} />
            <span className="vc-ctrl-label">{isScreenSharing ? "Stop Share" : "Share"}</span>
          </button>

          {/* Live Chat (Deep-linked to Messages & Chat Section) */}
          <button
            type="button"
            className="vc-ctrl-btn vc-ctrl-btn--chat"
            onClick={handleOpenLiveChat}
            title="Open Messages & Chat section"
          >
            <FiMessageSquare size={20} />
            <span className="vc-ctrl-label">Live Chat</span>
          </button>

          {/* End Call Button */}
          <button
            type="button"
            className="vc-ctrl-btn vc-ctrl-btn--hangup"
            onClick={() => handleEndCall(true)}
            title="End Consultation"
          >
            <FiPhoneOff size={22} />
            <span className="vc-ctrl-label">End Call</span>
          </button>
        </div>
      </footer>
    </div>
  );
}

// Subcomponent for stable remote video playback without re-rendering entire screen
const RemoteVideoTile = React.memo(({ peer, getInitials }) => {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (peer.stream && videoRef.current) {
      videoRef.current.srcObject = peer.stream;
      videoRef.current.muted = false;
      videoRef.current.playsInline = true;

      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => setIsPlaying(true))
          .catch((err) => {
            console.warn("[RemoteVideoTile] Autoplay prevented:", err);
          });
      }
    }
  }, [peer.stream]);

  return (
    <div className="vc-remote-tile">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className={`vc-remote-video ${peer.isVideoMuted ? "vc-video-hidden" : ""}`}
        onPlaying={() => setIsPlaying(true)}
      />

      {peer.isVideoMuted && (
        <div className="vc-remote-fallback">
          <div className="vc-avatar-circle vc-avatar-circle--lg">
            {getInitials(peer.userName)}
          </div>
          <p className="vc-fallback-name">{peer.userName}</p>
          <span className="vc-fallback-sub">Camera is currently paused</span>
        </div>
      )}

      <div className="vc-tile-badge">
        <span className="vc-tile-name">
          {peer.userType === "doctor" ? `Dr. ${peer.userName}` : peer.userName}
        </span>
        {peer.isAudioMuted && <span className="vc-badge-mute" title="Microphone muted">🔇</span>}
      </div>
    </div>
  );
});