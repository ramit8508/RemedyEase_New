import React, { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import "../Css_for_all/VideoCall.css";

// Get the backend URL from environment variables.
const SOCKET_URL = import.meta.env.VITE_DOCTOR_BACKEND_URL;

const VideoCall = ({ appointmentId, currentUser, userType, onClose }) => {
  // Video call state management
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isCallActive, setIsCallActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  // Media controls
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);

  // Status and error handling
  const [callStatus, setCallStatus] = useState("Initializing...");
  const [error, setError] = useState(null);
  const [otherUserOnline, setOtherUserOnline] = useState(false);

  // Refs for video elements, WebRTC connection, and socket
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const socketRef = useRef(null);

  const pcConfig = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:1932" }, // Corrected port number
    ],
  };

  // *** MAJOR FIX AREA ***
  // useEffect is used for side effects like setting up connections and listeners.
  // The JSX for rendering should be outside of it, in the component's main return statement.
  useEffect(() => {
    // Function to start local media stream
    const startMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        setLocalStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        // After getting media, setup the socket connection
        setupSocket();
      } catch (err) {
        console.error("Error accessing media devices.", err);
        setError("Could not access camera or microphone. Please check permissions.");
        setCallStatus("Failed to start");
      }
    };

    startMedia();

    // Return a cleanup function to be run when the component unmounts
    return () => {
      cleanup();
    };
  }, []); // Empty dependency array means this effect runs once on mount

  const setupSocket = () => {
    // Socket connection setup
    socketRef.current = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      query: {
        appointmentId,
        userId: currentUser.id,
        userType,
      },
    });

    const socket = socketRef.current;
    // Setup all socket event listeners
    socket.on("connect", () => {
      console.log("Socket connected");
      setCallStatus("Connecting to room...");
      // fetch appointment details (chatRoomId / callRoomId) before joining
      // the room so server can add this socket to the correct rooms.
      fetch(`/api/v1/appointments/${appointmentId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.data) {
            const appt = data.data;
            const { chatRoomId, callRoomId } = appt;
            console.log("Joining appointment rooms:", { chatRoomId, callRoomId });
            socket.emit("join-appointment-room", {
              appointmentId,
              chatRoomId,
              callRoomId,
            });
            setCallStatus("Waiting for other participant...");
            setIsConnecting(true);
            // If this client is the patient, attempt to initiate after a short delay
            // if the other user is already present they will trigger 'user-joined-room'.
            if (userType === "patient") {
              // give the server a moment to register both sockets
              setTimeout(() => {
                // try to create an offer; if the remote isn't present it will be ignored
                console.log("Patient initiating call attempt...");
                initiateCall();
              }, 1200);
            }
          } else {
            console.error("Failed to load appointment for call joining:", data);
            setError("Failed to join call room");
          }
        })
        .catch((err) => {
          console.error("Failed to fetch appointment on connect:", err);
          setError("Failed to join call room");
        });
    });

    socket.on("connect_error", (err) => {
      console.error("Socket connection error:", err);
      setError("Failed to connect to the server.");
      setCallStatus("Connection Failed");
    });

    // When another user joins the appointment room, the server emits 'user-joined-room'
    socket.on("user-joined-room", (payload) => {
      console.log("User joined room:", payload);
      setOtherUserOnline(true);
      setCallStatus("Other participant present");
      setIsConnecting(true);
      // If this client is patient and not already created an offer, try initiating
      if (userType === "patient") {
        setTimeout(() => {
          initiateCall();
        }, 800);
      }
    });

    // Handle when a user disconnects or leaves (the server may broadcast statuses)
    socket.on("user-status-change", (status) => {
      if (status && status.userId && status.isOnline === false) {
        // If the other participant went offline, update UI
        if (status.userId !== currentUser.id) {
          setOtherUserOnline(false);
          setCallStatus("Other participant left the call");
        }
      }
    });

    // WebRTC signaling (server uses dashed event names)
    socket.on("webrtc-offer", (data) => handleOffer(data.offer));
    socket.on("webrtc-answer", (data) => handleAnswer(data.answer));
    socket.on("webrtc-ice-candidate", (data) => handleIceCandidate(data.candidate));

    // Server will broadcast call-ended to room
    socket.on("call-ended", () => {
      setCallStatus("Call ended by other user");
      endCall(false); // Pass false to avoid emitting end_call again
    });

    socket.on("video_call_error", (error) =>
      setError(error.message || "Video call error occurred")
    );
  };
  
  const createPeerConnection = () => {
    const peerConnection = new RTCPeerConnection(pcConfig);

    if (localStream) {
      localStream
        .getTracks()
        .forEach((track) => peerConnection.addTrack(track, localStream));
    }

    peerConnection.ontrack = (event) => {
      const [stream] = event.streams;
      setRemoteStream(stream);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = stream;
      }
      setIsCallActive(true);
      setIsConnecting(false);
      setCallStatus("Connected");
    };

    peerConnection.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        // Use server expected event name and include callRoomId
        fetch(`/api/v1/appointments/${appointmentId}`)
          .then((res) => res.json())
          .then((data) => {
            if (data.success && data.data) {
              const callRoomId = data.data.callRoomId;
              socketRef.current.emit("webrtc-ice-candidate", {
                callRoomId,
                candidate: event.candidate,
              });
            }
          })
          .catch(() => {
            // fallback: send without callRoomId (server may ignore)
            socketRef.current.emit("webrtc-ice-candidate", {
              candidate: event.candidate,
            });
          });
      }
    };
    
    return peerConnection;
  };

  const initiateCall = async () => {
    if (!localStream) {
        setError("Local video stream is not available to initiate the call.");
        return;
    }
    try {
      peerConnectionRef.current = createPeerConnection();
      const offer = await peerConnectionRef.current.createOffer();
      await peerConnectionRef.current.setLocalDescription(offer);
      // Send the offer using the server expected event naming and include callRoomId
      const resp = await fetch(`/api/v1/appointments/${appointmentId}`);
      const data = await resp.json();
      const callRoomId = data?.data?.callRoomId;
      socketRef.current.emit("webrtc-offer", { callRoomId, offer });
    } catch (err) {
      console.error("Failed to initiate call:", err);
      setError("Failed to initiate call");
    }
  };

  const handleOffer = async (offer) => {
    if (!localStream) {
        setError("Local video stream is not available to answer the call.");
        return;
    }
    try {
      if (!peerConnectionRef.current) {
        peerConnectionRef.current = createPeerConnection();
      }
      await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await peerConnectionRef.current.createAnswer();
      await peerConnectionRef.current.setLocalDescription(answer);
      // reply using server expected event name
      const resp = await fetch(`/api/v1/appointments/${appointmentId}`);
      const data = await resp.json();
      const callRoomId = data?.data?.callRoomId;
      socketRef.current.emit("webrtc-answer", { callRoomId, answer });
    } catch (err) {
      console.error("Failed to accept call:", err);
      setError("Failed to accept call");
    }
  };

  const handleAnswer = async (answer) => {
    try {
      await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
    } catch (err) {
      console.error("Failed to complete call setup:", err);
      setError("Failed to complete call setup");
    }
  };

  const handleIceCandidate = async (candidate) => {
    try {
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      }
    } catch (err) {
      console.error("Error handling ICE candidate:", err);
    }
  };

  const toggleAudio = () => {
    if (localStream) {
      localStream.getAudioTracks()[0].enabled = !localStream.getAudioTracks()[0].enabled;
      setIsAudioMuted(!localStream.getAudioTracks()[0].enabled);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks()[0].enabled = !localStream.getVideoTracks()[0].enabled;
      setIsVideoMuted(!localStream.getVideoTracks()[0].enabled);
    }
  };

  const endCall = (notifyServer = true) => {
    if (notifyServer && socketRef.current) {
        // notify server using its event name
        // include callRoomId if available
        fetch(`/api/v1/appointments/${appointmentId}`)
          .then((res) => res.json())
          .then((data) => {
            const callRoomId = data?.data?.callRoomId;
            socketRef.current.emit("call-ended", { callRoomId });
          })
          .catch(() => {
            socketRef.current.emit("call-ended", {});
          });
    }
    cleanup();
    onClose();
  };

  const cleanup = () => {
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    setLocalStream(null);
    setRemoteStream(null);
    setIsCallActive(false);
  };
  
  // *** THIS IS THE CORRECT PLACE FOR THE JSX RETURN ***
  return (
    <div className="video-call-container" style={{ maxWidth: "1100px", width: "100vw", height: "850px" }}>
      <div className="video-call-header">
        <div className="call-info">
          <h3>Video Call</h3>
          <span className="call-status">{callStatus}</span>
        </div>
        <button className="close-call-btn" onClick={() => endCall(true)}>✕</button>
      </div>

      {error && (
        <div className="call-error">
          <p>{error}</p>
        </div>
      )}

      <div className="video-container">
        <div className="remote-video-wrapper">
          {remoteStream ? (
            <video ref={remoteVideoRef} autoPlay playsInline className="remote-video" />
          ) : (
            <div className="no-remote-video">
              <div className="avatar-placeholder">
                {isConnecting ? (
                  <div className="connecting-animation">
                    <div className="spinner"></div>
                    <p>Connecting...</p>
                  </div>
                ) : (
                  <div className="waiting-message">
                    <p>Waiting for other participant</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        <div className="local-video-wrapper">
          <video ref={localVideoRef} autoPlay playsInline muted className="local-video" />
          {isVideoMuted && (
            <div className="video-muted-overlay">
              <span>📷 Off</span>
            </div>
          )}
        </div>
      </div>

      <div className="call-controls">
        <button
          className={`control-btn ${isAudioMuted ? "muted" : ""}`}
          onClick={toggleAudio}
        >
          {isAudioMuted ? "🔇" : "🔊"}
        </button>
        <button
          className={`control-btn ${isVideoMuted ? "muted" : ""}`}
          onClick={toggleVideo}
        >
          {isVideoMuted ? "📷" : "📹"}
        </button>
        <button className="control-btn end-call-btn" onClick={() => endCall(true)}>
          📞
        </button>
      </div>
    </div>
  );
};

export default VideoCall;