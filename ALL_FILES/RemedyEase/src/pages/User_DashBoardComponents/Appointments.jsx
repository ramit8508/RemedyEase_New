import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  FiCalendar,
  FiClock,
  FiUser,
  FiMapPin,
  FiAward,
  FiCheckCircle,
  FiAlertCircle,
  FiXCircle,
  FiChevronDown,
  FiArrowRight,
  FiMessageCircle,
  FiVideo,
  FiFileText,
  FiRotateCcw,
  FiCheck,
  FiX,
  FiInfo,
} from "react-icons/fi";
import "../../Css_for_all/Appointments.css";
import LiveChat from "../../components/LiveChat";
import VideoCall from "../../components/VideoCall";
import PrescriptionView from "../../components/PrescriptionView";

/* ─── Helpers ─── */
const apiBase = import.meta.env.VITE_DOCTOR_BACKEND_URL || "";

function formatDoctorName(name) {
  if (!name) return "Dr. Specialist";
  const clean = name.trim();
  if (/^dr\.?/i.test(clean)) {
    return clean.replace(/^dr\.?\s*/i, "Dr. ");
  }
  return `Dr. ${clean}`;
}

function formatSpecialization(spec) {
  if (!spec || spec.trim() === "" || spec.toLowerCase() === "not set" || spec.toLowerCase() === "nil") {
    return "General Physician";
  }
  return spec.trim();
}

function formatDegree(deg) {
  if (!deg || deg.trim() === "" || deg.toLowerCase() === "not set" || deg.toLowerCase() === "nil") {
    return "MBBS, MD";
  }
  return deg.trim();
}

function formatExperience(exp) {
  if (!exp || exp.trim() === "" || exp.toLowerCase() === "not set" || exp.toLowerCase() === "nil") {
    return "3+ years experience";
  }
  const clean = exp.trim();
  if (/\d+/.test(clean) && !/year/i.test(clean)) {
    return `${clean} years experience`;
  }
  return clean;
}

function formatClinic(clinic) {
  if (!clinic || clinic.trim() === "" || clinic.toLowerCase() === "not set" || clinic.toLowerCase() === "nil") {
    return "RemedyEase Partner Clinic";
  }
  return clinic.trim();
}

function parseDateChip(dateStr) {
  try {
    const [year, month, day] = dateStr.split("-").map(Number);
    const dateObj = new Date(year, month - 1, day);
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return {
      dayName: days[dateObj.getDay()] || "",
      dayNum: day || "",
      monthName: months[dateObj.getMonth()] || "",
      fullDate: dateStr,
    };
  } catch {
    return { dayName: "", dayNum: dateStr, monthName: "", fullDate: dateStr };
  }
}

export default function Appointments() {
  const location = useLocation();
  const navigate = useNavigate();
  const doctorFromState = location.state?.doctor;
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  // Doctors & Selection
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(doctorFromState || null);
  const [loadingDoctors, setLoadingDoctors] = useState(false);

  // Doctor-controlled Availability Data
  const [doctorTimeslotsData, setDoctorTimeslotsData] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [symptoms, setSymptoms] = useState("");

  // Booking process states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState("");
  const [bookingSuccess, setBookingSuccess] = useState(null);

  // Appointments History
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [historyFilter, setHistoryFilter] = useState("all");

  // Live / Modals
  const [showLiveChat, setShowLiveChat] = useState(false);
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [selectedAppointmentForLive, setSelectedAppointmentForLive] = useState(null);
  const [viewPrescriptionUrl, setViewPrescriptionUrl] = useState(null);

  const isMountedRef = useRef(true);

  /* ─── 1. Fetch Doctor List ─── */
  const fetchDoctors = useCallback(async () => {
    setLoadingDoctors(true);
    try {
      const res = await fetch("/api/v1/doctors/all");
      const data = await res.json();
      if (isMountedRef.current && data.success && Array.isArray(data.data)) {
        setDoctors(data.data);
        if (!selectedDoctor && data.data.length > 0 && !doctorFromState) {
          setSelectedDoctor(data.data[0]);
        }
      }
    } catch (err) {
      console.error("Failed to load doctors:", err);
    } finally {
      if (isMountedRef.current) setLoadingDoctors(false);
    }
  }, [selectedDoctor, doctorFromState]);

  /* ─── 2. Fetch Doctor-Controlled Timeslots ─── */
  const fetchDoctorTimeslots = useCallback(async (docId) => {
    if (!docId) {
      setDoctorTimeslotsData([]);
      return;
    }
    setLoadingSlots(true);
    try {
      const res = await fetch(`${apiBase}/api/v1/doctors/timeslots?doctorId=${docId}`);
      const data = await res.json();
      if (isMountedRef.current) {
        if (data.success && Array.isArray(data.data)) {
          setDoctorTimeslotsData(data.data);
          // Pre-select first date that has available slots
          const firstDateDoc = data.data.find(
            (d) => Array.isArray(d.slots) && d.slots.some((s) => !s.booked)
          );
          if (firstDateDoc) {
            setSelectedDate(firstDateDoc.date);
          } else if (data.data.length > 0) {
            setSelectedDate(data.data[0].date);
          } else {
            setSelectedDate("");
          }
          setSelectedTime("");
        } else {
          setDoctorTimeslotsData([]);
          setSelectedDate("");
          setSelectedTime("");
        }
      }
    } catch (err) {
      console.error("Failed to fetch doctor timeslots:", err);
      if (isMountedRef.current) setDoctorTimeslotsData([]);
    } finally {
      if (isMountedRef.current) setLoadingSlots(false);
    }
  }, []);

  /* ─── 3. Fetch Patient's Appointment History ─── */
  const fetchHistory = useCallback(async () => {
    if (!user?.email) {
      setLoadingHistory(false);
      return;
    }
    try {
      const res = await fetch(`${apiBase}/api/v1/appointments/user/${user.email}`);
      const data = await res.json();
      if (isMountedRef.current && data.success && Array.isArray(data.data)) {
        setHistory(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch appointment history:", err);
    } finally {
      if (isMountedRef.current) setLoadingHistory(false);
    }
  }, [user?.email]);

  useEffect(() => {
    isMountedRef.current = true;
    fetchDoctors();
    fetchHistory();
    return () => {
      isMountedRef.current = false;
    };
  }, [fetchDoctors, fetchHistory]);

  // When selected doctor changes, re-fetch their published timeslots
  useEffect(() => {
    if (selectedDoctor?._id) {
      fetchDoctorTimeslots(selectedDoctor._id);
    } else {
      setDoctorTimeslotsData([]);
      setSelectedDate("");
      setSelectedTime("");
    }
  }, [selectedDoctor, fetchDoctorTimeslots]);

  /* ─── Available Published Dates & Slots ─── */
  // Only published dates
  const availablePublishedDates = useMemo(() => {
    if (!Array.isArray(doctorTimeslotsData) || doctorTimeslotsData.length === 0) {
      return [];
    }
    return doctorTimeslotsData
      .filter((d) => d.date && Array.isArray(d.slots) && d.slots.length > 0)
      .map((d) => d.date)
      .sort();
  }, [doctorTimeslotsData]);

  // Available slots for selected date
  const slotsForSelectedDate = useMemo(() => {
    if (!selectedDate || !Array.isArray(doctorTimeslotsData)) return [];
    const dateDoc = doctorTimeslotsData.find((d) => d.date === selectedDate);
    if (!dateDoc || !Array.isArray(dateDoc.slots)) return [];
    return dateDoc.slots;
  }, [selectedDate, doctorTimeslotsData]);

  /* ─── Handle Appointment Confirmation ─── */
  const handleBookAppointment = async (e) => {
    e.preventDefault();
    if (!selectedDoctor || !selectedDate || !selectedTime) {
      setBookingError("Please choose a date and an available time slot.");
      return;
    }
    if (!user?.email) {
      navigate("/login");
      return;
    }

    setIsSubmitting(true);
    setBookingError("");

    const payload = {
      doctorId: selectedDoctor._id,
      doctorEmail: selectedDoctor.email,
      doctorName: selectedDoctor.fullname,
      date: selectedDate,
      time: selectedTime,
      userEmail: user.email,
      userName: user.fullname || user.email.split("@")[0],
      symptoms: symptoms.trim() || "General Consultation",
    };

    try {
      const res = await fetch(`${apiBase}/api/v1/appointments/book`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        const createdAppt = data.data;
        setBookingSuccess({
          appointmentId: createdAppt?._id || `APT-${Date.now().toString().slice(-6)}`,
          doctorName: formatDoctorName(selectedDoctor.fullname),
          doctorSpec: formatSpecialization(selectedDoctor.specialization),
          clinic: formatClinic(selectedDoctor.clinic),
          date: selectedDate,
          time: selectedTime,
          status: createdAppt?.status || "pending",
        });

        // Add to history optimistically
        if (createdAppt) {
          setHistory((prev) => [createdAppt, ...prev]);
        }

        // Re-fetch doctor timeslots so the booked slot immediately shows as Booked
        fetchDoctorTimeslots(selectedDoctor._id);
      } else {
        setBookingError(data.message || "Failed to book appointment. Please choose another slot.");
      }
    } catch (err) {
      setBookingError("Unable to connect to the appointment service. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ─── Handle Patient Cancel Appointment ─── */
  const handleCancelAppointment = async (apptId) => {
    if (!window.confirm("Are you sure you want to cancel this appointment?")) return;

    try {
      const res = await fetch(`${apiBase}/api/v1/appointments/cancel/${apptId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userEmail: user.email, reason: "Cancelled by patient" }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setHistory((prev) =>
          prev.map((a) => (a._id === apptId ? { ...a, status: "cancelled" } : a))
        );
        // Refresh doctor slots in case the cancelled slot is for the current doctor
        if (selectedDoctor?._id) {
          fetchDoctorTimeslots(selectedDoctor._id);
        }
      } else {
        alert(data.message || "Failed to cancel appointment.");
      }
    } catch (err) {
      alert("Error connecting to server.");
    }
  };

  /* ─── Live Consultation Actions ─── */
  const startLiveChat = async (appt) => {
    try {
      await fetch(`${apiBase}/api/v1/live/notify-doctor`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointmentId: appt._id,
          doctorEmail: appt.doctorEmail,
          patientName: user.fullname || user.email,
          sessionType: "chat",
          timestamp: new Date().toISOString(),
        }),
      });
    } catch (e) {
      console.error(e);
    }
    setSelectedAppointmentForLive(appt);
    setShowLiveChat(true);
  };

  const startVideoCall = async (appt) => {
    try {
      await fetch(`${apiBase}/api/v1/live/status/${appt._id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.email,
          userType: "patient",
          onlineStatus: true,
        }),
      });
      await fetch(`${apiBase}/api/v1/live/notify-doctor`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointmentId: appt._id,
          doctorEmail: appt.doctorEmail,
          patientName: user.fullname || user.email,
          sessionType: "video",
          timestamp: new Date().toISOString(),
        }),
      });
    } catch (e) {
      console.error(e);
    }
    setSelectedAppointmentForLive(appt);
    setShowVideoCall(true);
  };

  /* ─── Filtered Appointments History ─── */
  const filteredHistory = useMemo(() => {
    if (historyFilter === "upcoming") {
      return history.filter((a) => a.status === "pending" || a.status === "confirmed" || a.status === "approved");
    }
    if (historyFilter === "completed") {
      return history.filter((a) => a.status === "completed");
    }
    if (historyFilter === "cancelled") {
      return history.filter((a) => a.status === "cancelled");
    }
    return history;
  }, [history, historyFilter]);

  return (
    <div className="apt-page">
      {/* ── HERO HEADER ── */}
      <section className="apt-hero">
        <div className="apt-hero-inner">
          <span className="apt-eyebrow">
            <FiCalendar size={13} /> Appointment Booking
          </span>
          <h1 className="apt-hero-title">Book an Appointment</h1>
          <p className="apt-hero-desc">
            Select your doctor, view their real published availability, and reserve your consultation instantly.
          </p>
        </div>
      </section>

      <main className="apt-main">
        {/* ============================================================
            BOOKING WORKSPACE (TWO COLUMNS)
            ============================================================ */}
        {bookingSuccess ? (
          /* ── SUCCESS SCREEN ── */
          <div className="apt-success-screen">
            <div className="apt-success-icon">
              <FiCheck size={36} />
            </div>
            <h2 className="apt-success-title">Appointment Confirmed!</h2>
            <p className="apt-success-desc">
              Your consultation with <strong>{bookingSuccess.doctorName}</strong> ({bookingSuccess.doctorSpec}) has been successfully scheduled.
            </p>

            <div className="apt-success-details">
              <div>
                <span className="apt-success-meta-label">Booking ID</span>
                <p className="apt-success-meta-val">{bookingSuccess.appointmentId}</p>
              </div>
              <div>
                <span className="apt-success-meta-label">Status</span>
                <p className="apt-success-meta-val" style={{ color: "#16a34a", textTransform: "capitalize" }}>
                  {bookingSuccess.status}
                </p>
              </div>
              <div>
                <span className="apt-success-meta-label">Date</span>
                <p className="apt-success-meta-val">{bookingSuccess.date}</p>
              </div>
              <div>
                <span className="apt-success-meta-label">Time</span>
                <p className="apt-success-meta-val">{bookingSuccess.time}</p>
              </div>
            </div>

            <div className="apt-success-actions">
              <button
                className="apt-btn-switch-doc"
                onClick={() => {
                  setBookingSuccess(null);
                  setSelectedTime("");
                  setSymptoms("");
                }}
                type="button"
                style={{ padding: "12px 24px", fontSize: "14px" }}
              >
                Book Another Appointment
              </button>
              <button
                className="apt-btn-confirm"
                onClick={() => {
                  setBookingSuccess(null);
                  const el = document.getElementById("apt-history-anchor");
                  if (el) el.scrollIntoView({ behavior: "smooth" });
                }}
                type="button"
                style={{ width: "auto", padding: "12px 28px" }}
              >
                View in History <FiArrowRight size={16} />
              </button>
            </div>
          </div>
        ) : (
          /* ── ACTIVE BOOKING FORM ── */
          <div className="apt-booking-layout">
            {/* ── LEFT COLUMN: DOCTOR CARD & SELECTOR ── */}
            <aside className="apt-doctor-panel">
              <div className="apt-card">
                <h3 className="apt-panel-title">
                  <FiUser size={18} color="#16a34a" /> Select Doctor
                </h3>

                {/* Doctor Dropdown Selector */}
                <div className="apt-select-wrapper">
                  <select
                    className="apt-select"
                    value={selectedDoctor?._id || ""}
                    onChange={(e) => {
                      const doc = doctors.find((d) => d._id === e.target.value);
                      if (doc) setSelectedDoctor(doc);
                    }}
                    disabled={loadingDoctors}
                    aria-label="Select Doctor"
                  >
                    {doctors.map((d) => (
                      <option key={d._id} value={d._id}>
                        {formatDoctorName(d.fullname)} — {formatSpecialization(d.specialization)}
                      </option>
                    ))}
                  </select>
                  <FiChevronDown size={16} className="apt-select-chevron" />
                </div>

                {/* Compact Selected Doctor Profile Card */}
                {selectedDoctor && (
                  <div className="apt-doctor-card">
                    <div className="apt-doc-avatar-wrap">
                      <img
                        src={selectedDoctor.avatar || "/default-doctor.png"}
                        alt={selectedDoctor.fullname}
                        className="apt-doc-avatar"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "/default-doctor.png";
                        }}
                      />
                    </div>

                    <span className="apt-doc-verified">
                      <FiCheckCircle size={11} /> Verified Doctor
                    </span>

                    <h4 className="apt-doc-name">{formatDoctorName(selectedDoctor.fullname)}</h4>
                    <p className="apt-doc-spec">{formatSpecialization(selectedDoctor.specialization)}</p>

                    <div className="apt-doc-meta-grid">
                      <div className="apt-doc-meta-item">
                        <FiAward size={15} />
                        <span>{formatDegree(selectedDoctor.degree)}</span>
                      </div>
                      <div className="apt-doc-meta-item">
                        <FiClock size={15} />
                        <span>{formatExperience(selectedDoctor.experience)}</span>
                      </div>
                      <div className="apt-doc-meta-item">
                        <FiMapPin size={15} />
                        <span>{formatClinic(selectedDoctor.clinic)}</span>
                      </div>
                    </div>

                    <button
                      className="apt-change-doc-btn"
                      onClick={() => navigate("/user/dashboard/Meetdoctor")}
                      type="button"
                    >
                      Browse All Doctors
                    </button>
                  </div>
                )}
              </div>
            </aside>

            {/* ── RIGHT COLUMN: DOCTOR-CONTROLLED APPOINTMENT SLOTS PANEL ── */}
            <section className="apt-booking-panel">
              <form onSubmit={handleBookAppointment}>
                {/* ── STEP 1: AVAILABLE DATES ── */}
                <div className="apt-step-section">
                  <div className="apt-step-header">
                    <span className="apt-step-num">1</span>
                    <h3 className="apt-step-title">Select Available Date</h3>
                  </div>

                  {loadingSlots ? (
                    <div style={{ padding: "20px 0", color: "#6b7280", fontSize: "14px" }}>
                      Fetching doctor's published availability...
                    </div>
                  ) : availablePublishedDates.length === 0 ? (
                    /* DOCTOR HAS NO PUBLISHED SLOTS */
                    <div className="apt-no-slots-box">
                      <h4 className="apt-no-slots-title">No appointment slots available</h4>
                      <p className="apt-no-slots-desc">
                        This doctor hasn't published any appointment availability yet. Please check again later or choose another doctor.
                      </p>
                      <button
                        className="apt-btn-switch-doc"
                        onClick={() => navigate("/user/dashboard/Meetdoctor")}
                        type="button"
                      >
                        Choose Another Doctor
                      </button>
                    </div>
                  ) : (
                    /* RENDER ONLY DOCTOR PUBLISHED DATES */
                    <div className="apt-dates-carousel">
                      {availablePublishedDates.map((dateStr) => {
                        const parsed = parseDateChip(dateStr);
                        const isSelected = selectedDate === dateStr;
                        return (
                          <button
                            key={dateStr}
                            type="button"
                            className={`apt-date-chip ${isSelected ? "apt-date-chip--active" : ""}`}
                            onClick={() => {
                              setSelectedDate(dateStr);
                              setSelectedTime("");
                              setBookingError("");
                            }}
                          >
                            <span className="apt-date-day">{parsed.dayName}</span>
                            <span className="apt-date-num">{parsed.dayNum}</span>
                            <span className="apt-date-month">{parsed.monthName}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* ── STEP 2: AVAILABLE TIME SLOTS (DOCTOR-CONTROLLED ONLY) ── */}
                {selectedDate && availablePublishedDates.length > 0 && (
                  <div className="apt-step-section">
                    <div className="apt-step-header">
                      <span className="apt-step-num">2</span>
                      <h3 className="apt-step-title">
                        Available Times for {parseDateChip(selectedDate).dayName}, {selectedDate}
                      </h3>
                    </div>

                    {slotsForSelectedDate.length === 0 ? (
                      <p style={{ color: "#6b7280", fontSize: "14px" }}>
                        No slots published for this date. Please pick another date above.
                      </p>
                    ) : (
                      <div className="apt-slots-grid">
                        {slotsForSelectedDate.map((slotObj, idx) => {
                          const slotTime = typeof slotObj === "string" ? slotObj : slotObj.time;
                          const isBooked = typeof slotObj === "object" ? slotObj.booked : false;
                          const isSelected = selectedTime === slotTime;

                          return (
                            <button
                              key={idx}
                              type="button"
                              disabled={isBooked}
                              className={`apt-slot-btn ${isSelected ? "apt-slot-btn--active" : ""}`}
                              onClick={() => {
                                if (!isBooked) {
                                  setSelectedTime(slotTime);
                                  setBookingError("");
                                }
                              }}
                            >
                              <span>{slotTime}</span>
                              <span className="apt-slot-status-label">
                                {isBooked ? "Booked" : "Available"}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* ── STEP 3: REASON FOR CONSULTATION / SYMPTOMS ── */}
                {selectedTime && (
                  <div className="apt-step-section">
                    <div className="apt-step-header">
                      <span className="apt-step-num">3</span>
                      <h3 className="apt-step-title">Reason for Visit / Symptoms</h3>
                    </div>
                    <div className="apt-textarea-wrap">
                      <textarea
                        className="apt-textarea"
                        placeholder="Briefly describe your symptoms, existing medical conditions, or what you would like to discuss with the doctor..."
                        value={symptoms}
                        onChange={(e) => setSymptoms(e.target.value.slice(0, 500))}
                        maxLength={500}
                        rows={3}
                      />
                      <div className="apt-char-count">{symptoms.length} / 500</div>
                    </div>
                  </div>
                )}

                {/* ── STEP 4: APPOINTMENT SUMMARY & CONFIRMATION ── */}
                {selectedDate && selectedTime && selectedDoctor && (
                  <div className="apt-summary-card">
                    <h4 className="apt-summary-title">Appointment Summary</h4>
                    <div className="apt-summary-row">
                      <div className="apt-summary-item">
                        <FiUser size={15} />
                        <strong>Doctor:</strong> {formatDoctorName(selectedDoctor.fullname)}
                      </div>
                      <div className="apt-summary-item">
                        <FiAward size={15} />
                        <strong>Specialization:</strong> {formatSpecialization(selectedDoctor.specialization)}
                      </div>
                      <div className="apt-summary-item">
                        <FiCalendar size={15} />
                        <strong>Date:</strong> {selectedDate}
                      </div>
                      <div className="apt-summary-item">
                        <FiClock size={15} />
                        <strong>Time:</strong> {selectedTime}
                      </div>
                    </div>
                  </div>
                )}

                {bookingError && (
                  <div className="apt-error-banner" role="alert">
                    <FiAlertCircle size={16} />
                    <span>{bookingError}</span>
                  </div>
                )}

                {/* Confirm Button */}
                <button
                  type="submit"
                  className="apt-btn-confirm"
                  disabled={
                    isSubmitting ||
                    !selectedDoctor ||
                    !selectedDate ||
                    !selectedTime ||
                    availablePublishedDates.length === 0
                  }
                >
                  {isSubmitting ? (
                    <>
                      <span className="apt-spinner" />
                      <span>Confirming Appointment...</span>
                    </>
                  ) : (
                    <>
                      <span>Confirm Appointment</span>
                      <FiArrowRight size={17} />
                    </>
                  )}
                </button>
              </form>
            </section>
          </div>
        )}

        {/* ============================================================
            APPOINTMENTS HISTORY SECTION
            ============================================================ */}
        <section className="apt-history-section" id="apt-history-anchor">
          <div className="apt-history-header">
            <h2 className="apt-history-title">Your Appointments History</h2>

            {/* Filter Tabs */}
            <div className="apt-filter-tabs">
              {["all", "upcoming", "completed", "cancelled"].map((tab) => (
                <button
                  key={tab}
                  type="button"
                  className={`apt-tab-btn ${historyFilter === tab ? "apt-tab-btn--active" : ""}`}
                  onClick={() => setHistoryFilter(tab)}
                >
                  {tab === "all" ? "All" : tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {loadingHistory ? (
            <div style={{ textAlign: "center", padding: "40px", color: "#6b7280" }}>
              Loading your appointments history...
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="apt-empty-history">
              <div className="apt-empty-history-icon">
                <FiCalendar size={24} />
              </div>
              <h3 style={{ fontFamily: "Manrope", fontSize: "17px", color: "#0f172a", margin: "0 0 6px" }}>
                No appointments found
              </h3>
              <p style={{ fontSize: "14px", margin: 0 }}>
                {historyFilter === "all"
                  ? "You have not booked any appointments yet."
                  : `No ${historyFilter} appointments found.`}
              </p>
            </div>
          ) : (
            <div className="apt-history-list">
              {filteredHistory.map((appt) => {
                const parsed = parseDateChip(appt.date);
                const status = (appt.status || "pending").toLowerCase();
                const isCancellable = status === "pending" || status === "confirmed" || status === "approved";

                return (
                  <div className="apt-history-card" key={appt._id}>
                    {/* Left: Date Badge */}
                    <div className="apt-history-date-badge">
                      <span className="apt-history-month">{parsed.monthName || "DATE"}</span>
                      <span className="apt-history-day">{parsed.dayNum || "—"}</span>
                      <span className="apt-history-time">{appt.time}</span>
                    </div>

                    {/* Middle: Doctor Details & Symptoms */}
                    <div className="apt-history-info">
                      <h4 className="apt-history-doc-name">{formatDoctorName(appt.doctorName)}</h4>
                      <p className="apt-history-doc-spec">
                        {appt.doctorEmail} • <strong>ID:</strong> {appt._id?.slice(-6).toUpperCase()}
                      </p>
                      <p className="apt-history-symptoms">
                        <strong>Reason:</strong> {appt.symptoms || "General Consultation"}
                      </p>
                    </div>

                    {/* Right: Status Pill & Dynamic Actions */}
                    <div className="apt-history-actions">
                      <span className={`apt-status-badge apt-status--${status}`}>
                        {status === "confirmed" || status === "approved"
                          ? "🟢 Confirmed"
                          : status === "pending"
                          ? "🟡 Pending Confirmation"
                          : status === "cancelled"
                          ? "🔴 Cancelled"
                          : "⚪ Completed"}
                      </span>

                      <div className="apt-action-btns-row">
                        {/* Live Consultation Actions (when active or confirmed) */}
                        {(status === "confirmed" || status === "approved") && (
                          <>
                            <button
                              className="apt-btn-live-chat"
                              onClick={() => startLiveChat(appt)}
                              type="button"
                            >
                              <FiMessageCircle size={14} /> Live Chat
                            </button>
                            <button
                              className="apt-btn-live-video"
                              onClick={() => startVideoCall(appt)}
                              type="button"
                            >
                              <FiVideo size={14} /> Video Call
                            </button>
                          </>
                        )}

                        {/* Prescription Button */}
                        {appt.prescriptionFile && (
                          <button
                            className="apt-btn-prescription"
                            onClick={() => setViewPrescriptionUrl(appt.prescriptionFile)}
                            type="button"
                          >
                            <FiFileText size={14} /> Prescription
                          </button>
                        )}

                        {/* Cancel Appointment Button (only for active appointments) */}
                        {isCancellable && (
                          <button
                            className="apt-btn-cancel"
                            onClick={() => handleCancelAppointment(appt._id)}
                            type="button"
                          >
                            <FiX size={13} /> Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* ============================================================
          LIVE CHAT, VIDEO CALL & PRESCRIPTION MODALS (PRESERVED)
          ============================================================ */}
      {showLiveChat && selectedAppointmentForLive && (
        <div className="modal-overlay">
          <div className="modal-content">
            <LiveChat
              appointmentId={selectedAppointmentForLive._id}
              userType="patient"
              userId={user.email}
              userName={user.fullname || user.email}
              onClose={() => setShowLiveChat(false)}
            />
          </div>
        </div>
      )}

      {showVideoCall && selectedAppointmentForLive && (
        <div className="modal-overlay video-overlay">
          <div className="modal-content video-modal">
            <VideoCall
              roomId={selectedAppointmentForLive.callRoomId || selectedAppointmentForLive._id}
              userType="patient"
              userId={user.email}
              userName={user.fullname || user.email}
              appointmentId={selectedAppointmentForLive._id}
              onClose={() => setShowVideoCall(false)}
            />
          </div>
        </div>
      )}

      {viewPrescriptionUrl && (
        <PrescriptionView
          prescriptionUrl={viewPrescriptionUrl}
          onClose={() => setViewPrescriptionUrl(null)}
        />
      )}
    </div>
  );
}
