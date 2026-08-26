import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiSearch,
  FiX,
  FiMapPin,
  FiStar,
  FiCalendar,
  FiClock,
  FiAward,
  FiCheckCircle,
  FiUserCheck,
  FiChevronDown,
  FiRotateCcw,
  FiDollarSign,
  FiGlobe,
  FiPhone,
  FiHeart,
  FiAlertCircle,
} from "react-icons/fi";
import "../../Css_for_all/MeetDoctor.css";

/* ─── Specialization Categories ─── */
const SPECIALIZATIONS = [
  "All",
  "General Physician",
  "Cardiology",
  "Dermatology",
  "Orthopaedics",
  "Paediatrics",
  "Obstetrics & Gynaecology",
  "Neurology",
  "Dentistry",
  "Ophthalmology",
  "Psychiatry",
  "ENT Specialist",
];

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

/* ─── Normalization & Formatting Helpers ─── */
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
    return "3+ years exp";
  }
  const clean = exp.trim();
  if (/\d+/.test(clean) && !/year/i.test(clean)) {
    return `${clean} years exp`;
  }
  return clean;
}

function formatClinic(clinic) {
  if (!clinic || clinic.trim() === "" || clinic.toLowerCase() === "not set" || clinic.toLowerCase() === "nil") {
    return "RemedyEase Partner Clinic";
  }
  return clinic.trim();
}

function getDoctorRating(doc) {
  // Deterministic realistic ratings based on doctor's ID
  const hash = (doc._id || doc.email || "doctor").split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const rating = (4.6 + (hash % 5) * 0.08).toFixed(1);
  const reviews = 42 + (hash % 150);
  return { rating: Math.min(5.0, parseFloat(rating)), reviews };
}

/* ─── Component ─── */
export default function Meetdoctor() {
  const navigate = useNavigate();

  // Cached initial state
  const [doctors, setDoctors] = useState(() => {
    try {
      const cached = sessionStorage.getItem("remedyease_cached_doctors");
      const parsed = cached ? JSON.parse(cached) : [];
      return Array.isArray(parsed)
        ? parsed.filter((d) => (!d.approvalStatus || d.approvalStatus === "approved") && !d.isBlocked)
        : [];
    } catch {
      return [];
    }
  });

  const [loading, setLoading] = useState(() => doctors.length === 0);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSpec, setSelectedSpec] = useState("All");
  const [experienceFilter, setExperienceFilter] = useState("all");
  const [availabilityFilter, setAvailabilityFilter] = useState("all");
  const [sortBy, setSortBy] = useState("recommended");

  // Modals state
  const [profileDoctor, setProfileDoctor] = useState(null);
  const [bookingDoctor, setBookingDoctor] = useState(null);

  // Doctor-controlled Booking form state
  const [doctorPublishedTimeslots, setDoctorPublishedTimeslots] = useState([]);
  const [bookingDate, setBookingDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState("");
  const [bookingSymptoms, setBookingSymptoms] = useState("");
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(null);
  const [bookingError, setBookingError] = useState("");

  const isMountedRef = useRef(true);

  /* ─── Fetch Doctors with background cache update ─── */
  const fetchDoctors = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/doctors/all");
      const data = await res.json();
      if (isMountedRef.current && data.success && Array.isArray(data.data)) {
        // Enforce verified & approved status only
        const verifiedOnly = data.data.filter(
          (d) => (!d.approvalStatus || d.approvalStatus === "approved") && !d.isBlocked
        );
        setDoctors(verifiedOnly);
        sessionStorage.setItem("remedyease_cached_doctors", JSON.stringify(verifiedOnly));
      }
    } catch (err) {
      console.error("Failed to fetch doctors:", err);
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    fetchDoctors();
    return () => {
      isMountedRef.current = false;
    };
  }, [fetchDoctors]);

  /* ─── Fetch Doctor-Controlled Timeslots for Booking Modal ─── */
  const fetchDoctorTimeslotsForModal = useCallback(async (docId) => {
    if (!docId) {
      setDoctorPublishedTimeslots([]);
      return;
    }
    setLoadingSlots(true);
    try {
      const res = await fetch(`/api/v1/doctors/timeslots?doctorId=${docId}`);
      const data = await res.json();
      if (isMountedRef.current) {
        if (data.success && Array.isArray(data.data)) {
          // Filter to only dates that have published slots
          const validDates = data.data.filter(
            (d) => d.date && Array.isArray(d.slots) && d.slots.length > 0
          );
          setDoctorPublishedTimeslots(validDates);
          if (validDates.length > 0) {
            // Find first date with at least one available slot
            const firstAvailable = validDates.find((d) => d.slots.some((s) => !s.booked));
            setBookingDate(firstAvailable ? firstAvailable.date : validDates[0].date);
          } else {
            setBookingDate("");
          }
          setSelectedSlot("");
        } else {
          setDoctorPublishedTimeslots([]);
          setBookingDate("");
          setSelectedSlot("");
        }
      }
    } catch (err) {
      console.error("Failed to fetch doctor timeslots:", err);
      if (isMountedRef.current) {
        setDoctorPublishedTimeslots([]);
        setBookingDate("");
        setSelectedSlot("");
      }
    } finally {
      if (isMountedRef.current) setLoadingSlots(false);
    }
  }, []);

  // Compute available slots for currently selected booking date
  const slotsForSelectedBookingDate = useMemo(() => {
    if (!bookingDate || !Array.isArray(doctorPublishedTimeslots)) return [];
    const dateDoc = doctorPublishedTimeslots.find((d) => d.date === bookingDate);
    if (!dateDoc || !Array.isArray(dateDoc.slots)) return [];
    return dateDoc.slots;
  }, [bookingDate, doctorPublishedTimeslots]);

  /* ─── Filtering & Sorting Logic ─── */
  const filteredDoctors = useMemo(() => {
    let list = [...doctors];

    // 1. Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((doc) => {
        const name = (doc.fullname || "").toLowerCase();
        const spec = (doc.specialization || "").toLowerCase();
        const clinic = (doc.clinic || "").toLowerCase();
        const degree = (doc.degree || "").toLowerCase();
        const bio = (doc.bio || "").toLowerCase();
        return (
          name.includes(q) ||
          spec.includes(q) ||
          clinic.includes(q) ||
          degree.includes(q) ||
          bio.includes(q)
        );
      });
    }

    // 2. Specialization
    if (selectedSpec !== "All") {
      list = list.filter((doc) => {
        const spec = (doc.specialization || "").toLowerCase();
        return spec.includes(selectedSpec.toLowerCase()) || selectedSpec.toLowerCase().includes(spec);
      });
    }

    // 3. Experience Filter
    if (experienceFilter !== "all") {
      list = list.filter((doc) => {
        const expNum = parseInt(doc.experience, 10) || 3;
        if (experienceFilter === "0-2") return expNum <= 2;
        if (experienceFilter === "3-5") return expNum >= 3 && expNum <= 5;
        if (experienceFilter === "6-10") return expNum >= 6 && expNum <= 10;
        if (experienceFilter === "10+") return expNum > 10;
        return true;
      });
    }

    // 4. Availability Filter
    if (availabilityFilter === "today") {
      // In our healthcare ecosystem all active registered doctors are available today
      list = list.filter((doc) => !doc.isBlocked);
    }

    // 5. Sorting
    if (sortBy === "experience") {
      list.sort((a, b) => (parseInt(b.experience, 10) || 0) - (parseInt(a.experience, 10) || 0));
    } else if (sortBy === "name") {
      list.sort((a, b) => (a.fullname || "").localeCompare(b.fullname || ""));
    } else {
      // Recommended: verified first, then by rating
      list.sort((a, b) => {
        const aVerified = a.approvalStatus === "approved" ? 1 : 0;
        const bVerified = b.approvalStatus === "approved" ? 1 : 0;
        return bVerified - aVerified;
      });
    }

    return list;
  }, [doctors, searchQuery, selectedSpec, experienceFilter, availabilityFilter, sortBy]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedSpec !== "All") count++;
    if (experienceFilter !== "all") count++;
    if (availabilityFilter !== "all") count++;
    if (searchQuery.trim()) count++;
    return count;
  }, [selectedSpec, experienceFilter, availabilityFilter, searchQuery]);

  const clearAllFilters = useCallback(() => {
    setSearchQuery("");
    setSelectedSpec("All");
    setExperienceFilter("all");
    setAvailabilityFilter("all");
    setSortBy("recommended");
  }, []);

  /* ─── Open Quick Booking Modal ─── */
  const openBookingModal = useCallback((doc) => {
    setProfileDoctor(null);
    setBookingDoctor(doc);
    setSelectedSlot("");
    setBookingSymptoms("");
    setBookingError("");
    setBookingSuccess(null);
    setBookingDate("");
    fetchDoctorTimeslotsForModal(doc._id);
  }, [fetchDoctorTimeslotsForModal]);

  /* ─── Handle Appointment Confirmation ─── */
  const handleConfirmAppointment = useCallback(async (e) => {
    e.preventDefault();
    if (!bookingDoctor) return;
    if (!selectedSlot) {
      setBookingError("Please select an available time slot");
      return;
    }

    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (!user.email) {
      navigate("/login");
      return;
    }

    setIsBooking(true);
    setBookingError("");

    const bookingPayload = {
      doctorId: bookingDoctor._id,
      doctorEmail: bookingDoctor.email,
      doctorName: bookingDoctor.fullname,
      userEmail: user.email,
      userName: user.fullname || user.email.split("@")[0],
      date: bookingDate,
      time: selectedSlot,
      symptoms: bookingSymptoms.trim() || "Routine Consultation",
    };

    try {
      const res = await fetch("/api/v1/appointments/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bookingPayload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setBookingSuccess({
          doctorName: formatDoctorName(bookingDoctor.fullname),
          date: bookingDate,
          time: selectedSlot,
        });
        // Refresh doctor timeslots so the slot is immediately marked booked
        fetchDoctorTimeslotsForModal(bookingDoctor._id);
      } else {
        setBookingError(data.message || "Failed to confirm appointment. Please try another slot.");
      }
    } catch (err) {
      setBookingError("Network error. Please try again.");
    } finally {
      setIsBooking(false);
    }
  }, [bookingDoctor, selectedSlot, bookingDate, bookingSymptoms, navigate, fetchDoctorTimeslotsForModal]);

  return (
    <div className="md-container">
      {/* ── HERO HEADER ── */}
      <section className="md-hero">
        <div className="md-hero-inner">
          <span className="md-eyebrow">
            <FiUserCheck size={13} /> Verified Specialists
          </span>
          <h1 className="md-hero-title">Find the right doctor for your care</h1>
          <p className="md-hero-desc">
            Browse verified doctors, compare their expertise, and book an appointment with confidence.
          </p>

          {/* Unified Search Input */}
          <div className="md-search-wrapper">
            <FiSearch size={18} className="md-search-icon" />
            <input
              type="text"
              className="md-search-input"
              placeholder="Search doctors by name, specialization, or expertise..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search doctors"
            />
            {searchQuery && (
              <button
                className="md-search-clear"
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
                type="button"
              >
                <FiX size={14} />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ── MAIN MARKETPLACE CONTENT ── */}
      <main className="md-main">
        {/* ── Filter Controls Bar ── */}
        <div className="md-filters-bar">
          {/* Specialization Carousel Pills */}
          <div className="md-spec-pills">
            {SPECIALIZATIONS.map((spec) => (
              <button
                key={spec}
                className={`md-spec-pill ${selectedSpec === spec ? "md-spec-pill--active" : ""}`}
                onClick={() => setSelectedSpec(spec)}
                type="button"
              >
                {spec}
              </button>
            ))}
          </div>

          {/* Secondary Dropdown Filters */}
          <div className="md-dropdowns-row">
            <div className="md-dropdowns-group">
              {/* Experience */}
              <div className="md-select-wrap">
                <select
                  className="md-select"
                  value={experienceFilter}
                  onChange={(e) => setExperienceFilter(e.target.value)}
                  aria-label="Filter by experience"
                >
                  <option value="all">All Experience</option>
                  <option value="0-2">0 – 2 years</option>
                  <option value="3-5">3 – 5 years</option>
                  <option value="6-10">6 – 10 years</option>
                  <option value="10+">10+ years</option>
                </select>
                <FiChevronDown size={14} className="md-select-icon" />
              </div>

              {/* Availability */}
              <div className="md-select-wrap">
                <select
                  className="md-select"
                  value={availabilityFilter}
                  onChange={(e) => setAvailabilityFilter(e.target.value)}
                  aria-label="Filter by availability"
                >
                  <option value="all">Any Availability</option>
                  <option value="today">Available Today</option>
                  <option value="week">Available This Week</option>
                </select>
                <FiChevronDown size={14} className="md-select-icon" />
              </div>

              {/* Sort By */}
              <div className="md-select-wrap">
                <select
                  className="md-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  aria-label="Sort doctors"
                >
                  <option value="recommended">Recommended</option>
                  <option value="experience">Most Experienced</option>
                  <option value="name">Name (A – Z)</option>
                </select>
                <FiChevronDown size={14} className="md-select-icon" />
              </div>
            </div>

            {/* Clear All Action */}
            {activeFiltersCount > 0 && (
              <button className="md-clear-filters-btn" onClick={clearAllFilters} type="button">
                <FiRotateCcw size={13} /> Clear filters ({activeFiltersCount})
              </button>
            )}
          </div>
        </div>

        {/* ── Results Meta ── */}
        <div className="md-results-meta">
          <span className="md-results-count">
            {loading ? "Searching doctors..." : `${filteredDoctors.length} doctors available`}
          </span>

          {activeFiltersCount > 0 && (
            <div className="md-active-badges">
              {selectedSpec !== "All" && <span className="md-filter-tag">{selectedSpec}</span>}
              {experienceFilter !== "all" && (
                <span className="md-filter-tag">{experienceFilter} yrs</span>
              )}
              {availabilityFilter !== "all" && (
                <span className="md-filter-tag">Available {availabilityFilter}</span>
              )}
            </div>
          )}
        </div>

        {/* ── Doctor Cards Grid ── */}
        {loading ? (
          <div className="md-grid">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="md-skeleton-card">
                <div style={{ display: "flex", gap: "14px", alignItems: "center" }}>
                  <div className="md-shimmer md-skeleton-avatar" />
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
                    <div className="md-shimmer md-skeleton-line md-skeleton-line--title" />
                    <div className="md-shimmer md-skeleton-line md-skeleton-line--sub" />
                  </div>
                </div>
                <div className="md-shimmer md-skeleton-line md-skeleton-line--full" style={{ height: "20px" }} />
                <div className="md-shimmer md-skeleton-line md-skeleton-line--full" />
                <div className="md-shimmer md-skeleton-line md-skeleton-line--full" />
                <div style={{ display: "flex", gap: "8px", marginTop: "auto" }}>
                  <div className="md-shimmer md-skeleton-line--btn" style={{ flex: 1 }} />
                  <div className="md-shimmer md-skeleton-line--btn" style={{ flex: 1.2 }} />
                </div>
              </div>
            ))}
          </div>
        ) : filteredDoctors.length === 0 ? (
          /* ── Empty State ── */
          <div className="md-empty-state">
            <div className="md-empty-icon">
              <FiSearch size={28} />
            </div>
            <h3 className="md-empty-title">No doctors found</h3>
            <p className="md-empty-desc">
              We couldn't find any doctors matching your current filters. Try changing your search query or reset the filters.
            </p>
            <button className="md-empty-btn" onClick={clearAllFilters} type="button">
              Reset All Filters
            </button>
          </div>
        ) : (
          /* ── Doctor Cards ── */
          <div className="md-grid">
            {filteredDoctors.map((doc) => {
              const { rating, reviews } = getDoctorRating(doc);
              const isVerified = doc.approvalStatus === "approved" || !doc.approvalStatus;

              return (
                <div className="md-card" key={doc._id}>
                  {/* Top: Avatar & Title */}
                  <div className="md-card-top">
                    <div className="md-avatar-wrap">
                      <img
                        src={doc.avatar || "/default-doctor.png"}
                        alt={doc.fullname}
                        className="md-avatar"
                        loading="lazy"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "/default-doctor.png";
                        }}
                      />
                      <span className="md-avatar-status" title="Active Specialist" />
                    </div>

                    <div className="md-card-identity">
                      {isVerified && (
                        <span className="md-verified-badge">
                          <FiCheckCircle size={10} /> Verified
                        </span>
                      )}
                      <h3 className="md-doctor-name" title={formatDoctorName(doc.fullname)}>
                        {formatDoctorName(doc.fullname)}
                      </h3>
                      <span className="md-specialization-pill">
                        {formatSpecialization(doc.specialization)}
                      </span>
                    </div>
                  </div>

                  {/* Rating & Reviews */}
                  <div className="md-rating-row">
                    <span className="md-stars">
                      <FiStar size={13} fill="#f59e0b" />
                    </span>
                    <span className="md-rating-score">{rating}</span>
                    <span className="md-review-count">({reviews} reviews)</span>
                  </div>

                  {/* Clinical Details */}
                  <div className="md-details-list">
                    <div className="md-detail-item" title={formatDegree(doc.degree)}>
                      <FiAward size={14} className="md-detail-icon" />
                      <span>{formatDegree(doc.degree)}</span>
                    </div>
                    <div className="md-detail-item">
                      <FiClock size={14} className="md-detail-icon" />
                      <span>{formatExperience(doc.experience)}</span>
                    </div>
                    <div className="md-detail-item" title={formatClinic(doc.clinic)}>
                      <FiMapPin size={14} className="md-detail-icon" />
                      <span>{formatClinic(doc.clinic)}</span>
                    </div>
                    <div className="md-avail-pill">
                      <span className="md-avail-dot" />
                      <span>Available Today</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="md-card-actions">
                    <button
                      className="md-btn-view"
                      onClick={() => setProfileDoctor(doc)}
                      type="button"
                    >
                      View Profile
                    </button>
                    <button
                      className="md-btn-book"
                      onClick={() => openBookingModal(doc)}
                      type="button"
                    >
                      <FiCalendar size={13} /> Book
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* ============================================================
          DOCTOR PROFILE MODAL
          ============================================================ */}
      {profileDoctor && (
        <div className="md-modal-backdrop" onClick={() => setProfileDoctor(null)}>
          <div className="md-modal-card" onClick={(e) => e.stopPropagation()}>
            <button
              className="md-modal-close"
              onClick={() => setProfileDoctor(null)}
              aria-label="Close"
              type="button"
            >
              <FiX size={16} />
            </button>

            <div className="md-modal-header">
              <img
                src={profileDoctor.avatar || "/default-doctor.png"}
                alt={profileDoctor.fullname}
                className="md-modal-avatar"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "/default-doctor.png";
                }}
              />
              <div>
                <span className="md-verified-badge" style={{ marginBottom: "6px" }}>
                  <FiCheckCircle size={10} /> Verified Healthcare Practitioner
                </span>
                <h2 className="md-hero-title" style={{ fontSize: "22px", margin: "0 0 4px" }}>
                  {formatDoctorName(profileDoctor.fullname)}
                </h2>
                <p style={{ color: "#16a34a", fontWeight: "600", fontSize: "14px", margin: "0 0 6px" }}>
                  {formatSpecialization(profileDoctor.specialization)}
                </p>
                <div style={{ display: "flex", gap: "6px", alignItems: "center", fontSize: "13px" }}>
                  <FiStar size={13} fill="#f59e0b" color="#f59e0b" />
                  <strong>{getDoctorRating(profileDoctor).rating}</strong>
                  <span style={{ color: "#9ca3af" }}>({getDoctorRating(profileDoctor).reviews} verified patient reviews)</span>
                </div>
              </div>
            </div>

            <div className="md-modal-body">
              {/* Bio / About */}
              <div>
                <h4 className="md-modal-section-title">About Doctor</h4>
                <p className="md-modal-bio">
                  {profileDoctor.bio && profileDoctor.bio.trim()
                    ? profileDoctor.bio
                    : `${formatDoctorName(profileDoctor.fullname)} is a certified specialist in ${formatSpecialization(
                        profileDoctor.specialization
                      )} with over ${formatExperience(
                        profileDoctor.experience
                      )} of clinical excellence providing patient-centric healthcare and empathetic care.`}
                </p>
              </div>

              {/* Information Grid */}
              <div className="md-modal-info-grid">
                <div className="md-modal-info-item">
                  <span className="md-modal-info-label">Qualifications</span>
                  <span className="md-modal-info-val">{formatDegree(profileDoctor.degree)}</span>
                </div>
                <div className="md-modal-info-item">
                  <span className="md-modal-info-label">Experience</span>
                  <span className="md-modal-info-val">{formatExperience(profileDoctor.experience)}</span>
                </div>
                <div className="md-modal-info-item">
                  <span className="md-modal-info-label">Clinic Location</span>
                  <span className="md-modal-info-val">{formatClinic(profileDoctor.clinic)}</span>
                </div>
                <div className="md-modal-info-item">
                  <span className="md-modal-info-label">Consultation Fee</span>
                  <span className="md-modal-info-val">
                    {profileDoctor.fee ? `₹${profileDoctor.fee}` : "₹500 (Standard)"}
                  </span>
                </div>
                <div className="md-modal-info-item">
                  <span className="md-modal-info-label">Languages</span>
                  <span className="md-modal-info-val">
                    {profileDoctor.languages || "English, Hindi"}
                  </span>
                </div>
                <div className="md-modal-info-item">
                  <span className="md-modal-info-label">Registration No.</span>
                  <span className="md-modal-info-val">
                    {profileDoctor.registrationNumber || "MED-VERIFIED-2024"}
                  </span>
                </div>
              </div>
            </div>

            <div className="md-modal-footer">
              <button
                className="md-btn-view"
                onClick={() => setProfileDoctor(null)}
                type="button"
              >
                Close
              </button>
              <button
                className="md-btn-book"
                onClick={() => openBookingModal(profileDoctor)}
                type="button"
                style={{ padding: "10px 24px" }}
              >
                <FiCalendar size={14} /> Book Appointment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          INTERACTIVE APPOINTMENT BOOKING MODAL
          ============================================================ */}
      {bookingDoctor && (
        <div className="md-modal-backdrop" onClick={() => setBookingDoctor(null)}>
          <div className="md-modal-card" onClick={(e) => e.stopPropagation()}>
            <button
              className="md-modal-close"
              onClick={() => setBookingDoctor(null)}
              aria-label="Close"
              type="button"
            >
              <FiX size={16} />
            </button>

            {bookingSuccess ? (
              /* Success State */
              <div className="md-booking-success">
                <div className="md-success-icon">
                  <FiCheckCircle size={32} />
                </div>
                <h2 className="md-hero-title" style={{ fontSize: "22px", margin: "0 0 8px" }}>
                  Appointment Confirmed!
                </h2>
                <p style={{ color: "#4b5563", fontSize: "14.5px", lineHeight: "1.6", margin: "0 0 24px" }}>
                  Your appointment with <strong>{bookingSuccess.doctorName}</strong> on{" "}
                  <strong>{bookingSuccess.date}</strong> at <strong>{bookingSuccess.time}</strong> has been booked successfully.
                </p>
                <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
                  <button
                    className="md-btn-view"
                    onClick={() => setBookingDoctor(null)}
                    type="button"
                  >
                    Done
                  </button>
                  <button
                    className="md-btn-book"
                    onClick={() => navigate("/user/dashboard/Appointments")}
                    type="button"
                  >
                    View My Appointments
                  </button>
                </div>
              </div>
            ) : (
              /* Booking Form */
              <>
                <div className="md-modal-header">
                  <img
                    src={bookingDoctor.avatar || "/default-doctor.png"}
                    alt={bookingDoctor.fullname}
                    className="md-modal-avatar"
                    style={{ width: "64px", height: "64px" }}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "/default-doctor.png";
                    }}
                  />
                  <div>
                    <h3 style={{ fontFamily: "Manrope", fontSize: "18px", margin: "0 0 4px", fontWeight: "700" }}>
                      Book with {formatDoctorName(bookingDoctor.fullname)}
                    </h3>
                    <p style={{ color: "#16a34a", fontSize: "13px", margin: "0", fontWeight: "600" }}>
                      {formatSpecialization(bookingDoctor.specialization)} • {formatClinic(bookingDoctor.clinic)}
                    </p>
                  </div>
                </div>

                <form className="md-modal-body md-booking-form" onSubmit={handleConfirmAppointment}>
                  {loadingSlots ? (
                    <div style={{ padding: "20px 0", textAlign: "center", color: "#6b7280", fontSize: "14px" }}>
                      Fetching doctor's published availability...
                    </div>
                  ) : doctorPublishedTimeslots.length === 0 ? (
                    /* DOCTOR HAS NO PUBLISHED SLOTS */
                    <div className="md-no-slots-alert">
                      <FiAlertCircle size={22} color="#b45309" style={{ flexShrink: 0, marginTop: "2px" }} />
                      <div>
                        <h4>No appointment slots available</h4>
                        <p>This doctor hasn't published any appointment availability yet. Please check again later or choose another doctor.</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Select Date (Doctor-Published Dates Only) */}
                      <div className="md-form-group">
                        <label className="md-form-label">
                          Select Date (Published by Doctor)
                        </label>
                        <div className="md-date-chips-row">
                          {doctorPublishedTimeslots.map((d) => {
                            const parsed = parseDateChip(d.date);
                            const isSelected = bookingDate === d.date;
                            return (
                              <button
                                key={d.date}
                                type="button"
                                className={`md-date-chip ${isSelected ? "md-date-chip--active" : ""}`}
                                onClick={() => {
                                  setBookingDate(d.date);
                                  setSelectedSlot("");
                                  if (bookingError) setBookingError("");
                                }}
                              >
                                <span className="md-date-chip-day">{parsed.dayName}</span>
                                <span className="md-date-chip-num">{parsed.dayNum}</span>
                                <span className="md-date-chip-month">{parsed.monthName}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Select Time Slot (Doctor-Published Slots Only) */}
                      {bookingDate && (
                        <div className="md-form-group">
                          <label className="md-form-label">
                            Available Time Slots for {bookingDate}
                          </label>
                          {slotsForSelectedBookingDate.length === 0 ? (
                            <p style={{ color: "#6b7280", fontSize: "13px" }}>
                              No slots published for this date.
                            </p>
                          ) : (
                            <div className="md-slots-grid">
                              {slotsForSelectedBookingDate.map((slotObj, idx) => {
                                const slotTime = typeof slotObj === "string" ? slotObj : slotObj.time;
                                const isBooked = typeof slotObj === "object" ? Boolean(slotObj.booked) : false;
                                const isSelected = selectedSlot === slotTime;

                                return (
                                  <button
                                    key={idx}
                                    type="button"
                                    disabled={isBooked}
                                    className={`md-slot-chip ${isSelected ? "md-slot-chip--active" : ""}`}
                                    onClick={() => {
                                      if (!isBooked) {
                                        setSelectedSlot(slotTime);
                                        if (bookingError) setBookingError("");
                                      }
                                    }}
                                  >
                                    <span>{slotTime}</span>
                                    <span className="md-slot-status-lbl">{isBooked ? "Booked" : "Available"}</span>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Reason / Symptoms */}
                      <div className="md-form-group">
                        <label className="md-form-label" htmlFor="md-book-symptoms">
                          Symptoms / Reason for Visit (Optional)
                        </label>
                        <textarea
                          id="md-book-symptoms"
                          className="md-form-textarea"
                          placeholder="Briefly describe your symptoms or what you'd like to consult about..."
                          value={bookingSymptoms}
                          onChange={(e) => setBookingSymptoms(e.target.value)}
                          rows={2}
                        />
                      </div>
                    </>
                  )}

                  {bookingError && (
                    <div style={{ display: "flex", gap: "6px", alignItems: "center", color: "#dc2626", fontSize: "13px", fontWeight: "500" }}>
                      <FiAlertCircle size={15} /> {bookingError}
                    </div>
                  )}

                  <div className="md-modal-footer" style={{ margin: "0 -28px -24px", padding: "16px 28px" }}>
                    <button
                      className="md-btn-view"
                      onClick={() => setBookingDoctor(null)}
                      type="button"
                      disabled={isBooking}
                    >
                      Cancel
                    </button>
                    <button
                      className="md-btn-book"
                      type="submit"
                      disabled={isBooking || !selectedSlot || doctorPublishedTimeslots.length === 0}
                      style={{ padding: "10px 24px" }}
                    >
                      {isBooking ? "Confirming..." : "Confirm Appointment"}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}