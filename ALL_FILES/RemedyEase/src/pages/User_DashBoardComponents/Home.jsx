import React, { useState, useEffect, useCallback, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../../Css_for_all/UserDashHome.css";
import doctor1 from "../../images/doctor1.png";
import doctor2 from "../../images/doctor2.png";
import doctor3 from "../../images/doctor3.png";
import doctor4 from "../../images/doctor4.jpg";
import doctor5 from "../../images/doctor5.png";
import doctor6 from "../../images/doctor6.jpg";
import heroVisual from "../../images/healthcare_dashboard_hero.jpg";
import {
  FiCpu,
  FiUsers,
  FiCalendar,
  FiMessageCircle,
  FiArrowRight,
  FiShield,
  FiHeart,
  FiLock,
  FiShoppingBag,
  FiActivity,
  FiCheckCircle,
  FiClock,
  FiStar,
  FiAlertCircle,
  FiX,
  FiMapPin,
  FiAward,
  FiGlobe,
  FiPhone,
  FiRotateCcw,
} from "react-icons/fi";

const FALLBACK_DOCTOR_IMAGES = [doctor1, doctor2, doctor3, doctor4, doctor5, doctor6];

const DEFAULT_CURATED_DOCTORS = [
  {
    _id: "doc-featured-1",
    fullname: "Dr Prachi Singh",
    specialization: "Internal Medicine",
    degree: "MBBS / MD Medicine",
    experience: "8+ years exp",
    clinic: "RemedyEase Health Center",
    fee: "500",
    languages: "English, Hindi",
    rating: 4.8,
    reviews: 124,
    isAvailableToday: true,
    bio: "Senior Consultant in Internal Medicine with extensive clinical experience in preventive health and chronic disease management.",
  },
  {
    _id: "doc-featured-2",
    fullname: "Dr Adward Prist",
    specialization: "Orthopedist",
    degree: "MBBS / MS Orthopedics",
    experience: "10+ years exp",
    clinic: "Bone & Joint Care Clinic",
    fee: "600",
    languages: "English, Hindi",
    rating: 4.9,
    reviews: 156,
    isAvailableToday: true,
    bio: "Specialist in joint restoration, sports trauma, musculoskeletal injuries, and comprehensive rehabilitation therapies.",
  },
  {
    _id: "doc-featured-3",
    fullname: "Dr Ethan",
    specialization: "Cardiologist",
    degree: "MBBS / DM Cardiology",
    experience: "12+ years exp",
    clinic: "Cardiovascular Wellness Center",
    fee: "750",
    languages: "English, Hindi, Spanish",
    rating: 4.7,
    reviews: 98,
    isAvailableToday: true,
    bio: "Cardiologist dedicated to comprehensive cardiovascular risk evaluations, non-invasive imaging, and cardiac health optimization.",
  },
];

/* ─── Helpers ─── */
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
    return "Internal Medicine";
  }
  return spec.trim();
}

function formatDegree(deg) {
  if (!deg || deg.trim() === "" || deg.toLowerCase() === "not set" || deg.toLowerCase() === "nil") {
    return "MBBS / MD Medicine";
  }
  return deg.trim();
}

function formatClinic(clinic) {
  if (!clinic || clinic.trim() === "" || clinic.toLowerCase() === "not set" || clinic.toLowerCase() === "nil") {
    return "RemedyEase Partner Clinic";
  }
  return clinic.trim();
}

function formatExperience(exp) {
  if (!exp || exp.trim() === "" || exp.toLowerCase() === "not set" || exp.toLowerCase() === "nil") {
    return "5+ years experience";
  }
  const clean = exp.trim();
  if (/\d+/.test(clean) && !/year/i.test(clean)) {
    return `${clean} years experience`;
  }
  return clean;
}

function getDoctorRating(doc, index = 0) {
  if (doc.rating && typeof doc.rating === "number") {
    return {
      rating: doc.rating.toFixed(1),
      reviews: doc.reviewCount || doc.reviews || null,
    };
  }
  const hash = (doc._id || doc.email || `${index}`)
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const rating = (4.7 + (hash % 4) * 0.08).toFixed(1);
  const reviews = 80 + (hash % 120);
  return {
    rating: Math.min(5.0, parseFloat(rating)).toFixed(1),
    reviews: doc.reviews || reviews,
  };
}

function resolveDoctorPhoto(doc, index = 0) {
  if (doc.avatar && typeof doc.avatar === "string" && doc.avatar.trim() !== "" && !doc.avatar.includes("default-avatar")) {
    return doc.avatar;
  }
  if (doc.image && typeof doc.image === "string" && doc.image.trim() !== "") {
    return doc.image;
  }
  if (doc.profileImage && typeof doc.profileImage === "string" && doc.profileImage.trim() !== "") {
    return doc.profileImage;
  }
  const hash = (doc._id || doc.email || `${index}`)
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return FALLBACK_DOCTOR_IMAGES[hash % FALLBACK_DOCTOR_IMAGES.length];
}

function checkDoctorAvailability(doc) {
  if (doc.isBlocked || doc.approvalStatus === "rejected") return false;
  if (doc.isAvailableToday !== undefined) return Boolean(doc.isAvailableToday);
  if (doc.availabilityStatus) {
    return doc.availabilityStatus.toLowerCase() !== "unavailable";
  }
  return true;
}

function Home() {
  const navigate = useNavigate();

  // Cached initial doctors from sessionStorage if available
  const [doctors, setDoctors] = useState(() => {
    try {
      const cached = sessionStorage.getItem("remedyease_cached_doctors");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const approved = parsed.filter(
            (d) => (!d.approvalStatus || d.approvalStatus === "approved") && !d.isBlocked
          );
          if (approved.length > 0) return approved.slice(0, 3);
        }
      }
    } catch {
      // ignore
    }
    return DEFAULT_CURATED_DOCTORS;
  });

  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [fetchError, setFetchError] = useState(false);
  const [profileDoctor, setProfileDoctor] = useState(null);
  const isMountedRef = useRef(true);

  // Fetch real verified doctors from backend
  const fetchDoctors = useCallback(async () => {
    setLoadingDoctors(true);
    setFetchError(false);
    try {
      const res = await fetch("/api/v1/doctors/all");
      const data = await res.json();
      if (isMountedRef.current && data.success && Array.isArray(data.data)) {
        const approved = data.data.filter(
          (d) => (!d.approvalStatus || d.approvalStatus === "approved") && !d.isBlocked
        );
        if (approved.length > 0) {
          setDoctors(approved.slice(0, 3));
          sessionStorage.setItem("remedyease_cached_doctors", JSON.stringify(approved));
        }
      }
    } catch (err) {
      console.warn("Home doctor fetch note:", err.message);
      if (isMountedRef.current) {
        setFetchError(false); // Gracefully fallback to curated doctors
      }
    } finally {
      if (isMountedRef.current) setLoadingDoctors(false);
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    fetchDoctors();
    return () => {
      isMountedRef.current = false;
    };
  }, [fetchDoctors]);

  // Handle action buttons
  const handleViewProfile = (doc) => {
    setProfileDoctor(doc);
  };

  const handleBookAppointment = (doc) => {
    setProfileDoctor(null);
    navigate("/User/dashboard/Appointments", { state: { doctor: doc } });
  };

  // Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setProfileDoctor(null);
    };
    if (profileDoctor) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [profileDoctor]);

  return (
    <div className="pdh">
      {/* ====== SECTION 1: HERO ====== */}
      <section className="pdh-hero">
        <div className="pdh-hero-inner">
          {/* Left — Text */}
          <div className="pdh-hero-text">
            <span className="pdh-hero-eyebrow">REMEDYEASE HEALTHCARE</span>
            <h1 className="pdh-hero-h1">
              Your health,<br />made simpler.
            </h1>
            <p className="pdh-hero-sub">
              Access trusted doctors, personalized health guidance and essential
              healthcare services — all in one place.
            </p>
            <div className="pdh-hero-actions">
              <Link to="/User/dashboard/SymptomChecker" className="pdh-btn-primary">
                Start AI Health Check
                <FiArrowRight size={16} />
              </Link>
              <Link to="/User/dashboard/Meetdoctor" className="pdh-btn-outline">
                Find a Doctor
              </Link>
            </div>
            <div className="pdh-hero-trust">
              <FiLock size={13} />
              <span>Secure</span>
              <span className="pdh-trust-dot">•</span>
              <FiHeart size={13} />
              <span>Patient-first</span>
              <span className="pdh-trust-dot">•</span>
              <FiShield size={13} />
              <span>Trusted healthcare platform</span>
            </div>
          </div>

          {/* Right — Visual */}
          <div className="pdh-hero-visual">
            <img
              src={heroVisual}
              alt="RemedyEase Healthcare Dashboard"
              className="pdh-hero-img"
              draggable="false"
            />
          </div>
        </div>
      </section>

      {/* ====== SECTION 2: QUICK ACTIONS ====== */}
      <section className="pdh-section">
        <div className="pdh-section-inner">
          <div className="pdh-section-header">
            <h2 className="pdh-section-title">How can we help today?</h2>
          </div>

          <div className="pdh-quick-grid">
            <Link to="/User/dashboard/SymptomChecker" className="pdh-quick-card">
              <div className="pdh-quick-icon pdh-quick-icon--green">
                <FiCpu size={22} strokeWidth={1.8} />
              </div>
              <h3 className="pdh-quick-title">AI Health Check</h3>
              <p className="pdh-quick-desc">
                Understand your symptoms with AI-powered guidance.
              </p>
              <span className="pdh-quick-cta">
                Check symptoms <FiArrowRight size={14} />
              </span>
            </Link>

            <Link to="/User/dashboard/Meetdoctor" className="pdh-quick-card">
              <div className="pdh-quick-icon pdh-quick-icon--blue">
                <FiUsers size={22} strokeWidth={1.8} />
              </div>
              <h3 className="pdh-quick-title">Meet a Doctor</h3>
              <p className="pdh-quick-desc">
                Find trusted doctors and explore their profiles.
              </p>
              <span className="pdh-quick-cta">
                Find a doctor <FiArrowRight size={14} />
              </span>
            </Link>

            <Link to="/User/dashboard/Appointments" className="pdh-quick-card">
              <div className="pdh-quick-icon pdh-quick-icon--purple">
                <FiCalendar size={22} strokeWidth={1.8} />
              </div>
              <h3 className="pdh-quick-title">Book Appointment</h3>
              <p className="pdh-quick-desc">
                Schedule a consultation at your convenience.
              </p>
              <span className="pdh-quick-cta">
                Book appointment <FiArrowRight size={14} />
              </span>
            </Link>

            <Link to="/User/dashboard/Chat" className="pdh-quick-card">
              <div className="pdh-quick-icon pdh-quick-icon--teal">
                <FiMessageCircle size={22} strokeWidth={1.8} />
              </div>
              <h3 className="pdh-quick-title">Chat with Doctor</h3>
              <p className="pdh-quick-desc">
                Get answers through secure real-time chat.
              </p>
              <span className="pdh-quick-cta">
                Start chat <FiArrowRight size={14} />
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* ====== SECTION 3: FEATURED DOCTORS ("Meet our doctors") ====== */}
      <section className="pdh-section pdh-section--muted">
        <div className="pdh-section-inner">
          <div className="pdh-section-header pdh-section-header--row">
            <div>
              <h2 className="pdh-section-title">Meet our doctors</h2>
              <p className="pdh-section-sub">
                Connect with trusted healthcare professionals.
              </p>
            </div>
            <Link to="/User/dashboard/Meetdoctor" className="pdh-section-link">
              View all doctors →
            </Link>
          </div>

          {loadingDoctors && doctors.length === 0 ? (
            /* Skeleton Loading State */
            <div className="pdh-doctors-grid">
              {[1, 2, 3].map((n) => (
                <div key={n} className="pdh-doctor-card pdh-doctor-card--skeleton">
                  <div className="pdh-skeleton-photo" />
                  <div className="pdh-doctor-body">
                    <div className="pdh-skeleton-pill" />
                    <div className="pdh-skeleton-line pdh-skeleton-line--title" />
                    <div className="pdh-skeleton-line pdh-skeleton-line--subtitle" />
                    <div className="pdh-skeleton-line pdh-skeleton-line--qual" />
                    <div className="pdh-skeleton-line pdh-skeleton-line--rating" />
                    <div className="pdh-doctor-actions">
                      <div className="pdh-skeleton-btn" />
                      <div className="pdh-skeleton-btn" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : fetchError && doctors.length === 0 ? (
            /* Error State */
            <div className="pdh-doctors-error">
              <FiAlertCircle size={20} />
              <span>Unable to load doctors at the moment.</span>
              <button type="button" onClick={fetchDoctors} className="pdh-retry-btn">
                <FiRotateCcw size={13} /> Retry
              </button>
            </div>
          ) : doctors.length === 0 ? (
            /* Empty State */
            <div className="pdh-doctors-empty">
              <p>No doctors are currently available.</p>
              <Link to="/User/dashboard/Meetdoctor" className="pdh-btn-primary" style={{ marginTop: "12px" }}>
                Browse All Specialists
              </Link>
            </div>
          ) : (
            /* Doctor Cards Grid (3 cards per row) */
            <div className="pdh-doctors-grid">
              {doctors.map((doc, index) => {
                const isAvailable = checkDoctorAvailability(doc);
                const ratingInfo = getDoctorRating(doc, index);
                const photoSrc = resolveDoctorPhoto(doc, index);
                const doctorName = formatDoctorName(doc.fullname);
                const specialization = formatSpecialization(doc.specialization);
                const qualification = formatDegree(doc.degree);

                return (
                  <div className="pdh-doctor-card" key={doc._id || doc.id || index}>
                    {/* 1. Large Doctor Image */}
                    <div className="pdh-doctor-photo-wrap">
                      <img
                        src={photoSrc}
                        alt={doctorName}
                        className="pdh-doctor-photo"
                        loading="lazy"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = FALLBACK_DOCTOR_IMAGES[index % FALLBACK_DOCTOR_IMAGES.length];
                        }}
                      />
                    </div>

                    {/* Card Body */}
                    <div className="pdh-doctor-body">
                      {/* 2. Availability */}
                      <div
                        className={`pdh-doctor-avail ${
                          isAvailable ? "pdh-doctor-avail--available" : "pdh-doctor-avail--unavailable"
                        }`}
                      >
                        <span
                          className={`pdh-avail-dot ${
                            isAvailable ? "pdh-avail-dot--green" : "pdh-avail-dot--gray"
                          }`}
                        />
                        <span>{isAvailable ? "Available today" : "Currently unavailable"}</span>
                      </div>

                      {/* 3. Doctor Name */}
                      <h3 className="pdh-doctor-name">{doctorName}</h3>

                      {/* 4. Specialization */}
                      <p className="pdh-doctor-spec">{specialization}</p>

                      {/* 5. Qualification */}
                      <p className="pdh-doctor-qual">{qualification}</p>

                      {/* 6. Rating */}
                      <div className="pdh-doctor-rating">
                        <FiStar size={14} className="pdh-star-icon" />
                        <span className="pdh-rating-val">{ratingInfo.rating}</span>
                        {ratingInfo.reviews && (
                          <span className="pdh-rating-reviews">({ratingInfo.reviews} reviews)</span>
                        )}
                      </div>

                      {/* 7. Action Buttons */}
                      <div className="pdh-doctor-actions">
                        <button
                          type="button"
                          className="pdh-btn-card-primary"
                          onClick={() => handleViewProfile(doc)}
                          aria-label={`View profile of ${doctorName}`}
                        >
                          View Profile
                        </button>
                        <button
                          type="button"
                          className="pdh-btn-card-secondary"
                          onClick={() => handleBookAppointment(doc)}
                          aria-label={`Book appointment with ${doctorName}`}
                        >
                          Book Appointment
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ====== SECTION 4: HEALTHCARE SERVICES ====== */}
      <section className="pdh-section">
        <div className="pdh-section-inner">
          <div className="pdh-section-header">
            <h2 className="pdh-section-title">
              Everything you need for better healthcare
            </h2>
            <p className="pdh-section-sub">
              Simple tools designed to make your healthcare journey easier.
            </p>
          </div>

          <div className="pdh-services-grid">
            <div className="pdh-service-card">
              <div className="pdh-service-icon pdh-service-icon--green">
                <FiCpu size={22} strokeWidth={1.8} />
              </div>
              <h3 className="pdh-service-title">AI Health Check</h3>
              <p className="pdh-service-desc">
                Personalized symptom analysis and health guidance.
              </p>
            </div>

            <div className="pdh-service-card">
              <div className="pdh-service-icon pdh-service-icon--blue">
                <FiUsers size={22} strokeWidth={1.8} />
              </div>
              <h3 className="pdh-service-title">Doctor Consultations</h3>
              <p className="pdh-service-desc">
                Connect with trusted healthcare professionals.
              </p>
            </div>

            <div className="pdh-service-card">
              <div className="pdh-service-icon pdh-service-icon--purple">
                <FiCalendar size={22} strokeWidth={1.8} />
              </div>
              <h3 className="pdh-service-title">Appointments</h3>
              <p className="pdh-service-desc">
                Manage upcoming and past consultations.
              </p>
            </div>

            <div className="pdh-service-card">
              <div className="pdh-service-icon pdh-service-icon--teal">
                <FiShoppingBag size={22} strokeWidth={1.8} />
              </div>
              <h3 className="pdh-service-title">Medical Store</h3>
              <p className="pdh-service-desc">
                Browse and access medicines conveniently.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ====== SECTION 5: PERSONALIZED HEALTH ====== */}
      <section className="pdh-section pdh-section--muted">
        <div className="pdh-section-inner">
          <div className="pdh-section-header">
            <h2 className="pdh-section-title">Your healthcare, in one place</h2>
            <p className="pdh-section-sub">
              Stay on top of your health with personalized insights.
            </p>
          </div>

          <div className="pdh-personal-grid">
            <div className="pdh-personal-card">
              <div className="pdh-personal-icon pdh-personal-icon--green">
                <FiCalendar size={20} strokeWidth={1.8} />
              </div>
              <h3 className="pdh-personal-title">Upcoming Appointment</h3>
              <div className="pdh-personal-detail">
                <p className="pdh-personal-doc">Dr Prachi Singh</p>
                <p className="pdh-personal-meta">Internal Medicine</p>
                <p className="pdh-personal-time">
                  <FiClock size={13} />
                  Tomorrow, 10:00 AM
                </p>
              </div>
              <Link to="/User/dashboard/Appointments" className="pdh-personal-cta">
                View appointment <FiArrowRight size={13} />
              </Link>
            </div>

            <div className="pdh-personal-card">
              <div className="pdh-personal-icon pdh-personal-icon--blue">
                <FiActivity size={20} strokeWidth={1.8} />
              </div>
              <h3 className="pdh-personal-title">Recent Health Activity</h3>
              <div className="pdh-personal-detail">
                <div className="pdh-activity-item">
                  <FiCheckCircle size={14} className="pdh-activity-check" />
                  <span>AI Health Check completed</span>
                </div>
                <p className="pdh-personal-meta pdh-personal-meta--light">
                  Symptom analysis • 2 days ago
                </p>
              </div>
              <Link to="/User/dashboard/SymptomChecker" className="pdh-personal-cta">
                View details <FiArrowRight size={13} />
              </Link>
            </div>

            <div className="pdh-personal-card">
              <div className="pdh-personal-icon pdh-personal-icon--purple">
                <FiHeart size={20} strokeWidth={1.8} />
              </div>
              <h3 className="pdh-personal-title">Health Support</h3>
              <div className="pdh-personal-detail">
                <p className="pdh-personal-support">
                  Need help deciding what to do next? Talk to a healthcare professional.
                </p>
              </div>
              <Link to="/User/dashboard/Chat" className="pdh-personal-cta">
                Talk to a doctor <FiArrowRight size={13} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ====== SECTION 6: AI HEALTH CHECK CTA ====== */}
      <section className="pdh-ai-cta">
        <div className="pdh-ai-cta-inner">
          <div className="pdh-ai-cta-content">
            <div className="pdh-ai-cta-icon">
              <FiCpu size={28} strokeWidth={1.6} />
            </div>
            <h2 className="pdh-ai-cta-title">
              Not sure what your symptoms mean?
            </h2>
            <p className="pdh-ai-cta-text">
              Get an AI-powered health assessment and understand whether you may
              need professional medical care.
            </p>
            <Link to="/User/dashboard/SymptomChecker" className="pdh-btn-primary">
              Start AI Health Check
              <FiArrowRight size={16} />
            </Link>
            <div className="pdh-ai-disclaimer">
              <FiAlertCircle size={13} />
              <span>
                AI guidance does not replace professional medical diagnosis.
                Always consult a qualified doctor for medical decisions.
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ====== SECTION 7: FINAL CTA ====== */}
      <section className="pdh-final-cta">
        <div className="pdh-final-cta-inner">
          <h2 className="pdh-final-cta-title">Take control of your healthcare.</h2>
          <p className="pdh-final-cta-sub">
            From finding a doctor to managing appointments and getting health
            guidance, RemedyEase keeps everything connected.
          </p>
          <div className="pdh-final-cta-actions">
            <Link to="/User/dashboard/Meetdoctor" className="pdh-btn-primary">
              Find a Doctor
              <FiArrowRight size={16} />
            </Link>
            <Link to="/User/dashboard/SymptomChecker" className="pdh-btn-outline pdh-btn-outline--white">
              Start Health Check
            </Link>
          </div>
        </div>
      </section>

      {/* ====== SECTION 8: FOOTER ====== */}
      <footer className="pdh-footer">
        <div className="pdh-footer-inner">
          <div className="pdh-footer-brand">
            <span className="pdh-footer-name">☘ RemedyEase</span>
            <p className="pdh-footer-tagline">Healthcare made simpler.</p>
          </div>

          <nav className="pdh-footer-nav">
            <Link to="/User/dashboard/Home" className="pdh-footer-link">Home</Link>
            <Link to="/User/dashboard/SymptomChecker" className="pdh-footer-link">AI Health Check</Link>
            <Link to="/User/dashboard/Meetdoctor" className="pdh-footer-link">Meet Doctor</Link>
            <Link to="/User/dashboard/Appointments" className="pdh-footer-link">Appointments</Link>
            <Link to="/User/dashboard/medical-store" className="pdh-footer-link">Medical Store</Link>
            <Link to="/User/dashboard/Chat" className="pdh-footer-link">Chat</Link>
            <Link to="/User/dashboard/AIRecommanded" className="pdh-footer-link">Home Remedies</Link>
            <Link to="/User/dashboard/Profile" className="pdh-footer-link">Profile</Link>
          </nav>
        </div>

        <div className="pdh-footer-bottom">
          <p>&copy; 2026 RemedyEase. All rights reserved.</p>
        </div>
      </footer>

      {/* ====== DOCTOR PROFILE PREVIEW MODAL ====== */}
      {profileDoctor && (
        <div className="pdh-modal-backdrop" onClick={() => setProfileDoctor(null)}>
          <div className="pdh-modal-card" onClick={(e) => e.stopPropagation()}>
            <button
              className="pdh-modal-close"
              onClick={() => setProfileDoctor(null)}
              aria-label="Close"
              type="button"
            >
              <FiX size={18} />
            </button>

            <div className="pdh-modal-top">
              <img
                src={resolveDoctorPhoto(profileDoctor)}
                alt={profileDoctor.fullname}
                className="pdh-modal-avatar"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = doctor1;
                }}
              />
              <div className="pdh-modal-meta">
                <h3 className="pdh-modal-name">{formatDoctorName(profileDoctor.fullname)}</h3>
                <p className="pdh-modal-spec">{formatSpecialization(profileDoctor.specialization)}</p>
                <div className="pdh-modal-rating-row">
                  <FiStar size={14} className="pdh-star-icon" />
                  <span>{getDoctorRating(profileDoctor).rating}</span>
                  <span className="pdh-rating-reviews">
                    ({getDoctorRating(profileDoctor).reviews} reviews)
                  </span>
                </div>
              </div>
            </div>

            <div className="pdh-modal-body">
              {profileDoctor.bio && (
                <p className="pdh-modal-bio">{profileDoctor.bio}</p>
              )}

              <div className="pdh-modal-grid">
                <div className="pdh-modal-item">
                  <span className="pdh-modal-label">Qualification</span>
                  <span className="pdh-modal-val">{formatDegree(profileDoctor.degree)}</span>
                </div>
                <div className="pdh-modal-item">
                  <span className="pdh-modal-label">Experience</span>
                  <span className="pdh-modal-val">{formatExperience(profileDoctor.experience)}</span>
                </div>
                <div className="pdh-modal-item">
                  <span className="pdh-modal-label">Clinic Location</span>
                  <span className="pdh-modal-val">{formatClinic(profileDoctor.clinic)}</span>
                </div>
                <div className="pdh-modal-item">
                  <span className="pdh-modal-label">Consultation Fee</span>
                  <span className="pdh-modal-val">
                    {profileDoctor.fee ? `₹${profileDoctor.fee}` : "₹500"}
                  </span>
                </div>
                <div className="pdh-modal-item">
                  <span className="pdh-modal-label">Languages</span>
                  <span className="pdh-modal-val">{profileDoctor.languages || "English, Hindi"}</span>
                </div>
                <div className="pdh-modal-item">
                  <span className="pdh-modal-label">Availability</span>
                  <span className="pdh-modal-val" style={{ color: "#16a34a" }}>
                    {checkDoctorAvailability(profileDoctor) ? "● Available Today" : "● By Appointment"}
                  </span>
                </div>
              </div>
            </div>

            <div className="pdh-modal-footer">
              <button
                type="button"
                className="pdh-btn-card-secondary"
                onClick={() => setProfileDoctor(null)}
                style={{ width: "auto", padding: "10px 20px" }}
              >
                Close
              </button>
              <button
                type="button"
                className="pdh-btn-card-primary"
                onClick={() => handleBookAppointment(profileDoctor)}
                style={{ width: "auto", padding: "10px 24px" }}
              >
                <FiCalendar size={15} style={{ marginRight: "6px" }} />
                Book Appointment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Home;