import React, { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import "../Css_for_all/VideoCall.css";

// Get the backend URL from environment variables.
const SOCKET_URL = import.meta.env.VITE_DOCTOR_BACKEND_URL || "";
const API_BASE = import.meta.env.VITE_DOCTOR_BACKEND_URL || "";

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
  const [needsManualPlay, setNeedsManualPlay] = useState(false); // For browsers blocking autoplay

  // Refs for video elements, WebRTC connection, and socket
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const socketRef = useRef(null);
  const localStreamRef = useRef(null); // Store stream in ref for immediate access
  // Queue refs to handle out-of-order signaling
  const pendingRemoteDescRef = useRef(null);
  const pendingIceCandidatesRef = useRef([]);
  // Track if we've initiated a call to prevent duplicate offers
  const hasInitiatedCallRef = useRef(false);
  const isProcessingOfferRef = useRef(false);
  const isPlayingRef = useRef(false); // Prevent multiple play attempts
  const playPromiseRef = useRef(null); // Track current play promise

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
        console.log("🎥 Requesting camera and microphone access...");
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        console.log("✅ Got local stream:", stream.id);
        console.log("🎥 Local video tracks:", stream.getVideoTracks().length);
        console.log("🎥 Local audio tracks:", stream.getAudioTracks().length);
        
        setLocalStream(stream);
        localStreamRef.current = stream; // Store in ref for immediate access
        
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
          console.log("✅ Local video element updated");
          // Force play for local video
          localVideoRef.current.play().catch(err => {
            console.error("Failed to play local video:", err);
          });
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

  // Effect to handle remote stream updates
  useEffect(() => {
    if (remoteStream && remoteVideoRef.current) {
      console.log("🔄 Remote stream state updated, applying to video element");
      
      // If already playing or play in progress, skip
      if (isPlayingRef.current || playPromiseRef.current) {
        console.log("⏭️ Skipping - video already playing or play in progress");
        return;
      }
      
      remoteVideoRef.current.srcObject = remoteStream;
      
      // Force properties
      remoteVideoRef.current.muted = false;
      remoteVideoRef.current.volume = 1.0;
      remoteVideoRef.current.playsInline = true;
      remoteVideoRef.current.autoplay = true;
      
      // Single play attempt with proper cleanup
      const playVideo = () => {
        if (isPlayingRef.current) {
          console.log("⏭️ Already playing, skipping");
          return;
        }
        
        console.log("▶️ Attempting to play remote video...");
        playPromiseRef.current = remoteVideoRef.current.play()
          .then(() => {
            console.log("✅ Remote video playing successfully");
            isPlayingRef.current = true;
            setNeedsManualPlay(false);
            playPromiseRef.current = null;
          })
          .catch(err => {
            console.error("⚠️ Auto-play failed:", err.name, err.message);
            playPromiseRef.current = null;
            
            // Only show manual button, don't try more auto-play attempts
            if (err.name === 'NotAllowedError' || err.name === 'NotSupportedError') {
              console.log("🖱️ User interaction required - showing manual play button");
              setNeedsManualPlay(true);
            }
          });
      };
      
      playVideo();
    }
  }, [remoteStream]);

  // Add event listeners to remote video element to track playback
  useEffect(() => {
    const videoEl = remoteVideoRef.current;
    if (!videoEl) return;

    const handleLoadedMetadata = () => {
      console.log("🎬 Remote video metadata loaded:", videoEl.videoWidth, "x", videoEl.videoHeight);
    };

    const handleLoadedData = () => {
      console.log("🎬 Remote video data loaded");
    };

    const handlePlaying = () => {
      console.log("✅ Remote video is now playing!");
    };

    const handleStalled = () => {
      console.warn("⚠️ Remote video stalled");
    };

    const handleError = (e) => {
      console.error("❌ Remote video error:", e);
    };

    videoEl.addEventListener('loadedmetadata', handleLoadedMetadata);
    videoEl.addEventListener('loadeddata', handleLoadedData);
    videoEl.addEventListener('playing', handlePlaying);
    videoEl.addEventListener('stalled', handleStalled);
    videoEl.addEventListener('error', handleError);

    return () => {
      videoEl.removeEventListener('loadedmetadata', handleLoadedMetadata);
      videoEl.removeEventListener('loadeddata', handleLoadedData);
      videoEl.removeEventListener('playing', handlePlaying);
      videoEl.removeEventListener('stalled', handleStalled);
      videoEl.removeEventListener('error', handleError);
    };
  }, []);


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
      fetch(`${API_BASE}/api/v1/appointments/${appointmentId}`)
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
            
            // Don't initiate here - wait for user-joined-room event
            console.log(`${userType} joined room and waiting...`);
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
      console.log("👤 User joined room:", payload, "| I am:", userType);
      setOtherUserOnline(true);
      setCallStatus("Other participant joined");
      setIsConnecting(true);
      
      // First person to join (or whoever hasn't initiated yet) starts the call
      setTimeout(() => {
        console.log(`📞 ${userType} attempting to initiate call...`);
        initiateCall();
      }, 1000);
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
    socket.on("webrtc-offer", (data) => {
      console.log("📥 Received offer from remote peer | I am:", userType);
      handleOffer(data.offer);
    });
    socket.on("webrtc-answer", (data) => {
      console.log("📥 Received answer from remote peer | I am:", userType);
      handleAnswer(data.answer);
    });
    socket.on("webrtc-ice-candidate", (data) => {
      console.log("📥 Received ICE candidate from remote peer | I am:", userType);
      handleIceCandidate(data.candidate);
    });

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

    const stream = localStreamRef.current || localStream;
    if (stream) {
      stream
        .getTracks()
        .forEach((track) => peerConnection.addTrack(track, stream));
    }

    peerConnection.ontrack = (event) => {
      console.log("🎥 Received remote track:", event);
      const [stream] = event.streams;
      console.log("🎥 Remote stream received:", stream);
      console.log("🎥 Stream ID:", stream.id);
      console.log("🎥 Stream has video tracks:", stream.getVideoTracks().length);
      console.log("🎥 Stream has audio tracks:", stream.getAudioTracks().length);
      
      // Log track details
      stream.getTracks().forEach(track => {
        console.log(`🎥 Track: ${track.kind}, enabled: ${track.enabled}, muted: ${track.muted}, readyState: ${track.readyState}`);
      });
      
      // Set remote stream state
      setRemoteStream(stream);
      
      // IMMEDIATELY attach to video element (don't wait for React state update)
      if (remoteVideoRef.current) {
        console.log("🎥 Attaching stream to remote video element immediately");
        remoteVideoRef.current.srcObject = stream;
        
        // Ensure video element properties are correct
        remoteVideoRef.current.muted = false; // Remote video should NOT be muted
        remoteVideoRef.current.volume = 1.0;
        
        // Force a load event
        remoteVideoRef.current.load();
        
        // Try to play with multiple fallbacks
        remoteVideoRef.current.play()
          .then(() => {
            console.log("✅ Remote video playing successfully");
            console.log("✅ Video dimensions:", remoteVideoRef.current.videoWidth, "x", remoteVideoRef.current.videoHeight);
          })
          .catch(err => {
            console.error("⚠️ Failed to play remote video:", err);
            // Try again after a short delay
            setTimeout(() => {
              remoteVideoRef.current.play()
                .then(() => console.log("✅ Remote video playing on retry"))
                .catch(e => console.error("❌ Second play attempt failed:", e));
            }, 500);
          });
      } else {
        console.warn("⚠️ Remote video ref not available yet");
      }
      
      setIsCallActive(true);
      setIsConnecting(false);
      setCallStatus("Connected");
    };

    peerConnection.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        console.log("🧊 Sending ICE candidate");
        // Use server expected event name and include callRoomId
        fetch(`${API_BASE}/api/v1/appointments/${appointmentId}`)
          .then((res) => res.json())
          .then((data) => {
            if (data.success && data.data) {
              const callRoomId = data.data.callRoomId;
              console.log("🧊 Emitting ICE candidate to callRoomId:", callRoomId);
              socketRef.current.emit("webrtc-ice-candidate", {
                callRoomId,
                candidate: event.candidate,
              });
            }
          })
          .catch((err) => {
            console.error("Failed to fetch appointment for ICE:", err);
            // fallback: send without callRoomId (server may ignore)
            socketRef.current.emit("webrtc-ice-candidate", {
              candidate: event.candidate,
            });
          });
      }
    };
    // Listen for signaling state changes to flush any queued remote descriptions or ICE
    peerConnection.onsignalingstatechange = () => {
      try {
        const state = peerConnection.signalingState;
        console.log('🔁 signalingState changed:', state);
        // If we have a pending remote description (answer) and the connection
        // is now expecting it, apply it.
        if (
          pendingRemoteDescRef.current &&
          state === 'have-local-offer'
        ) {
          const desc = pendingRemoteDescRef.current;
          pendingRemoteDescRef.current = null;
          (async () => {
            try {
              console.log('[PENDING] Applying queued remote description (answer)');
              await peerConnection.setRemoteDescription(new RTCSessionDescription(desc));
              // flush any queued ICE candidates
              if (pendingIceCandidatesRef.current.length) {
                for (const c of pendingIceCandidatesRef.current) {
                  try { await peerConnection.addIceCandidate(new RTCIceCandidate(c)); } catch (e) { console.warn('Failed to add queued ICE', e); }
                }
                pendingIceCandidatesRef.current = [];
              }
            } catch (err) {
              console.error('Failed to apply queued remote description:', err);
            }
          })();
        }

        // If remote description is set and ICE candidates queued, flush them
        if (peerConnection.remoteDescription && pendingIceCandidatesRef.current.length) {
          (async () => {
            for (const c of pendingIceCandidatesRef.current) {
              try { await peerConnection.addIceCandidate(new RTCIceCandidate(c)); } catch (e) { console.warn('Failed to add queued ICE after remote desc', e); }
            }
            pendingIceCandidatesRef.current = [];
          })();
        }
      } catch (e) {
        console.error('Error in onsignalingstatechange handler', e);
      }
    };
    peerConnection.oniceconnectionstatechange = () => {
      console.log("🔌 ICE connection state:", peerConnection.iceConnectionState);
      if (peerConnection.iceConnectionState === "failed") {
        setError("Connection failed. Please try again.");
        setCallStatus("Connection Failed");
      }
      if (peerConnection.iceConnectionState === "disconnected") {
        setCallStatus("Connection lost");
      }
      if (peerConnection.iceConnectionState === "connected") {
        console.log("✅ ICE connection established!");
        setCallStatus("Connected");
      }
    };
    
    return peerConnection;
  };

  const initiateCall = async () => {
    const stream = localStreamRef.current || localStream;
    if (!stream) {
        console.error("Local stream not available yet");
        setError("Local video stream is not available to initiate the call.");
        return;
    }
    
    // Prevent duplicate offer creation
    if (hasInitiatedCallRef.current) {
      console.log("⚠️ Call already initiated, skipping duplicate offer");
      return;
    }
    
    try {
      hasInitiatedCallRef.current = true;
      console.log(`📞 ${userType} creating offer...`);
      
      peerConnectionRef.current = createPeerConnection();
      const offer = await peerConnectionRef.current.createOffer();
      await peerConnectionRef.current.setLocalDescription(offer);
      console.log("✅ Local offer created and set, signaling state:", peerConnectionRef.current.signalingState);
      
      // Send the offer using the server expected event naming and include callRoomId
      const resp = await fetch(`${API_BASE}/api/v1/appointments/${appointmentId}`);
      const data = await resp.json();
      const callRoomId = data?.data?.callRoomId;
      console.log("📤 Sending offer to callRoomId:", callRoomId);
      socketRef.current.emit("webrtc-offer", { callRoomId, offer });
    } catch (err) {
      console.error("Failed to initiate call:", err);
      hasInitiatedCallRef.current = false; // Reset on error
      setError("Failed to initiate call");
    }
  };

  const handleOffer = async (offer) => {
    const stream = localStreamRef.current || localStream;
    if (!stream) {
        console.error("Local stream not available to answer");
        setError("Local video stream is not available to answer the call.");
        return;
    }
    
    // Prevent processing multiple offers simultaneously
    if (isProcessingOfferRef.current) {
      console.log("⚠️ Already processing an offer, ignoring duplicate");
      return;
    }
    
    try {
      isProcessingOfferRef.current = true;
      console.log("📞 Doctor received offer, creating answer...");
      
      // Create or reset peer connection
      if (!peerConnectionRef.current || peerConnectionRef.current.signalingState === "closed") {
        console.log("📞 Creating new peer connection for offer");
        peerConnectionRef.current = createPeerConnection();
      } else {
        const currentState = peerConnectionRef.current.signalingState;
        console.log("📞 Current state when receiving offer:", currentState);
        
        // If we already have a connection in progress, close and recreate
        if (currentState !== "stable" && currentState !== "closed") {
          console.warn("⚠️ Recreating peer connection due to state:", currentState);
          if (peerConnectionRef.current) {
            peerConnectionRef.current.close();
          }
          peerConnectionRef.current = createPeerConnection();
        }
      }
      
      await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(offer));
      console.log("✅ Remote offer set successfully, signaling state:", peerConnectionRef.current.signalingState);
      
      const answer = await peerConnectionRef.current.createAnswer();
      await peerConnectionRef.current.setLocalDescription(answer);
      console.log("✅ Local answer created and set, signaling state:", peerConnectionRef.current.signalingState);
      
      // reply using server expected event name
      const resp = await fetch(`${API_BASE}/api/v1/appointments/${appointmentId}`);
      const data = await resp.json();
      const callRoomId = data?.data?.callRoomId;
      console.log("📤 Sending answer to callRoomId:", callRoomId);
      socketRef.current.emit("webrtc-answer", { callRoomId, answer });
      
      isProcessingOfferRef.current = false;
    } catch (err) {
      console.error("Failed to accept call:", err);
      setError("Failed to accept call: " + err.message);
      isProcessingOfferRef.current = false;
    }
  };

  const handleAnswer = async (answer) => {
    try {
      if (!peerConnectionRef.current) {
        console.error("❌ No peer connection to set answer on");
        return;
      }
      
      // Check the signaling state before setting remote description
      const currentState = peerConnectionRef.current.signalingState;
      console.log("📞 Current signaling state when receiving answer:", currentState);
      
      // If we're in stable state, it means we haven't created an offer or already completed negotiation
      if (currentState === "stable") {
        console.warn("⚠️ Received answer but peer is in stable state - likely duplicate or out-of-order message. Ignoring.");
        return;
      }
      
      // We should only accept an answer if we're in "have-local-offer" state
      if (currentState !== "have-local-offer") {
        console.warn("⚠️ Unexpected state for answer:", currentState, "- queuing answer until ready");
        // Queue the answer and wait for signaling state change
        pendingRemoteDescRef.current = answer;
        return;
      }

      await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
      console.log("✅ Remote answer set successfully, signaling state:", peerConnectionRef.current.signalingState);
      
      // Flush any queued ICE candidates now that remote description is set
      if (pendingIceCandidatesRef.current.length) {
        console.log("🧊 Flushing", pendingIceCandidatesRef.current.length, "queued ICE candidates");
        for (const c of pendingIceCandidatesRef.current) {
          try { 
            await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(c)); 
          } catch (e) { 
            console.warn('Failed to add queued ICE', e); 
          }
        }
        pendingIceCandidatesRef.current = [];
      }
    } catch (err) {
      console.error("❌ Failed to complete call setup:", err);
      setError("Failed to complete call setup: " + err.message);
    }
  };

  const handleIceCandidate = async (candidate) => {
    try {
      if (!peerConnectionRef.current) {
        // No PC yet - queue the candidate
        pendingIceCandidatesRef.current.push(candidate);
        return;
      }

      // If remoteDescription is not set yet, queue the candidate
      if (!peerConnectionRef.current.remoteDescription) {
        pendingIceCandidatesRef.current.push(candidate);
        return;
      }

      await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (err) {
      console.error("Error handling ICE candidate:", err);
    }
  };

  const toggleAudio = () => {
    const stream = localStreamRef.current || localStream;
    if (stream) {
      stream.getAudioTracks()[0].enabled = !stream.getAudioTracks()[0].enabled;
      setIsAudioMuted(!stream.getAudioTracks()[0].enabled);
    }
  };

  const toggleVideo = () => {
    const stream = localStreamRef.current || localStream;
    if (stream) {
      stream.getVideoTracks()[0].enabled = !stream.getVideoTracks()[0].enabled;
      setIsVideoMuted(!stream.getVideoTracks()[0].enabled);
    }
  };

  const manualPlayRemoteVideo = () => {
    console.log("🎬 Manual play button clicked");
    console.log("remoteVideoRef.current:", remoteVideoRef.current);
    console.log("remoteStream:", remoteStream);
    console.log("isPlayingRef:", isPlayingRef.current);
    
    if (remoteVideoRef.current && remoteStream) {
      console.log("✅ Both video element and stream exist");
      console.log("Current srcObject:", remoteVideoRef.current.srcObject);
      console.log("Video paused:", remoteVideoRef.current.paused);
      console.log("Video dimensions:", remoteVideoRef.current.videoWidth, "x", remoteVideoRef.current.videoHeight);
      
      // Wait for any pending play to finish first
      if (playPromiseRef.current) {
        console.log("⏳ Waiting for pending play promise...");
        playPromiseRef.current
          .catch(() => {}) // Ignore error from pending promise
          .finally(() => {
            playPromiseRef.current = null;
            attemptManualPlay();
          });
      } else {
        attemptManualPlay();
      }
    } else {
      console.error("❌ Missing video element or stream!");
      console.log("remoteVideoRef.current:", !!remoteVideoRef.current);
      console.log("remoteStream:", !!remoteStream);
    }
    
    function attemptManualPlay() {
      // Re-attach stream to be sure
      remoteVideoRef.current.srcObject = remoteStream;
      remoteVideoRef.current.muted = false;
      remoteVideoRef.current.volume = 1.0;
      
      console.log("▶️ Starting manual play...");
      playPromiseRef.current = remoteVideoRef.current.play()
        .then(() => {
          console.log("✅ Manual play successful!");
          console.log("Video is now playing:", !remoteVideoRef.current.paused);
          isPlayingRef.current = true;
          setNeedsManualPlay(false);
          playPromiseRef.current = null;
        })
        .catch(err => {
          console.error("❌ Manual play failed:", err.name, err.message);
          playPromiseRef.current = null;
          alert("Unable to play video. Error: " + err.message + "\n\nPlease refresh the page and try again.");
        });
    }
  };

  const endCall = (notifyServer = true) => {
    if (notifyServer && socketRef.current) {
        // notify server using its event name
        // include callRoomId if available
        fetch(`${API_BASE}/api/v1/appointments/${appointmentId}`)
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
    const stream = localStreamRef.current || localStream;
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    localStreamRef.current = null;
    setLocalStream(null);
    setRemoteStream(null);
    setIsCallActive(false);
    
    // Clear refs
    hasInitiatedCallRef.current = false;
    isProcessingOfferRef.current = false;
    pendingRemoteDescRef.current = null;
    pendingIceCandidatesRef.current = [];
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
          <video 
            ref={remoteVideoRef} 
            autoPlay 
            playsInline 
            className="remote-video"
            style={{ 
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              backgroundColor: '#000',
              display: 'block', // Force display
              position: 'absolute',
              top: 0,
              left: 0,
              zIndex: 1 // Ensure it's above background
            }}
            onLoadedMetadata={() => console.log("📺 Video metadata loaded, dimensions:", remoteVideoRef.current?.videoWidth, "x", remoteVideoRef.current?.videoHeight)}
            onLoadedData={() => console.log("📺 Video data loaded")}
            onPlaying={() => console.log("✅ Video is PLAYING")}
            onPause={() => console.log("⏸️ Video paused")}
            onError={(e) => console.error("❌ Video error:", e)}
          />
          {!isCallActive && (
            <div className="no-remote-video" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 2 }}>
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
          {/* Manual Play Button - appears if browser blocks autoplay */}
          {isCallActive && needsManualPlay && remoteStream && (
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 100,
              backgroundColor: 'rgba(0, 0, 0, 0.9)',
              padding: '30px',
              borderRadius: '15px',
              textAlign: 'center',
              boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
            }}>
              <button
                onClick={manualPlayRemoteVideo}
                style={{
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  border: 'none',
                  padding: '20px 40px',
                  fontSize: '18px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  boxShadow: '0 2px 10px rgba(76, 175, 80, 0.5)'
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#45a049'}
                onMouseOut={(e) => e.target.style.backgroundColor = '#4CAF50'}
              >
                ▶️ Click to Play Video
              </button>
              <p style={{ color: 'white', marginTop: '15px', fontSize: '14px', opacity: 0.9 }}>
                Your browser requires interaction to play video
              </p>
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