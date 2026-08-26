import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  FiSend,
  FiSearch,
  FiUser,
  FiClock,
  FiCalendar,
  FiCheck,
  FiCheckCircle,
  FiPaperclip,
  FiRefreshCw,
  FiMessageSquare,
  FiFileText,
  FiVideo,
} from "react-icons/fi";
import { io } from "socket.io-client";
import "../../Css_for_all/Chat.css";

const DOCTOR_BACKEND_URL = import.meta.env.VITE_DOCTOR_BACKEND_URL || "";

export default function DoctorChat() {
  let doctor = null;
  try {
    doctor = JSON.parse(localStorage.getItem("doctor"));
  } catch {}

  const doctorEmail = doctor?.email;

  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [loadingConv, setLoadingConv] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [socketConnected, setSocketConnected] = useState(false);

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
  const fetchConversations = useCallback(async () => {
    if (!doctorEmail) {
      setLoadingConv(false);
      return;
    }

    try {
      const res = await fetch(`/api/v1/live/chat/doctor-conversations/${doctorEmail}`);
      const data = await res.json();

      if (data.success && Array.isArray(data.data)) {
        setConversations(data.data);
        // Select first conversation if none selected
        if (!activeConvRef.current && data.data.length > 0) {
          setActiveConv(data.data[0]);
        }
      } else {
        // Fallback: fetch appointments
        const apptRes = await fetch(`/api/v1/appointments/doctor/${doctorEmail}`);
        const apptData = await apptRes.json();
        if (apptData.success && Array.isArray(apptData.data)) {
          const mapped = apptData.data.map((a) => ({
            appointmentId: a._id,
            chatRoomId: a.chatRoomId,
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
          setConversations(mapped);
          if (!activeConvRef.current && mapped.length > 0) {
            setActiveConv(mapped[0]);
          }
        }
      }
    } catch (err) {
      console.error("Doctor conversations fetch error:", err);
    } finally {
      setLoadingConv(false);
    }
  }, [doctorEmail]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Fetch messages for active conversation
  const fetchMessages = useCallback(async (aptId) => {
    if (!aptId) return;
    setLoadingMessages(true);

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

  // Socket.IO Setup
  useEffect(() => {
    const socketUrl = DOCTOR_BACKEND_URL || window.location.origin;
    const socket = io(socketUrl, {
      transports: ["websocket", "polling"],
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setSocketConnected(true);
      if (activeConvRef.current?.chatRoomId) {
        socket.emit("join-chat-room", activeConvRef.current.chatRoomId);
      }
    });

    socket.on("disconnect", () => {
      setSocketConnected(false);
    });

    socket.on("receive-chat-message", (newMsg) => {
      if (
        activeConvRef.current &&
        newMsg.appointmentId === activeConvRef.current.appointmentId
      ) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === newMsg._id)) return prev;
          return [...prev, newMsg];
        });
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Join room when active conversation changes
  useEffect(() => {
    if (socketRef.current && activeConv?.chatRoomId) {
      socketRef.current.emit("join-chat-room", activeConv.chatRoomId);
    }
  }, [activeConv?.chatRoomId]);

  // Polling fallback
  useEffect(() => {
    const interval = setInterval(() => {
      if (activeConv?.appointmentId) {
        fetch(`/api/v1/live/chat/history/${activeConv.appointmentId}`)
          .then((r) => r.json())
          .then((data) => {
            if (data.success && Array.isArray(data.data)) {
              setMessages((prev) => (data.data.length !== prev.length ? data.data : prev));
            }
          })
          .catch(() => {});
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [activeConv?.appointmentId]);

  // Send Message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputValue.trim() || !activeConv) return;

    const text = inputValue.trim();
    setInputValue("");
    setSendingMessage(true);

    const tempMsg = {
      _id: `temp-${Date.now()}`,
      appointmentId: activeConv.appointmentId,
      senderId: doctorEmail,
      senderName: `Dr. ${doctor?.fullname || "Doctor"}`,
      senderType: "doctor",
      message: text,
      createdAt: new Date().toISOString(),
      isRead: false,
    };

    setMessages((prev) => [...prev, tempMsg]);

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
      }
    } catch (err) {
      console.error("Error sending message:", err);
    } finally {
      setSendingMessage(false);
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
    <div className="chat-container-pro" style={{ height: "calc(100vh - 120px)" }}>
      {/* ─── Sidebar Conversations ─── */}
      <div className="chat-sidebar-pro">
        <div className="chat-sidebar-header-pro">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <h2 className="chat-sidebar-title-pro" style={{ margin: 0 }}>
              Patient Consultations
            </h2>
            <button
              type="button"
              className="dd-btn-action"
              onClick={fetchConversations}
              title="Refresh chats"
            >
              <FiRefreshCw size={12} className={loadingConv ? "hr-spin" : ""} />
            </button>
          </div>

          <div className="chat-search-wrapper-pro">
            <FiSearch className="chat-search-icon-pro" />
            <input
              type="text"
              placeholder="Search patients..."
              className="chat-search-input-pro"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="chat-conv-list-pro">
          {loadingConv ? (
            <div style={{ textAlign: "center", padding: "40px 20px" }}>
              <div className="hr-spinner" style={{ width: "24px", height: "24px" }} />
              <p style={{ fontSize: "12.5px", color: "#64748b", marginTop: "8px" }}>Loading patient chats...</p>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 20px", color: "#64748b", fontSize: "13px" }}>
              No consultation chats found.
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const isSelected = activeConv?.appointmentId === conv.appointmentId;
              return (
                <div
                  key={conv.appointmentId}
                  className={`chat-conv-item-pro ${isSelected ? "chat-conv-item-active" : ""}`}
                  onClick={() => setActiveConv(conv)}
                >
                  <div className="chat-avatar-pro">
                    <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: "#dcfce7", color: "#15803d", fontWeight: "800", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "15px" }}>
                      {conv.userName?.charAt(0) || "P"}
                    </div>
                  </div>

                  <div className="chat-conv-content-pro">
                    <div className="chat-conv-top-row">
                      <h4 className="chat-conv-name-pro">{conv.userName}</h4>
                      <span className="chat-conv-time-pro">
                        {conv.appointmentTime || conv.appointmentDate}
                      </span>
                    </div>

                    <p className="chat-conv-preview-pro">
                      {conv.lastMessage?.message || conv.symptoms || "Consultation chat session"}
                    </p>
                  </div>

                  {conv.unreadCount > 0 && (
                    <span className="chat-unread-badge-pro">{conv.unreadCount}</span>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ─── Active Chat Window ─── */}
      <div className="chat-main-window-pro">
        {activeConv ? (
          <>
            {/* Header */}
            <div className="chat-header-pro">
              <div className="chat-header-doctor-info">
                <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: "#dcfce7", color: "#15803d", fontWeight: "800", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "15px" }}>
                  {activeConv.userName?.charAt(0) || "P"}
                </div>
                <div>
                  <h3 className="chat-header-doc-name">{activeConv.userName}</h3>
                  <span className="chat-header-doc-spec">
                    Consultation • {activeConv.appointmentDate} at {activeConv.appointmentTime}
                  </span>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span className={`dd-badge dd-badge--${activeConv.status || "confirmed"}`}>
                  {activeConv.status || "confirmed"}
                </span>
              </div>
            </div>

            {/* Messages */}
            <div className="chat-messages-viewport-pro">
              {loadingMessages ? (
                <div style={{ textAlign: "center", padding: "40px" }}>
                  <div className="hr-spinner" style={{ width: "24px", height: "24px" }} />
                  <p style={{ fontSize: "12.5px", color: "#64748b", marginTop: "8px" }}>Loading messages...</p>
                </div>
              ) : messages.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px 20px" }}>
                  <FiMessageSquare size={36} color="#16a34a" style={{ opacity: 0.6 }} />
                  <h4 style={{ margin: "10px 0 4px", color: "#0f172a", fontSize: "15px" }}>
                    Start clinical consultation with {activeConv.userName}
                  </h4>
                  <p style={{ color: "#64748b", fontSize: "13px", margin: 0 }}>
                    Messages sent here are encrypted and stored securely in the patient's medical record.
                  </p>
                </div>
              ) : (
                messages.map((msg, index) => {
                  const isDoctor = msg.senderType === "doctor";
                  return (
                    <div
                      key={msg._id || index}
                      className={`chat-bubble-row-pro ${isDoctor ? "chat-bubble-user-row" : "chat-bubble-doctor-row"}`}
                    >
                      <div className={`chat-bubble-pro ${isDoctor ? "chat-bubble-user" : "chat-bubble-doctor"}`}>
                        <div className="chat-bubble-text-pro">{msg.message}</div>
                        <div className="chat-bubble-meta-pro">
                          <span className="chat-bubble-time">{formatMessageTime(msg.createdAt)}</span>
                          {isDoctor && <FiCheck className="chat-tick-icon" />}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Composer */}
            <form onSubmit={handleSendMessage} className="chat-composer-pro">
              <input
                type="text"
                placeholder="Type clinical advice or consultation message..."
                className="chat-composer-input-pro"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
              />
              <button
                type="submit"
                className="chat-send-btn-pro"
                disabled={!inputValue.trim() || sendingMessage}
              >
                <FiSend size={15} />
              </button>
            </form>
          </>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", color: "#64748b" }}>
            <FiMessageSquare size={48} color="#94a3b8" />
            <p style={{ fontSize: "14px", marginTop: "12px", fontWeight: "600" }}>
              Select a patient consultation to view and send messages.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
