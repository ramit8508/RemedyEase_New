import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  FiSend,
  FiSearch,
  FiUser,
  FiClock,
  FiCalendar,
  FiCheck,
  FiPaperclip,
  FiRefreshCw,
  FiMessageSquare,
  FiFileText,
  FiVideo,
  FiArrowLeft,
  FiEye,
  FiActivity,
  FiInfo,
} from "react-icons/fi";
import { io } from "socket.io-client";
import VideoCall from "../../components/VideoCall";
import "../../Css_for_all/DoctorChat.css";
import "../../Css_for_all/DoctorDashboard.css";

const DOCTOR_BACKEND_URL = import.meta.env.VITE_DOCTOR_BACKEND_URL || "";

export default function DoctorChat() {
  const navigate = useNavigate();
  const location = useLocation();

  let doctor = null;
  try {
    doctor = JSON.parse(localStorage.getItem("doctor"));
  } catch {}

  const doctorEmail = doctor?.email;

  // Data states
  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [loadingConv, setLoadingConv] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [sendError, setSendError] = useState("");
  const [failedMessage, setFailedMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [socketConnected, setSocketConnected] = useState(false);
  const [showVideoCall, setShowVideoCall] = useState(false);

  // Mobile state: 'list' or 'chat'
  const [mobileView, setMobileView] = useState("list");

  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const activeConvRef = useRef(null);

  useEffect(() => {
    activeConvRef.current = activeConv;
  }, [activeConv]);

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch all doctor conversations
  const fetchConversations = useCallback(async (silent = false) => {
    if (!doctorEmail) {
      setLoadingConv(false);
      return;
    }

    const targetAptId =
      location.state?.activeAppointmentId ||
      location.state?.appointmentId ||
      new URLSearchParams(location.search).get("appointmentId");

    if (!silent) setLoadingConv(true);

    try {
      const res = await fetch(`/api/v1/live/chat/doctor-conversations/${doctorEmail}`);
      const data = await res.json();

      let convList = [];
      if (data.success && Array.isArray(data.data)) {
        convList = data.data;
      } else {
        // Fallback: fetch doctor appointments
        const apptRes = await fetch(`/api/v1/appointments/doctor/${doctorEmail}`);
        const apptData = await apptRes.json();
        if (apptData.success && Array.isArray(apptData.data)) {
          convList = apptData.data.map((a) => ({
            appointmentId: a._id,
            chatRoomId: a.chatRoomId,
            callRoomId: a.callRoomId,
            userName: a.userName || a.userEmail?.split("@")[0] || "Patient",
            userEmail: a.userEmail,
            doctorEmail: a.doctorEmail,
            doctorName: a.doctorName,
            appointmentDate: a.date,
            appointmentTime: a.time,
            status: a.status,
            symptoms: a.symptoms,
            lastMessage: null,
            unreadCount: 0,
          }));
        }
      }

      setConversations(convList);

      if (targetAptId) {
        const found = convList.find((c) => c.appointmentId === targetAptId);
        if (found) {
          setActiveConv(found);
          setMobileView("chat");
          return;
        }
      }

      if (!activeConvRef.current && convList.length > 0) {
        setActiveConv(convList[0]);
      }
    } catch (err) {
      console.error("Doctor conversations fetch error:", err);
    } finally {
      if (!silent) setLoadingConv(false);
    }
  }, [doctorEmail, location.search, location.state]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Fetch messages for active conversation
  const fetchMessages = useCallback(async (aptId) => {
    if (!aptId) return;
    setLoadingMessages(true);
    setSendError("");

    try {
      const res = await fetch(`/api/v1/live/chat/history/${aptId}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setMessages(data.data);
      } else {
        setMessages([]);
      }

      // Mark messages as read by doctor
      fetch(`/api/v1/live/chat/read/${aptId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ readerType: "doctor" }),
      }).catch(() => {});

      // Clear local unread count for this conversation
      setConversations((prev) =>
        prev.map((c) => (c.appointmentId === aptId ? { ...c, unreadCount: 0 } : c))
      );
    } catch (err) {
      console.error("Fetch messages error:", err);
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  useEffect(() => {
    if (activeConv?.appointmentId) {
      fetchMessages(activeConv.appointmentId);
    }
  }, [activeConv?.appointmentId, fetchMessages]);

  // Socket.IO Connection
  useEffect(() => {
    const socketUrl = DOCTOR_BACKEND_URL || window.location.origin;
    const socket = io(socketUrl, {
      transports: ["websocket", "polling"],
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setSocketConnected(true);
      if (activeConvRef.current) {
        socket.emit("join-appointment-room", {
          appointmentId: activeConvRef.current.appointmentId,
          chatRoomId: activeConvRef.current.chatRoomId,
          callRoomId: activeConvRef.current.callRoomId,
          userId: doctorEmail,
          userName: `Dr. ${doctor?.fullname || "Doctor"}`,
          userType: "doctor",
        });
      }
    });

    socket.on("disconnect", () => {
      setSocketConnected(false);
    });

    socket.on("receive-chat-message", (newMsg) => {
      const currentActive = activeConvRef.current;
      if (currentActive && newMsg.appointmentId === currentActive.appointmentId) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === newMsg._id)) return prev;
          return [...prev, newMsg];
        });

        // Mark as read immediately since conversation is open
        fetch(`/api/v1/live/chat/read/${currentActive.appointmentId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ readerType: "doctor" }),
        }).catch(() => {});
      }

      // Update conversations list with latest message and unread count
      setConversations((prev) =>
        prev.map((c) => {
          if (c.appointmentId === newMsg.appointmentId) {
            const isCurrent = currentActive?.appointmentId === newMsg.appointmentId;
            return {
              ...c,
              lastMessage: newMsg,
              unreadCount: isCurrent ? 0 : (c.unreadCount || 0) + 1,
            };
          }
          return c;
        })
      );
    });

    socket.on("unread-count-changed", () => {
      fetchConversations(true);
    });

    return () => {
      socket.disconnect();
    };
  }, [doctor?.fullname, doctorEmail, fetchConversations]);

  // Join room when active conversation changes
  useEffect(() => {
    if (socketRef.current && activeConv) {
      socketRef.current.emit("join-appointment-room", {
        appointmentId: activeConv.appointmentId,
        chatRoomId: activeConv.chatRoomId,
        callRoomId: activeConv.callRoomId,
        userId: doctorEmail,
        userName: `Dr. ${doctor?.fullname || "Doctor"}`,
        userType: "doctor",
      });
    }
  }, [activeConv, doctor?.fullname, doctorEmail]);

  // Send Message
  const handleSendMessage = async (e, retryText = null) => {
    if (e) e.preventDefault();
    const text = (retryText !== null ? retryText : inputValue).trim();
    if (!text || !activeConv || sendingMessage) return;

    if (retryText === null) setInputValue("");
    setSendingMessage(true);
    setSendError("");

    const tempMsg = {
      _id: `temp-${Date.now()}`,
      appointmentId: activeConv.appointmentId,
      chatRoomId: activeConv.chatRoomId,
      senderId: doctorEmail,
      senderName: `Dr. ${doctor?.fullname || "Doctor"}`,
      senderType: "doctor",
      message: text,
      createdAt: new Date().toISOString(),
      isRead: false,
    };

    setMessages((prev) => [...prev, tempMsg]);

    // Emit over socket immediately
    if (socketRef.current) {
      socketRef.current.emit("send-chat-message", {
        chatRoomId: activeConv.chatRoomId,
        appointmentId: activeConv.appointmentId,
        senderId: doctorEmail,
        senderName: `Dr. ${doctor?.fullname || "Doctor"}`,
        senderType: "doctor",
        message: text,
        createdAt: new Date().toISOString(),
      });
    }

    try {
      const res = await fetch("/api/v1/live/chat/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointmentId: activeConv.appointmentId,
          message: text,
          senderId: doctorEmail,
          senderName: `Dr. ${doctor?.fullname || "Doctor"}`,
          senderType: "doctor",
        }),
      });

      const data = await res.json();
      if (data.success && data.data) {
        setMessages((prev) =>
          prev.map((m) => (m._id === tempMsg._id ? data.data : m))
        );
        // Update conversation last message in list
        setConversations((prev) =>
          prev.map((c) =>
            c.appointmentId === activeConv.appointmentId
              ? { ...c, lastMessage: data.data }
              : c
          )
        );
      } else {
        throw new Error(data.message || "Sending failed");
      }
    } catch (err) {
      console.error("Error sending message:", err);
      setSendError("Message could not be sent. Please try again.");
      setFailedMessage(text);
    } finally {
      setSendingMessage(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Filter conversations
  const filteredConversations = conversations.filter((c) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      c.userName?.toLowerCase().includes(q) ||
      c.userEmail?.toLowerCase().includes(q) ||
      c.symptoms?.toLowerCase().includes(q)
    );
  });

  const formatMessageTime = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return isNaN(d.getTime())
      ? ""
      : d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="dc-container">
      <div className="dc-workspace">
        {/* ─── 1. LEFT PANEL: Conversations Sidebar ─── */}
        <aside
          className={`dc-sidebar ${mobileView === "chat" ? "dc-sidebar--hidden" : ""}`}
        >
          <div className="dc-sidebar-header">
            <div className="dc-sidebar-title-row">
              <h2 className="dc-sidebar-title">
                Messages <span className="dc-sidebar-count">{filteredConversations.length}</span>
              </h2>
              <button
                type="button"
                className="dd-btn-action"
                onClick={fetchConversations}
                title="Refresh conversations"
              >
                <FiRefreshCw size={12} className={loadingConv ? "hr-spin" : ""} />
              </button>
            </div>

            <div className="dc-search-wrap">
              <FiSearch className="dc-search-icon" />
              <input
                type="text"
                placeholder="Search patient or symptoms..."
                className="dc-search-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="dc-conv-list">
            {loadingConv ? (
              <div style={{ textAlign: "center", padding: "40px 16px" }}>
                <div className="hr-spinner" style={{ width: "24px", height: "24px" }} />
                <p style={{ fontSize: "12px", color: "#64748b", marginTop: "8px" }}>
                  Loading patient chats...
                </p>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 16px", color: "#64748b", fontSize: "12.5px" }}>
                No active conversations found.
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const isSelected = activeConv?.appointmentId === conv.appointmentId;
                return (
                  <div
                    key={conv.appointmentId}
                    className={`dc-conv-item ${isSelected ? "dc-conv-item--active" : ""} ${
                      conv.unreadCount > 0 ? "dc-conv-item--unread" : ""
                    }`}
                    onClick={() => {
                      setActiveConv(conv);
                      setMobileView("chat");
                    }}
                  >
                    <div className="dc-avatar">
                      {conv.userName?.charAt(0) || "P"}
                      <span className="dc-avatar-dot" />
                    </div>

                    <div className="dc-conv-body">
                      <div className="dc-conv-top">
                        <span className="dc-conv-name">{conv.userName}</span>
                        <span className="dc-conv-time">
                          {conv.appointmentTime || conv.appointmentDate}
                        </span>
                      </div>

                      <div className="dc-conv-bottom">
                        <p className="dc-conv-preview">
                          {conv.lastMessage?.message || conv.symptoms || "Clinical consultation room"}
                        </p>
                        {conv.unreadCount > 0 && (
                          <span className="dc-unread-badge">{conv.unreadCount}</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </aside>

        {/* ─── 2. CENTER PANEL: Main Active Chat Area ─── */}
        <section
          className={`dc-chat-main ${mobileView === "list" ? "dc-chat-main--hidden" : ""}`}
        >
          {activeConv ? (
            <>
              {/* Header */}
              <div className="dc-chat-header">
                <div className="dc-chat-header-left">
                  <button
                    type="button"
                    className="dc-back-mobile-btn"
                    onClick={() => setMobileView("list")}
                    title="Back to conversation list"
                  >
                    <FiArrowLeft size={18} />
                  </button>

                  <div className="dc-avatar" style={{ width: "38px", height: "38px" }}>
                    {activeConv.userName?.charAt(0) || "P"}
                    <span className="dc-avatar-dot" />
                  </div>

                  <div className="dc-chat-doc-info">
                    <h3>Chat with {activeConv.userName}</h3>
                    <span>
                      <strong style={{ color: "#16a34a" }}>● Active Consultation</strong> • {activeConv.appointmentDate} at {activeConv.appointmentTime}
                    </span>
                  </div>
                </div>

                <div className="dc-chat-header-actions">
                  <span className={`dd-badge dd-badge--${activeConv.status || "confirmed"}`}>
                    {activeConv.status || "confirmed"}
                  </span>
                  <button
                    type="button"
                    className="dd-btn-action dd-btn-action--approve"
                    onClick={() => setShowVideoCall(true)}
                    title="Return to Video Consultation"
                  >
                    <FiVideo size={13} /> Video Call
                  </button>
                  <Link
                    to="/doctor/dashboard/history"
                    className="dd-btn-action"
                    title="Open medical history"
                  >
                    <FiFileText size={13} /> History
                  </Link>
                </div>
              </div>

              {/* Consultation Context Ribbon */}
              <div className="dc-context-banner">
                <div className="dc-context-item">
                  <FiCalendar size={12} color="#16a34a" />
                  <span>
                    <strong>Date:</strong> {activeConv.appointmentDate} • {activeConv.appointmentTime}
                  </span>
                </div>
                <div className="dc-context-item">
                  <FiActivity size={12} color="#2563eb" />
                  <span>
                    <strong>Chief Complaint:</strong> {activeConv.symptoms || "General Outpatient Care"}
                  </span>
                </div>
              </div>

              {/* Messages Viewport */}
              <div className="dc-messages-viewport">
                {loadingMessages ? (
                  <div style={{ textAlign: "center", padding: "40px" }}>
                    <div className="hr-spinner" style={{ width: "24px", height: "24px" }} />
                    <p style={{ fontSize: "12.5px", color: "#64748b", marginTop: "8px" }}>
                      Loading consultation messages...
                    </p>
                  </div>
                ) : messages.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "60px 20px" }}>
                    <FiMessageSquare size={38} color="#16a34a" style={{ opacity: 0.6 }} />
                    <h4 style={{ margin: "10px 0 4px", color: "#0f172a", fontSize: "15px" }}>
                      Start clinical consultation with {activeConv.userName}
                    </h4>
                    <p style={{ color: "#64748b", fontSize: "13px", margin: 0 }}>
                      Send advice, prescriptions, or clinical notes directly to the patient.
                    </p>
                  </div>
                ) : (
                  messages.map((msg, index) => {
                    const isDoctor = msg.senderType === "doctor";
                    return (
                      <div
                        key={msg._id || index}
                        className={`dc-bubble-row ${
                          isDoctor ? "dc-bubble-row--doctor" : "dc-bubble-row--patient"
                        }`}
                      >
                        <div
                          className={`dc-bubble-msg ${
                            isDoctor ? "dc-bubble-msg--doctor" : "dc-bubble-msg--patient"
                          }`}
                        >
                          <div>{msg.message}</div>
                          <div className="dc-bubble-meta">
                            <span>{formatMessageTime(msg.createdAt)}</span>
                            {isDoctor && <FiCheck size={11} />}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Inline Send Error Banner */}
              {sendError && (
                <div
                  style={{
                    background: "#fef2f2",
                    border: "1px solid #fecaca",
                    borderRadius: "8px",
                    padding: "8px 14px",
                    margin: "0 16px 8px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    color: "#b91c1c",
                    fontSize: "12.5px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <FiAlertCircle size={14} />
                    <span>{sendError}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSendMessage(null, failedMessage)}
                    style={{
                      background: "#dc2626",
                      color: "#fff",
                      border: "none",
                      borderRadius: "6px",
                      padding: "4px 10px",
                      fontSize: "11px",
                      cursor: "pointer",
                      fontWeight: "700",
                    }}
                  >
                    Retry
                  </button>
                </div>
              )}

              {/* Message Composer */}
              <div className="dc-composer-wrapper">
                <form onSubmit={handleSendMessage} className="dc-composer-form">
                  <textarea
                    rows={1}
                    placeholder="Type a clinical message... (Press Enter to send)"
                    className="dc-composer-textarea"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                  />
                  <button
                    type="submit"
                    className="dc-send-btn"
                    disabled={!inputValue.trim() || sendingMessage}
                    title="Send message"
                  >
                    <FiSend size={14} />
                  </button>
                </form>
                <div className="dc-security-text">
                  🔒 Messages are encrypted and stored securely in the patient's medical record.
                </div>
              </div>
            </>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", color: "#64748b" }}>
              <FiMessageSquare size={48} color="#cbd5e1" />
              <h3 style={{ fontSize: "16px", color: "#0f172a", margin: "14px 0 4px" }}>
                No conversation selected
              </h3>
              <p style={{ fontSize: "13px", color: "#64748b" }}>
                Select a patient consultation on the left to start messaging.
              </p>
            </div>
          )}
        </section>

        {/* ─── 3. RIGHT PANEL: Patient Details & Context ─── */}
        {activeConv && (
          <aside className="dc-patient-panel">
            <h4 className="dc-panel-header">Patient Details</h4>

            <div className="dc-panel-profile">
              <div className="dc-panel-avatar">
                {activeConv.userName?.charAt(0) || "P"}
              </div>
              <h3 className="dc-panel-name">{activeConv.userName}</h3>
              <p className="dc-panel-email">{activeConv.userEmail}</p>
            </div>

            <div>
              <div className="dc-panel-section-title">Consultation Schedule</div>
              <div className="dc-panel-card-box">
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                  <FiCalendar size={12} color="#16a34a" />
                  <strong>{activeConv.appointmentDate}</strong>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <FiClock size={12} color="#64748b" />
                  <span>{activeConv.appointmentTime}</span>
                </div>
              </div>
            </div>

            <div>
              <div className="dc-panel-section-title">Reported Symptoms</div>
              <div className="dc-panel-card-box" style={{ lineHeight: "1.4" }}>
                {activeConv.symptoms || "No specific symptoms reported on booking."}
              </div>
            </div>

            <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: "8px" }}>
              <Link
                to="/doctor/dashboard/history"
                className="dd-btn-action dd-btn-action--approve"
                style={{ justifyContent: "center", padding: "10px" }}
              >
                <FiFileText size={14} /> View Medical History
              </Link>
            </div>
          </aside>
        )}
      </div>

      {/* Video Consultation Modal */}
      {showVideoCall && activeConv && (
        <VideoCall
          appointmentId={activeConv.appointmentId}
          currentUser={doctor}
          userType="doctor"
          onClose={() => setShowVideoCall(false)}
        />
      )}
    </div>
  );
}
