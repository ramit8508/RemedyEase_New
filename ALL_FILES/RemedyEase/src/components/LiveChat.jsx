import React from 'react';
import { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';

// Get the backend URL from environment variables
const SOCKET_URL = import.meta.env.VITE_DOCTOR_BACKEND_URL;

export default function LiveChat({ appointmentId, currentUser, userType, onClose }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);

  useEffect(() => {
    // Explicitly connect to the backend server
    socketRef.current = io(SOCKET_URL, {
        transports: ['websocket', 'polling'],
        reconnectionAttempts: 5,
    });

    const socket = socketRef.current;

    const fetchHistory = async () => {
      try {
        const res = await fetch(`/api/v1/live/chat/history/${appointmentId}`);
        const data = await res.json();
        if (data.success) {
          setMessages(data.data || []);
        }
      } catch (error) {
        console.error("Failed to fetch chat history:", error);
      }
    };
    fetchHistory();

    socket.emit('join_chat', appointmentId);
    socket.on('receive_message', (message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    });

    return () => {
      socket.off('receive_message');
      socket.emit('leave_chat', appointmentId);
      socket.disconnect();
    };
  }, [appointmentId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim() === '') return;

    const messageData = {
      appointmentId,
      senderId: currentUser.id || currentUser.email,
      senderName: currentUser.name || currentUser.fullname,
      senderType: userType,
      message: newMessage,
      messageType: 'text',
      timestamp: new Date().toISOString(),
    };

    socketRef.current.emit('send_message', messageData);
    setMessages((prevMessages) => [...prevMessages, messageData]);
    setNewMessage('');
  };

  return (
    <div className="live-chat-container">
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

