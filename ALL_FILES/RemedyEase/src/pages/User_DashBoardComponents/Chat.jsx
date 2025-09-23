import React, { useState, useEffect } from 'react';
import LiveChat from '../../components/LiveChat';
import '../../Css_for_all/Chat.css';

export default function Chat() {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showLiveChat, setShowLiveChat] = useState(false);
  const [error, setError] = useState('');

  const user = JSON.parse(localStorage.getItem("user"));
  const userEmail = user?.email;

  useEffect(() => {
    if (userEmail) {
      fetchChatConversations();
    }
  }, [userEmail]);

  const fetchChatConversations = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/v1/live/chat/conversations/${userEmail}`);
      const data = await response.json();
      
      if (data.success) {
        setConversations(data.data);
      } else {
        setError('Failed to load chat conversations');
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
      setError('Error loading conversations');
    } finally {
      setLoading(false);
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.doctorName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const openChatWithDoctor = (conversation) => {
    setSelectedConversation(conversation);
    setShowLiveChat(true);
  };

  const closeLiveChat = () => {
    setShowLiveChat(false);
    setSelectedConversation(null);
    // Refresh conversations to get updated last messages
    fetchChatConversations();
  };

  if (loading) {
    return (
      <div className="chat-container">
        <div className="chat-loading">
          <div className="loading-spinner"></div>
          <p>Loading your conversations...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="chat-container">
        <div className="chat-error">
          <h3>❌ Error</h3>
          <p>{error}</p>
          <button onClick={fetchChatConversations} className="retry-btn">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-container">
      {showLiveChat ? (
        <LiveChat
          appointmentId={selectedConversation.appointmentId}
          currentUser={user}
          userType="user"
          onClose={closeLiveChat}
        />
      ) : (
        <>
          <div className="chat-header">
            <h2>💬 Your Chat History</h2>
            <p>All your conversations with doctors</p>
          </div>

          <div className="chat-search">
            <input
              type="text"
              placeholder="🔍 Search by doctor name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          {filteredConversations.length === 0 ? (
            <div className="no-conversations">
              <div className="no-conversations-icon">💬</div>
              <h3>No Chat History Found</h3>
              <p>
                {searchTerm 
                  ? `No conversations found matching "${searchTerm}"`
                  : "You haven't started any chats with doctors yet. Book an appointment and start chatting!"
                }
              </p>
            </div>
          ) : (
            <div className="conversations-list">
              {filteredConversations.map((conversation) => (
                <div
                  key={conversation.appointmentId}
                  className="conversation-card"
                  onClick={() => openChatWithDoctor(conversation)}
                >
                  <div className="conversation-header">
                    <div className="doctor-info">
                      <h4>Dr. {conversation.doctorName}</h4>
                      <span className="appointment-date">
                        📅 {formatDate(conversation.appointmentDate)} at {conversation.appointmentTime}
                      </span>
                    </div>
                    <div className="conversation-meta">
                      <span className={`status ${conversation.status}`}>
                        {conversation.status}
                      </span>
                      <span className="message-count">
                        {conversation.messageCount} messages
                      </span>
                    </div>
                  </div>
                  
                  <div className="last-message">
                    <div className="message-preview">
                      <span className="sender">
                        {conversation.lastMessage.senderType === 'user' ? 'You' : `Dr. ${conversation.doctorName}`}:
                      </span>
                      <span className="message-text">
                        {conversation.lastMessage.messageType === 'text' 
                          ? conversation.lastMessage.message
                          : `📎 ${conversation.lastMessage.fileName || 'File'}`
                        }
                      </span>
                    </div>
                    <div className="message-time">
                      {formatTime(conversation.lastMessage.timestamp)}
                    </div>
                  </div>
                  
                  <div className="conversation-actions">
                    <button className="view-chat-btn">
                      💬 View Chat
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

