import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import '../Css_for_all/VideoCall.css';
import { getApiUrl, getSocketUrl, API_CONFIG } from '../config/api';

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
  const socketRef = useRef(null);

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
      // Initialize socket connection
      const SOCKET_URL = getSocketUrl('DOCTOR');
      socketRef.current = io(SOCKET_URL, {
        transports: ['websocket', 'polling'],
        timeout: 20000,
        forceNew: true
      });

      setupSocketListeners();
      
      // Get user media
      await initializeMedia();
      
      // Join video call room
      socketRef.current.emit('join_video_call', {
        appointmentId,
        userId: currentUser.id,
        userType,
        userName: currentUser.name
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
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
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

    socket.on('connect', () => {
      console.log('✅ Connected to video call server');
    });

    socket.on('video_call_joined', (data) => {
      console.log('👥 Joined video call room:', data);
      setCallStatus('Waiting for other participant...');
    });

    socket.on('user_joined_call', (data) => {
      console.log('👤 Other user joined call:', data);
      setOtherUserOnline(true);
      setCallStatus('Connecting...');
      setIsConnecting(true);
      
      // If we're the second person to join, initiate the call
      if (data.initiator) {
        initiateCall();
      }
    });

    socket.on('user_left_call', (data) => {
      console.log('👤 User left call:', data);
      setOtherUserOnline(false);
      setCallStatus('Other participant left the call');
      setIsCallActive(false);
      setRemoteStream(null);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = null;
      }
    });

    socket.on('webrtc_offer', async (data) => {
      console.log('📞 Received offer');
      await handleOffer(data.offer);
    });

    socket.on('webrtc_answer', async (data) => {
      console.log('📞 Received answer');
      await handleAnswer(data.answer);
    });

    socket.on('webrtc_ice_candidate', async (data) => {
      console.log('🧊 Received ICE candidate');
      await handleIceCandidate(data.candidate);
    });

    socket.on('call_ended', () => {
      console.log('📞 Call ended by other user');
      setCallStatus('Call ended');
      endCall();
    });

    socket.on('video_call_error', (error) => {
      console.error('Video call error:', error);
      setError(error.message || 'Video call error occurred');
    });
  };

  const createPeerConnection = () => {
    const peerConnection = new RTCPeerConnection(pcConfig);
    
    // Add local stream to peer connection
    if (localStream) {
      localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStream);
      });
    }

    // Handle remote stream
    peerConnection.ontrack = (event) => {
      console.log('📺 Received remote stream');
      const [remoteStream] = event.streams;
      setRemoteStream(remoteStream);
      
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
      }
      
      setIsCallActive(true);
      setIsConnecting(false);
      setCallStatus('Connected');
    };

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        console.log('🧊 Sending ICE candidate');
        socketRef.current.emit('webrtc_ice_candidate', {
          appointmentId,
          candidate: event.candidate
        });
      }
    };

    // Handle connection state changes
    peerConnection.onconnectionstatechange = () => {
      console.log('Connection state:', peerConnection.connectionState);
      
      switch (peerConnection.connectionState) {
        case 'connected':
          setCallStatus('Connected');
          setIsCallActive(true);
          setIsConnecting(false);
          break;
        case 'disconnected':
          setCallStatus('Connection lost');
          break;
        case 'failed':
          setCallStatus('Connection failed');
          setError('Failed to establish connection');
          break;
        case 'closed':
          setCallStatus('Call ended');
          setIsCallActive(false);
          break;
      }
    };

    return peerConnection;
  };

  const initiateCall = async () => {
    try {
      peerConnectionRef.current = createPeerConnection();
      
      const offer = await peerConnectionRef.current.createOffer();
      await peerConnectionRef.current.setLocalDescription(offer);
      
      console.log('📞 Sending offer');
      socketRef.current.emit('webrtc_offer', {
        appointmentId,
        offer
      });
    } catch (error) {
      console.error('Error initiating call:', error);
      setError('Failed to initiate call');
    }
  };

  const handleOffer = async (offer) => {
    try {
      if (!peerConnectionRef.current) {
        peerConnectionRef.current = createPeerConnection();
      }
      
      await peerConnectionRef.current.setRemoteDescription(offer);
      const answer = await peerConnectionRef.current.createAnswer();
      await peerConnectionRef.current.setLocalDescription(answer);
      
      console.log('📞 Sending answer');
      socketRef.current.emit('webrtc_answer', {
        appointmentId,
        answer
      });
    } catch (error) {
      console.error('Error handling offer:', error);
      setError('Failed to accept call');
    }
  };

  const handleAnswer = async (answer) => {
    try {
      await peerConnectionRef.current.setRemoteDescription(answer);
    } catch (error) {
      console.error('Error handling answer:', error);
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
      // Notify backend that call is ending
      await fetch(getApiUrl(`${API_CONFIG.ENDPOINTS.LIVE}/call/end/${appointmentId}`, 'USER'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, userType })
      });

      // Notify other user via socket
      if (socketRef.current) {
        socketRef.current.emit('end_video_call', { appointmentId });
      }

      cleanup();
      onClose();
    } catch (error) {
      console.error('Error ending call:', error);
      cleanup();
      onClose();
    }
  };

  const cleanup = () => {
    // Stop local stream
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }

    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }

    // Disconnect socket
    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    // Reset states
    setLocalStream(null);
    setRemoteStream(null);
    setIsCallActive(false);
    setIsConnecting(false);
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

      {error && (
        <div className="call-error">
          <p>{error}</p>
          <button onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}

      <div className="video-container">
        <div className="remote-video-wrapper">
          {remoteStream ? (
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="remote-video"
            />
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
                    {!otherUserOnline && <small>They need to join the call</small>}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="local-video-wrapper">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="local-video"
          />
          {isVideoMuted && (
            <div className="video-muted-overlay">
              <span>📹</span>
            </div>
          )}
        </div>
      </div>

      <div className="call-controls">
        <button
          className={`control-btn audio-btn ${isAudioMuted ? 'muted' : ''}`}
          onClick={toggleAudio}
          title={isAudioMuted ? 'Unmute Audio' : 'Mute Audio'}
        >
          {isAudioMuted ? '🔇' : '🔊'}
        </button>

        <button
          className={`control-btn video-btn ${isVideoMuted ? 'muted' : ''}`}
          onClick={toggleVideo}
          title={isVideoMuted ? 'Turn On Video' : 'Turn Off Video'}
        >
          {isVideoMuted ? '📹' : '📷'}
        </button>

        <button
          className="control-btn end-call-btn"
          onClick={endCall}
          title="End Call"
        >
          📞
        </button>
      </div>
    </div>
  );
};

export default VideoCall;