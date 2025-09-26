import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import '../Css_for_all/VideoCall.css';

// NOTE: We connect the socket directly. On Vercel, this will connect to the same
// origin as the frontend. Your vercel.json rewrite rules will handle routing it.
// On local, it connects to your Vite dev server, and the vite.config.js proxy handles it.
const socket = io();

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
  const [callStatus, setCallStatus] = useState('Waiting for connection...');
  const [error, setError] = useState(null);
  const [otherUserOnline, setOtherUserOnline] = useState(false);

  // Refs for video elements and WebRTC connection
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const socketRef = useRef(socket); // Use the globally created socket

  // WebRTC configuration with STUN servers for NAT traversal
  const pcConfig = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ],
  };

  useEffect(() => {
    initializeCall();
    return () => {
      cleanup();
    };
  }, []);

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
    socket.on('video_call_joined', (data) => setCallStatus('Waiting for other participant...'));
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
    socket.on('webrtc_offer', async (data) => await handleOffer(data.offer));
    socket.on('webrtc_answer', async (data) => await handleAnswer(data.answer));
    socket.on('webrtc_ice_candidate', async (data) => await handleIceCandidate(data.candidate));
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
      const [remoteStream] = event.streams;
      setRemoteStream(remoteStream);
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream;
      setIsCallActive(true);
      setIsConnecting(false);
      setCallStatus('Connected');
    };

    peerConnection.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        socketRef.current.emit('webrtc_ice_candidate', { appointmentId, candidate: event.candidate });
      }
    };

    peerConnection.onconnectionstatechange = () => {
      // Handle connection state changes...
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
      if (peerConnectionRef.current) await peerConnectionRef.current.addIceCandidate(candidate);
    } catch (error) {
      console.error('Error handling ICE candidate:', error);
    }
  };

  const toggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoMuted(!videoTrack.enabled);
      }
    }
  };

  const endCall = async () => {
    try {
      // Use direct API path, which will be handled by proxy/rewrites
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
    // We don't disconnect the global socket, just leave the room
    if (socketRef.current) socketRef.current.emit('leave_video_call', { appointmentId });

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
