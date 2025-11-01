import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import '../Css_for_all/LiveChat.css';

// Get the backend URL from environment variables
const SOCKET_URL = import.meta.env.VITE_DOCTOR_BACKEND_URL || "";
const API_BASE = import.meta.env.VITE_DOCTOR_BACKEND_URL || "";

export default function LiveChat({ appointmentId, currentUser, userType, onClose }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [appointment, setAppointment] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null); // Use ref to hold the socket instance

  useEffect(() => {
    // First fetch the appointment to get the real chatRoomId
    fetch(`${API_BASE}/api/v1/appointments/${appointmentId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data) {
          setAppointment(data.data);
          console.log('Appointment loaded:', data.data);
        } else {
          console.error('Failed to load appointment:', data);
        }
      })
      .catch(error => console.error("Failed to fetch appointment:", error))
      .finally(() => setIsLoading(false));
  }, [appointmentId]);

  useEffect(() => {
    if (!appointment || !appointment.chatRoomId) {
      console.log('Waiting for appointment data...');
      return;
    }

    console.log('Setting up socket with chatRoomId:', appointment.chatRoomId);

    // We create the socket connection INSIDE useEffect.
    // This ensures it only connects when the component is actually on the screen.
    socketRef.current = io(SOCKET_URL, {
        transports: ['websocket', 'polling'],
        reconnectionAttempts: 5,
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      console.log('✅ Socket connected:', socket.id);
    });

    // Fetch chat history
    fetch(`${API_BASE}/api/v1/live/chat/history/${appointmentId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          console.log('Chat history loaded:', data.data);
          setMessages(data.data || []);
        }
      })
      .catch(error => console.error("Failed to fetch chat history:", error));

    // Setup socket event listeners
    socket.emit('join-appointment-room', {
      appointmentId: appointmentId,
      chatRoomId: appointment.chatRoomId,
      callRoomId: appointment.callRoomId
    });
    
    console.log('📥 Joining room:', appointment.chatRoomId);

    socket.on('receive-chat-message', (message) => {
      console.log('📨 Received message:', message);
      setMessages((prevMessages) => [...prevMessages, message]);
    });

    // This is the cleanup function. It runs when the component is removed.
    return () => {
      socket.off('receive-chat-message');
      socket.disconnect(); // Disconnect the socket
    };
  }, [appointmentId, appointment]); // Only run this effect when the appointmentId or appointment changes

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim() === '' || !socketRef.current || !appointment) return;

    const messageData = {
      appointmentId,
      chatRoomId: appointment.chatRoomId,
      senderId: currentUser.id || currentUser.email,
      senderName: currentUser.name || currentUser.fullname,
      senderType: userType,
      message: newMessage,
      messageType: 'text',
      timestamp: new Date().toISOString(),
    };

    console.log('📤 Sending message:', messageData);
    socketRef.current.emit('send-chat-message', messageData);
    setMessages((prevMessages) => [...prevMessages, messageData]);
    setNewMessage('');
  };

  if (isLoading) {
    return (
      <div className="live-chat-container" style={{ maxWidth: '700px', width: '100%', height: '750px' }}>
        <div className="chat-header">
          <h3>Live Chat</h3>
          <button onClick={onClose} className="close-btn">&times;</button>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '600px' }}>
          <p>Loading chat...</p>
        </div>
      </div>
    );
  }

  return (
  <div className="live-chat-container" style={{ maxWidth: '700px', width: '100%', height: '750px' }}>
      <div className="chat-header">
        <h3>Live Chat</h3>
        <button onClick={onClose} className="close-btn">&times;</button>
      </div>
      <div className="chat-messages">
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.senderType === userType ? 'sent' : 'received'}`}>
            <div className="message-sender">{msg.senderName}</div>
            <div className="message-bubble">{msg.message}</div>
            <div className="message-time">{new Date(msg.timestamp).toLocaleTimeString()}</div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form className="chat-input-form" onSubmit={handleSendMessage}>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type your message..."
          className="chat-input"
        />
        <button type="submit" className="send-btn">Send</button>
      </form>
    </div>
  );
}

