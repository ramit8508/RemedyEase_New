import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import io from "socket.io-client";
import {
  FiSearch,
  FiSend,
  FiArrowLeft,
  FiUserCheck,
  FiCalendar,
  FiClock,
  FiVideo,
  FiCheck,
  FiAlertCircle,
  FiPlusCircle,
  FiShield,
  FiRefreshCw,
  FiMessageSquare,
} from "react-icons/fi";
import VideoCall from "../../components/VideoCall";
import "../../Css_for_all/Chat.css";

const SOCKET_URL = import.meta.env.VITE_DOCTOR_BACKEND_URL || "";
const API_BASE = import.meta.env.VITE_DOCTOR_BACKEND_URL || "";

export default function Chat() {
  const navigate = useNavigate();
  const location = useLocation();

  // Authentication State
  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user")) || {};
    } catch {
      return {};
    }
  }, []);

  const userEmail = user?.email || localStorage.getItem("userEmail") || "";

  // Core States
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [error, setError] = useState("");
  const [showVideoCall, setShowVideoCall] = useState(false);

  // Mobile View state: 'sidebar' or 'chat'
  const [mobileView, setMobileView] = useState("sidebar");

  // Socket and DOM Refs
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const isMountedRef = useRef(true);

  // Helper to get initials
  const getInitials = (name = "") => {
    const parts = name.replace(/^Dr\.\s*/i, "").trim().split(/\s+/);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return (parts[0]?.[0] || "D").toUpperCase();
  };

  // 1. Fetch Conversations List
  const fetchConversations = useCallback(async (silent = false) => {
    if (!userEmail) {
      setLoading(false);
      setError("Please sign in to view your doctor conversations.");
      return;
    }

    if (!silent) setLoading(true);
    setError("");

    const targetAptId =
      location.state?.activeAppointmentId ||
      location.state?.appointmentId ||
      new URLSearchParams(location.search).get("appointmentId");

    try {
      const res = await fetch(`/api/v1/live/chat/conversations/${userEmail}`);
      const data = await res.json();

      if (isMountedRef.current) {
        if (res.ok && data.success) {
          const list = Array.isArray(data.data) ? data.data : [];
          setConversations(list);

          if (targetAptId) {
            const found = list.find((c) => c.appointmentId === targetAptId);
            if (found) {
              setSelectedConversation(found);
              setMobileView("chat");
              return;
            }
          }

          // If no conversation selected and on desktop, default to the first conversation
          setSelectedConversation((prev) => {
            if (prev) {
              const updated = list.find((c) => c.appointmentId === prev.appointmentId);
              return updated || prev;
            }
            if (window.innerWidth > 820 && list.length > 0) {
              return list[0];
            }
            return null;
          });
        } else {
          setError(data.message || "Failed to load conversations.");
        }
      }
    } catch (err) {
      console.error("Fetch conversations error:", err);
      if (isMountedRef.current) {
        setError("Unable to connect to chat service. Please check your internet connection.");
      }
    } finally {
      if (isMountedRef.current && !silent) {
        setLoading(false);
      }
    }
  }, [location.search, location.state, userEmail]);

  // Initial conversations load
  useEffect(() => {
    isMountedRef.current = true;
    fetchConversations();

    return () => {
      isMountedRef.current = false;
    };
  }, [fetchConversations]);

  // 2. Fetch Messages for Selected Conversation
  const fetchMessages = useCallback(async (appointmentId) => {
    if (!appointmentId) return;
    setLoadingMessages(true);

    try {
      const res = await fetch(`/api/v1/live/chat/history/${appointmentId}`);
      const data = await res.json();

      if (isMountedRef.current && res.ok && data.success) {
        setMessages(Array.isArray(data.data) ? data.data : []);
      }
    } catch (err) {
      console.error("Fetch messages error:", err);
    } finally {
      if (isMountedRef.current) {
        setLoadingMessages(false);
      }
    }
  }, []);

  // 3. Mark Messages as Read
  const markAsRead = useCallback(async (appointmentId) => {
    if (!appointmentId) return;
    try {
      await fetch(`/api/v1/live/chat/read/${appointmentId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ readerType: "user" }),
      });
      // Locally clear unread count
      setConversations((prev) =>
        prev.map((c) => (c.appointmentId === appointmentId ? { ...c, unreadCount: 0 } : c))
      );
    } catch (err) {
      console.warn("Mark as read error:", err);
    }
  }, []);

  // 4. Socket and Message Sync for Active Conversation
  useEffect(() => {
    if (!selectedConversation?.appointmentId || !selectedConversation?.chatRoomId) {
      setMessages([]);
      return;
    }

    const { appointmentId, chatRoomId } = selectedConversation;

    // Load message history
    fetchMessages(appointmentId);
    markAsRead(appointmentId);

    // Initialize Socket
    try {
      socketRef.current = io(SOCKET_URL, {
        transports: ["websocket", "polling"],
        reconnectionAttempts: 5,
      });

      const socket = socketRef.current;

      socket.on("connect", () => {
        socket.emit("join-appointment-room", {
          appointmentId,
          chatRoomId,
          callRoomId: selectedConversation.callRoomId,
        });
      });

      socket.on("receive-chat-message", (incomingMsg) => {
        if (incomingMsg.appointmentId === appointmentId) {
          setMessages((prev) => {
            // Avoid duplicate messages
            const exists = prev.some(
              (m) =>
                (m._id && m._id === incomingMsg._id) ||
                (m.timestamp === incomingMsg.timestamp && m.message === incomingMsg.message)
            );
            if (exists) return prev;
            return [...prev, incomingMsg];
          });
          markAsRead(appointmentId);
        }
      });
    } catch (err) {
      console.warn("Socket initialization error:", err);
    }

    // Fallback polling interval (every 4s) to ensure messages sync even if socket drops
    const pollInterval = setInterval(() => {
      fetchMessages(appointmentId);
    }, 4000);

    return () => {
      clearInterval(pollInterval);
      if (socketRef.current) {
        socketRef.current.off("receive-chat-message");
        socketRef.current.disconnect();
      }
    };
  }, [selectedConversation, fetchMessages, markAsRead]);

  // Auto-scroll to bottom of message list
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 5. Send Message Handler (with instant optimistic render + HTTP fallback)
  const handleSendMessage = async (e) => {
    e?.preventDefault();
    const text = newMessage.trim();
    if (!text || !selectedConversation || sendingMessage) return;

    const currentSenderName = user.fullname || user.name || "Patient";
    const timestamp = new Date().toISOString();

    const optimisticMessage = {
      _id: `temp_${Date.now()}`,
      appointmentId: selectedConversation.appointmentId,
      chatRoomId: selectedConversation.chatRoomId,
      senderId: userEmail,
      senderName: currentSenderName,
      senderType: "user",
      message: text,
      messageType: "text",
      createdAt: timestamp,
      timestamp,
      isRead: false,
    };

    // Optimistically append message
    setMessages((prev) => [...prev, optimisticMessage]);
    setNewMessage("");
    setSendingMessage(true);

    // Update conversation preview snippet in sidebar
    setConversations((prev) =>
      prev.map((c) =>
        c.appointmentId === selectedConversation.appointmentId
          ? {
              ...c,
              lastMessage: {
                message: text,
                senderType: "user",
                createdAt: timestamp,
              },
            }
          : c
      )
    );

    // 1. Emit to Socket if connected
    if (socketRef.current?.connected) {
      socketRef.current.emit("send-chat-message", optimisticMessage);
    }

    // 2. Persist via REST API
    try {
      const res = await fetch(`/api/v1/live/chat/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointmentId: selectedConversation.appointmentId,
          message: text,
          messageType: "text",
          senderId: userEmail,
          senderName: currentSenderName,
          senderType: "user",
        }),
      });

      if (!res.ok) {
        console.warn("Message REST sync issue:", await res.text());
      }
    } catch (err) {
      console.error("Message send error:", err);
    } finally {
      if (isMountedRef.current) {
        setSendingMessage(false);
      }
    }
  };

  // Filter conversations based on search term
  const filteredConversations = useMemo(() => {
    if (!searchTerm.trim()) return conversations;
    const term = searchTerm.toLowerCase();
    return conversations.filter(
      (c) =>
        c.doctorName?.toLowerCase().includes(term) ||
        c.doctorSpecialization?.toLowerCase().includes(term) ||
        c.lastMessage?.message?.toLowerCase().includes(term)
    );
  }, [conversations, searchTerm]);

  // Format Helpers
  const formatTime = (ts) => {
    if (!ts) return "";
    const date = new Date(ts);
    if (isNaN(date.getTime())) return "";
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatDateLabel = (ts) => {
    if (!ts) return "";
    const date = new Date(ts);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
    return date.toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" });
  };

  return (
    <div className="pc-container">
      <div className="pc-workspace">
        {/* ============================================================
            LEFT PANEL — CONVERSATIONS SIDEBAR
            ============================================================ */}
        <aside
          className={`pc-sidebar ${
            mobileView === "chat" && selectedConversation ? "pc-sidebar--hidden" : ""
          }`}
        >
          {/* Header */}
          <div className="pc-sidebar-header">
            <div className="pc-sidebar-title-row">
              <h2 className="pc-sidebar-title">
                <FiMessageSquare size={20} color="#16a34a" /> Messages
              </h2>
              <span className="pc-sidebar-badge">{conversations.length} Consultations</span>
            </div>

            {/* Search Box */}
            <div className="pc-search-box">
              <FiSearch className="pc-search-icon" />
              <input
                type="text"
                className="pc-search-input"
                placeholder="Search doctors, specializations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* New Consultation CTA */}
            <Link to="/user/dashboard/Meetdoctor" className="pc-btn-new-chat">
              <FiPlusCircle size={15} /> Start New Consultation
            </Link>
          </div>

          {/* Conversations List */}
          <div className="pc-conv-list">
            {loading ? (
              <div style={{ padding: "30px 20px", textAlign: "center", color: "#64748b" }}>
                <div className="hr-spinner" style={{ width: "28px", height: "28px" }} />
                <p style={{ fontSize: "13px", marginTop: "10px" }}>Loading your conversations...</p>
              </div>
            ) : error ? (
              <div style={{ padding: "30px 20px", textAlign: "center" }}>
                <FiAlertCircle size={24} color="#dc2626" />
                <p style={{ fontSize: "13.5px", color: "#b91c1c", margin: "8px 0 14px" }}>{error}</p>
                <button
                  type="button"
                  className="ms-btn-cart"
                  style={{ fontSize: "12px", padding: "6px 14px" }}
                  onClick={() => fetchConversations()}
                >
                  <FiRefreshCw size={13} /> Retry
                </button>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div style={{ padding: "40px 20px", textAlign: "center", color: "#64748b" }}>
                <span style={{ fontSize: "32px", display: "block", marginBottom: "8px" }}>💬</span>
                <strong style={{ display: "block", fontSize: "14.5px", color: "#0f172a", marginBottom: "4px" }}>
                  {searchTerm ? "No matching conversations" : "No consultations yet"}
                </strong>
                <p style={{ fontSize: "13px", margin: "0 0 16px", lineHeight: "1.4" }}>
                  {searchTerm
                    ? "Try searching for a different doctor name or specialization."
                    : "Connect with a verified doctor to begin a secure medical consultation."}
                </p>
                {!searchTerm && (
                  <Link to="/user/dashboard/Meetdoctor" className="ms-btn-checkout" style={{ fontSize: "13px", padding: "8px 16px" }}>
                    Find a Doctor
                  </Link>
                )}
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const isSelected = selectedConversation?.appointmentId === conv.appointmentId;
                const lastMsg = conv.lastMessage;
                const initials = getInitials(conv.doctorName);

                return (
                  <div
                    key={conv.appointmentId}
                    className={`pc-conv-item ${isSelected ? "pc-conv-item--active" : ""}`}
                    onClick={() => {
                      setSelectedConversation(conv);
                      setMobileView("chat");
                    }}
                  >
                    {/* Avatar */}
                    <div className="pc-avatar-wrap">
                      {conv.doctorAvatar ? (
                        <img src={conv.doctorAvatar} alt={conv.doctorName} className="pc-avatar" />
                      ) : (
                        <div className="pc-avatar-fallback">{initials}</div>
                      )}
                      {conv.doctorOnline && <span className="pc-online-dot" />}
                    </div>

                    {/* Details */}
                    <div className="pc-conv-details">
                      <div className="pc-conv-top-row">
                        <span className="pc-conv-doctor-name">Dr. {conv.doctorName}</span>
                        <span className="pc-conv-time">
                          {formatTime(lastMsg?.createdAt || conv.appointmentDate)}
                        </span>
                      </div>

                      <div className="pc-conv-spec">{conv.doctorSpecialization}</div>

                      <div className="pc-conv-bottom-row">
                        <span
                          className={`pc-conv-last-msg ${
                            conv.unreadCount > 0 ? "pc-conv-last-msg--unread" : ""
                          }`}
                        >
                          {lastMsg
                            ? lastMsg.senderType === "user"
                              ? `You: ${lastMsg.message}`
                              : lastMsg.message
                            : "Click to start consultation"}
                        </span>

                        {conv.unreadCount > 0 && (
                          <span className="pc-unread-badge">{conv.unreadCount}</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </aside>

        {/* ============================================================
            RIGHT PANEL — ACTIVE CHAT VIEWPORT
            ============================================================ */}
        <main
          className={`pc-chat-viewport ${
            mobileView === "sidebar" ? "pc-chat-viewport--hidden" : ""
          }`}
        >
          {selectedConversation ? (
            <>
              {/* Header */}
              <div className="pc-chat-header">
                <div className="pc-chat-doctor-meta">
                  <button
                    type="button"
                    className="pc-btn-back"
                    onClick={() => setMobileView("sidebar")}
                    title="Back to conversations"
                  >
                    <FiArrowLeft />
                  </button>

                  <div className="pc-avatar-wrap">
                    {selectedConversation.doctorAvatar ? (
                      <img
                        src={selectedConversation.doctorAvatar}
                        alt={selectedConversation.doctorName}
                        className="pc-avatar"
                        style={{ width: "38px", height: "38px" }}
                      />
                    ) : (
                      <div className="pc-avatar-fallback" style={{ width: "38px", height: "38px" }}>
                        {getInitials(selectedConversation.doctorName)}
                      </div>
                    )}
                    {selectedConversation.doctorOnline && <span className="pc-online-dot" />}
                  </div>

                  <div className="pc-chat-doctor-title">
                    <h3>
                      Dr. {selectedConversation.doctorName}
                      <FiUserCheck size={14} color="#16a34a" title="Verified Practitioner" />
                    </h3>
                    <p>
                      {selectedConversation.doctorSpecialization} •{" "}
                      {selectedConversation.doctorOnline ? "🟢 Online" : "🟡 In Clinic"}
                    </p>
                  </div>
                </div>

                <div className="pc-chat-actions">
                  <button
                    type="button"
                    className="pc-btn-header-action"
                    style={{ background: "#16a34a", color: "#ffffff", borderColor: "#16a34a" }}
                    onClick={() => setShowVideoCall(true)}
                    title="Launch Video Consultation"
                  >
                    <FiVideo size={14} /> Video Call
                  </button>
                  <Link
                    to="/user/dashboard/Appointments"
                    className="pc-btn-header-action"
                    title="View / Schedule Appointments"
                  >
                    <FiCalendar size={14} /> Schedule
                  </Link>
                </div>
              </div>

              {/* Appointment Context Ribbon */}
              <div className="pc-appt-ribbon">
                <span>
                  📅 Consultation Date: <strong>{selectedConversation.appointmentDate}</strong> at{" "}
                  <strong>{selectedConversation.appointmentTime}</strong>
                </span>
                <span style={{ textTransform: "capitalize", fontWeight: "700" }}>
                  Status: {selectedConversation.status}
                </span>
              </div>

              {/* Messages Stream */}
              <div className="pc-messages-area">
                {loadingMessages ? (
                  <div style={{ padding: "40px 20px", textAlign: "center", color: "#64748b" }}>
                    <div className="hr-spinner" style={{ width: "24px", height: "24px" }} />
                    <p style={{ fontSize: "13px", marginTop: "8px" }}>Loading messages...</p>
                  </div>
                ) : messages.length === 0 ? (
                  <div style={{ padding: "60px 20px", textAlign: "center", color: "#64748b" }}>
                    <span style={{ fontSize: "36px", display: "block", marginBottom: "8px" }}>🩺</span>
                    <h4 style={{ fontFamily: "Manrope", color: "#0f172a", margin: "0 0 6px" }}>
                      Direct Consultation with Dr. {selectedConversation.doctorName}
                    </h4>
                    <p style={{ fontSize: "13.5px", maxWidth: "420px", margin: "0 auto 16px" }}>
                      You can describe your symptoms, ask health questions, or share medical history.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="pc-date-separator">
                      <span className="pc-date-chip">
                        {formatDateLabel(messages[0]?.createdAt || messages[0]?.timestamp)}
                      </span>
                    </div>

                    {messages.map((msg, index) => {
                      const isPatient = msg.senderType === "user";
                      return (
                        <div
                          key={msg._id || index}
                          className={`pc-msg-row ${
                            isPatient ? "pc-msg-row--patient" : "pc-msg-row--doctor"
                          }`}
                        >
                          <div className="pc-msg-bubble">
                            {!isPatient && (
                              <div className="pc-msg-sender">Dr. {selectedConversation.doctorName}</div>
                            )}
                            <p className="pc-msg-text">{msg.message}</p>
                            <div className="pc-msg-meta">
                              <span>{formatTime(msg.createdAt || msg.timestamp)}</span>
                              {isPatient && (
                                <span>{msg.isRead ? "✓✓" : <FiCheck size={13} />}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Bar */}
              <div className="pc-input-bar">
                <form className="pc-input-form" onSubmit={handleSendMessage}>
                  <input
                    type="text"
                    className="pc-input-field"
                    placeholder="Type your message to the doctor (Press Enter to send)..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    disabled={sendingMessage}
                  />
                  <button
                    type="submit"
                    className="pc-btn-send"
                    disabled={!newMessage.trim() || sendingMessage}
                    title="Send message"
                  >
                    <FiSend size={16} />
                  </button>
                </form>
                <div className="pc-security-note">
                  <FiShield size={11} style={{ verticalAlign: "middle", marginRight: "3px" }} />
                  End-to-end encrypted healthcare consultation
                </div>
              </div>
            </>
          ) : (
            <div className="pc-empty-viewport">
              <div className="pc-empty-icon">💬</div>
              <h3>Select a Conversation</h3>
              <p>
                Choose a doctor from your consultations on the left to review messages or start a new clinical discussion.
              </p>
              <Link to="/user/dashboard/Meetdoctor" className="ms-btn-checkout">
                Find a Doctor
              </Link>
            </div>
          )}
        </main>
      </div>

      {/* Video Consultation Modal */}
      {showVideoCall && selectedConversation && (
        <VideoCall
          appointmentId={selectedConversation.appointmentId}
          currentUser={user}
          userType="patient"
          onClose={() => setShowVideoCall(false)}
        />
      )}
    </div>
  );
}