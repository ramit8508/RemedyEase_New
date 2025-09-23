import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import '../Css_for_all/LiveChat.css';
import { getApiUrl, getSocketUrl, API_CONFIG } from '../config/api';

const LiveChat = ({ appointmentId, currentUser, userType, onClose }) => {
  // Message state management
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  
  // Typing indicators
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  
  // Connection states  
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Refs for DOM manipulation and cleanup
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const chatContainerRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Socket connection setup - this was tricky to get right
  useEffect(() => {
    const SOCKET_URL = getSocketUrl('DOCTOR');
    
    socketRef.current = io(SOCKET_URL, {
      transports: ['websocket', 'polling'], // Fallback to polling if websocket fails
      timeout: 20000,
      forceNew: true
    });

    const socket = socketRef.current;

    // Connection events
    socket.on('connect', () => {
      console.log('✅ Chat connected successfully');
      setIsConnected(true);
      setLoading(false);
      
      // Join the specific appointment chat room
      socket.emit('join_chat', {
        appointmentId,
        userId: currentUser.id,
        userType,
        userName: currentUser.name
      });
    });

    socket.on('disconnect', () => {
      console.log('❌ Chat disconnected');
      setIsConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection failed:', error);
      setError('Failed to connect to chat server');
      setLoading(false);
    });

    // Message handling
    socket.on('chat_message_received', (messageData) => {
      console.log('📨 Received message:', messageData);
      setMessages(prev => [...prev, messageData]);
    });

    // Typing indicators - these add a nice touch to UX
    socket.on('user_typing', (data) => {
      if (data.userId !== currentUser.id) {
        setOtherUserTyping(true);
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
          setOtherUserTyping(false);
        }, 3000);
      }
    });

    socket.on('user_stopped_typing', (data) => {
      if (data.userId !== currentUser.id) {
        setOtherUserTyping(false);
      }
    });

    socket.on('chat_joined', (data) => {
      console.log('👥 User joined chat:', data);
    });

    socket.on('chat_error', (error) => {
      console.error('Chat error:', error);
      setError(error.message || 'Chat error occurred');
    });

    return () => {
      if (socket) {
        socket.disconnect();
      }
      clearTimeout(typingTimeoutRef.current);
    };
  }, [appointmentId, currentUser, userType]);

  // Load chat history when component mounts
  useEffect(() => {
    const loadChatHistory = async () => {
      try {
        const response = await fetch(getApiUrl(`${API_CONFIG.ENDPOINTS.LIVE}/chat/history/${appointmentId}`, 'USER'));
        if (response.ok) {
          const data = await response.json();
          setMessages(data.data || []);
        }
      } catch (error) {
        console.error('Failed to load chat history:', error);
        // Don't show error to user for this - just start with empty chat
      }
    };

    if (appointmentId) {
      loadChatHistory();
    }
  }, [appointmentId]);

  // Handle typing indicators with debouncing
  const handleTyping = () => {
    if (!isTyping && socketRef.current) {
      setIsTyping(true);
      socketRef.current.emit('typing', {
        appointmentId,
        userId: currentUser.id,
        userType
      });
    }

    // Debounce typing indicator
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      if (socketRef.current) {
        socketRef.current.emit('stopped_typing', {
          appointmentId,
          userId: currentUser.id,
          userType
        });
      }
      setIsTyping(false);
    }, 2000);
  };

  // Send message function with proper error handling
  const sendMessage = async () => {
    if (!newMessage.trim() || !socketRef.current) return;

    const messageData = {
      appointmentId,
      senderId: currentUser.id,
      senderType: userType,
      senderName: currentUser.name,
      content: newMessage.trim(),
      timestamp: new Date()
    };

    try {
      // Send to backend first for persistence
      const response = await fetch(getApiUrl(`${API_CONFIG.ENDPOINTS.LIVE}/chat/send`, 'USER'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messageData),
      });

      if (response.ok) {
        // Then emit to socket for real-time delivery
        socketRef.current.emit('send_chat_message', messageData);
        setNewMessage('');
        
        // Stop typing indicator
        if (isTyping) {
          socketRef.current.emit('stopped_typing', {
            appointmentId,
            userId: currentUser.id,
            userType
          });
          setIsTyping(false);
        }
      } else {
        throw new Error('Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message. Please try again.');
      // Auto-clear error after 5 seconds
      setTimeout(() => setError(null), 5000);
    }
  };

  // Handle key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    } else if (e.key !== 'Enter') {
      handleTyping();
    }
  };

  // Format timestamp
  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (loading) {
    return (
      <div className="live-chat-loading">
        <div className="loading-spinner"></div>
        <p>Connecting to chat...</p>
      </div>
    );
  }

  return (
    <div className="live-chat-container">
      <div className="live-chat-header">
        <div className="chat-info">
          <h3>Live Chat</h3>
          <div className="connection-status">
            <span className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}></span>
            {isConnected ? 'Connected' : 'Disconnected'}
          </div>
        </div>
        <button className="close-chat-btn" onClick={onClose}>✕</button>
      </div>

      {error && (
        <div className="chat-error">
          <p>{error}</p>
          <button onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}

      <div className="chat-messages" ref={chatContainerRef}>
        {messages.length === 0 ? (
          <div className="no-messages">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={index}
              className={`message ${
                message.senderId === currentUser.id ? 'own-message' : 'other-message'
              }`}
            >
              <div className="message-info">
                <span className="sender-name">{message.senderName}</span>
                <span className="message-time">{formatTime(message.timestamp)}</span>
              </div>
              <div className="message-content">{message.content}</div>
            </div>
          ))
        )}
        
        {otherUserTyping && (
          <div className="typing-indicator">
            <span>Other user is typing</span>
            <div className="typing-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-container">
        <div className="chat-input-wrapper">
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            className="chat-input"
            rows="2"
            disabled={!isConnected}
          />
          <button
            onClick={sendMessage}
            disabled={!newMessage.trim() || !isConnected}
            className="send-message-btn"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default LiveChat;