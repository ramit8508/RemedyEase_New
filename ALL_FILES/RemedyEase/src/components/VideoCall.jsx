import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import '../Css_for_all/VideoCall.css';

// Get the backend URL from environment variables.
// This will be used to create the socket connection inside the component.
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
  const [callStatus, setCallStatus] = useState('Initializing...');
  const [error, setError] = useState(null);
  const [otherUserOnline, setOtherUserOnline] = useState(false);

  // Refs for video elements, WebRTC connection, and socket
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const socketRef = useRef(null);

  const pcConfig = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ],
  };

  useEffect(() => {
    // --- THIS IS THE CRITICAL FIX ---
    // The socket connection is created here, inside useEffect, so it only
    // happens when the VideoCall component is actually on the screen.
    socketRef.current = io(SOCKET_URL, {
        transports: ['websocket', 'polling'],
        reconnectionAttempts: 5,
    });
    
    initializeCall();

    // Cleanup function: This will run when the component is removed.
    return () => {
      cleanup();
    };
  }, [appointmentId]); // Rerun if the appointmentId changes

  const initializeCall = async () => {
    try {
      setupSocketListeners();
      await initializeMedia();
      socketRef.current.emit('join_video_call', {
        appointmentId,
        userId: currentUser.id,
        userType,
        userName: currentUser.name || currentUser.fullname
      });
    } catch (error) {
      console.error('Error initializing call:', error);
      setError('Failed to initialize video call: ' + error.message);
    }
  };

  const initializeMedia = async () => {
    try {
      setCallStatus('Getting camera and microphone access...');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: { echoCancellation: true, noiseSuppression: true }
      });
      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      setCallStatus('Ready to connect...');
    } catch (error) {
      console.error('Error accessing media devices:', error);
      throw new Error('Could not access camera or microphone. Please check permissions.');
    }
  };

  const setupSocketListeners = () => {
    const socket = socketRef.current;
    socket.on('connect', () => console.log('✅ Connected to video call server'));
    socket.on('video_call_joined', () => setCallStatus('Waiting for other participant...'));
    socket.on('user_joined_call', (data) => {
      setOtherUserOnline(true);
      setCallStatus('Connecting...');
      setIsConnecting(true);
      if (data.initiator) {
        initiateCall();
      }
    });
    socket.on('user_left_call', () => {
      setOtherUserOnline(false);
      setCallStatus('Other participant left the call');
      setIsCallActive(false);
      setRemoteStream(null);
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    });
    socket.on('webrtc_offer', (data) => handleOffer(data.offer));
    socket.on('webrtc_answer', (data) => handleAnswer(data.answer));
    socket.on('webrtc_ice_candidate', (data) => handleIceCandidate(data.candidate));
    socket.on('call_ended', () => {
      setCallStatus('Call ended by other user');
      endCall();
    });
    socket.on('video_call_error', (error) => setError(error.message || 'Video call error occurred'));
  };

  const createPeerConnection = () => {
    const peerConnection = new RTCPeerConnection(pcConfig);
    if (localStream) {
      localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));
    }
    peerConnection.ontrack = (event) => {
      const [stream] = event.streams;
      setRemoteStream(stream);
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = stream;
      setIsCallActive(true);
      setIsConnecting(false);
      setCallStatus('Connected');
    };
    peerConnection.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        socketRef.current.emit('webrtc_ice_candidate', { appointmentId, candidate: event.candidate });
      }
    };
    return peerConnection;
  };

  const initiateCall = async () => {
    try {
      peerConnectionRef.current = createPeerConnection();
      const offer = await peerConnectionRef.current.createOffer();
      await peerConnectionRef.current.setLocalDescription(offer);
      socketRef.current.emit('webrtc_offer', { appointmentId, offer });
    } catch (error) {
      setError('Failed to initiate call');
    }
  };

  const handleOffer = async (offer) => {
    try {
      if (!peerConnectionRef.current) peerConnectionRef.current = createPeerConnection();
      await peerConnectionRef.current.setRemoteDescription(offer);
      const answer = await peerConnectionRef.current.createAnswer();
      await peerConnectionRef.current.setLocalDescription(answer);
      socketRef.current.emit('webrtc_answer', { appointmentId, answer });
    } catch (error) {
      setError('Failed to accept call');
    }
  };

  const handleAnswer = async (answer) => {
    try {
      await peerConnectionRef.current.setRemoteDescription(answer);
    } catch (error) {
      setError('Failed to complete call setup');
    }
  };

  const handleIceCandidate = async (candidate) => {
    try {
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.addIceCandidate(candidate);
      }
    } catch (error) {
      console.error('Error handling ICE candidate:', error);
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

  const endCall = async () => {
    try {
      await fetch(`/api/v1/live/call/end/${appointmentId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, userType })
      });
      if (socketRef.current) {
        socketRef.current.emit('end_video_call', { appointmentId });
      }
    } catch (error) {
      console.error('Error ending call:', error);
    } finally {
        cleanup();
        onClose();
    }
  };

  const cleanup = () => {
    if (localStream) localStream.getTracks().forEach(track => track.stop());
    if (peerConnectionRef.current) peerConnectionRef.current.close();
    if (socketRef.current) {
        socketRef.current.disconnect();
    }
    setLocalStream(null);
    setRemoteStream(null);
    setIsCallActive(false);
  };

  return (
    <div className="video-call-container">
      <div className="video-call-header">
        <div className="call-info">
          <h3>Video Call</h3>
          <span className="call-status">{callStatus}</span>
        </div>
        <button className="close-call-btn" onClick={endCall}>✕</button>
      </div>

      {error && <div className="call-error"><p>{error}</p></div>}

      <div className="video-container">
        <div className="remote-video-wrapper">
          {remoteStream ? (
            <video ref={remoteVideoRef} autoPlay playsInline className="remote-video" />
          ) : (
            <div className="no-remote-video">
              <div className="avatar-placeholder">
                {isConnecting ? (
                  <div className="connecting-animation"><div className="spinner"></div><p>Connecting...</p></div>
                ) : (
                  <div className="waiting-message"><p>Waiting for other participant</p></div>
                )}
              </div>
            </div>
          )}
        </div>
        <div className="local-video-wrapper">
          <video ref={localVideoRef} autoPlay playsInline muted className="local-video" />
          {isVideoMuted && <div className="video-muted-overlay"><span>📹</span></div>}
        </div>
      </div>

      <div className="call-controls">
        <button className={`control-btn ${isAudioMuted ? 'muted' : ''}`} onClick={toggleAudio}>
          {isAudioMuted ? '🔇' : '🔊'}
        </button>
        <button className={`control-btn ${isVideoMuted ? 'muted' : ''}`} onClick={toggleVideo}>
          {isVideoMuted ? '📷' : '📹'}
        </button>
        <button className="control-btn end-call-btn" onClick={endCall}>📞</button>
      </div>
    </div>
  );
};

export default VideoCall;