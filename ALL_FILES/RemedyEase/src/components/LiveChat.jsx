import React from  'react';
import { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';

// NOTE: We connect the socket directly. On Vercel, this will connect to the same
// origin as the frontend. Your vercel.json rewrite rules will handle routing it.
// On local, it connects to your Vite dev server, and the vite.config.js proxy handles it.
const socket = io(); 

export default function LiveChat({ appointmentId, currentUser, userType, onClose }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    // Fetch chat history when component mounts
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

    // Join the chat room
    socket.emit('join_chat', appointmentId);

    // Listen for incoming messages
    socket.on('receive_message', (message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    });

    // Cleanup on component unmount
    return () => {
      socket.off('receive_message');
      socket.emit('leave_chat', appointmentId);
    };
  }, [appointmentId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim() === '') return;

    const messageData = {
      appointmentId,
      senderId: currentUser.id,
      senderName: currentUser.name || currentUser.fullname,
      senderType: userType,
      message: newMessage,
      messageType: 'text',
      timestamp: new Date().toISOString(),
    };

    socket.emit('send_message', messageData);
    setMessages((prevMessages) => [...prevMessages, messageData]); // Optimistically add message
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
