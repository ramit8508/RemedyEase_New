import React, { useEffect, useState, useCallback } from "react";
import {
  FiCalendar,
  FiClock,
  FiPlus,
  FiTrash2,
  FiCheckCircle,
  FiAlertCircle,
  FiRefreshCw,
  FiSave,
} from "react-icons/fi";
import "../../Css_for_all/DoctorDashboard.css";

const PRESET_INTERVALS = [
  "09:00 AM - 09:30 AM",
  "09:30 AM - 10:00 AM",
  "10:00 AM - 10:30 AM",
  "10:30 AM - 11:00 AM",
  "11:00 AM - 11:30 AM",
  "11:30 AM - 12:00 PM",
  "02:00 PM - 02:30 PM",
  "02:30 PM - 03:00 PM",
  "03:00 PM - 03:30 PM",
  "03:30 PM - 04:00 PM",
  "04:00 PM - 04:30 PM",
  "04:30 PM - 05:00 PM",
];

export default function DoctorAvailability() {
  let doctor = null;
  try {
    doctor = JSON.parse(localStorage.getItem("doctor"));
  } catch {}

  const [publishedTimeslots, setPublishedTimeslots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // New slot builder state
  const [selectedDate, setSelectedDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  });
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [customSlot, setCustomSlot] = useState("");

  const fetchTimeslots = useCallback(async () => {
    if (!doctor?._id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/v1/doctors/timeslots?doctorId=${doctor._id}`);
      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.data)) {
        setPublishedTimeslots(data.data);
      } else {
        setPublishedTimeslots([]);
      }
    } catch (err) {
      console.error("Timeslots fetch error:", err);
      setError("Unable to load existing availability records.");
    } finally {
      setLoading(false);
    }
  }, [doctor?._id]);

  useEffect(() => {
    fetchTimeslots();
  }, [fetchTimeslots]);

  const toggleSlotSelection = (slot) => {
    if (selectedSlots.includes(slot)) {
      setSelectedSlots(selectedSlots.filter((s) => s !== slot));
    } else {
      setSelectedSlots([...selectedSlots, slot]);
    }
  };

  const handleAddCustomSlot = (e) => {
    e.preventDefault();
    if (!customSlot.trim()) return;
    if (!selectedSlots.includes(customSlot.trim())) {
      setSelectedSlots([...selectedSlots, customSlot.trim()]);
    }
    setCustomSlot("");
  };

  const handleSaveTimeslots = async () => {
    if (!selectedDate) {
      alert("Please select a date.");
      return;
    }
    if (selectedSlots.length === 0) {
      alert("Please select at least one timeslot.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccessMsg("");

    try {
      const formattedSlots = selectedSlots.map((time) => ({
        time,
        booked: false,
      }));

      const res = await fetch("/api/v1/doctors/timeslots", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          doctorId: doctor._id,
          date: selectedDate,
          slots: formattedSlots,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(`✓ Timeslots published successfully for ${selectedDate}!`);
        setSelectedSlots([]);
        fetchTimeslots();
        setTimeout(() => setSuccessMsg(""), 4000);
      } else {
        setError(data.message || "Failed to save timeslots.");
      }
    } catch (err) {
      console.error("Save timeslots error:", err);
      setError("Network error while publishing timeslots.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      {/* Page Header */}
      <div className="dd-page-header">
        <div>
          <h1 className="dd-page-title">Availability & Consultation Hours</h1>
          <p className="dd-page-subtitle">
            Publish available time windows so patients can book appointments with you on RemedyEase.
          </p>
        </div>

        <button
          type="button"
          className="dd-btn-action"
          onClick={() => fetchTimeslots()}
          disabled={loading}
        >
          <FiRefreshCw size={13} className={loading ? "hr-spin" : ""} /> Refresh
        </button>
      </div>

      {successMsg && (
        <div style={{ background: "#f0fdf4", border: "1px solid #dcfce7", padding: "14px 18px", borderRadius: "14px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px", color: "#15803d", fontSize: "13.5px" }}>
          <FiCheckCircle size={16} /> {successMsg}
        </div>
      )}

      {error && (
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", padding: "14px 18px", borderRadius: "14px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px", color: "#b91c1c", fontSize: "13.5px" }}>
          <FiAlertCircle size={16} /> {error}
        </div>
      )}

      {/* Grid: Left = Publisher, Right = Existing Schedule */}
      <div className="dd-dashboard-grid">
        {/* Left: Slot Publisher Form */}
        <div className="dd-panel-card">
          <div className="dd-panel-header">
            <h3>Publish Available Date & Slots</h3>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#0f172a", marginBottom: "6px" }}>
                Select Consultation Date
              </label>
              <input
                type="date"
                className="ap-table-search"
                min={new Date().toISOString().split("T")[0]}
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                style={{ width: "100%" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#0f172a", marginBottom: "8px" }}>
                Select Common Consultation Timeslots
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))", gap: "8px" }}>
                {PRESET_INTERVALS.map((slot) => {
                  const isSelected = selectedSlots.includes(slot);
                  return (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => toggleSlotSelection(slot)}
                      style={{
                        padding: "8px 12px",
                        fontSize: "12px",
                        fontWeight: "600",
                        borderRadius: "10px",
                        border: isSelected ? "1.5px solid #16a34a" : "1px solid #e2e8f0",
                        background: isSelected ? "#f0fdf4" : "#ffffff",
                        color: isSelected ? "#15803d" : "#334155",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        transition: "all 0.15s",
                      }}
                    >
                      <span>{slot}</span>
                      <span>{isSelected ? "✓" : "+"}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Slot Input */}
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#0f172a", marginBottom: "6px" }}>
                Or Add Custom Slot (e.g. 05:30 PM - 06:00 PM)
              </label>
              <div style={{ display: "flex", gap: "8px" }}>
                <input
                  type="text"
                  placeholder="e.g. 05:30 PM - 06:00 PM"
                  value={customSlot}
                  onChange={(e) => setCustomSlot(e.target.value)}
                  className="ap-table-search"
                  style={{ flex: 1 }}
                />
                <button
                  type="button"
                  onClick={handleAddCustomSlot}
                  className="dd-btn-action"
                >
                  <FiPlus size={13} /> Add
                </button>
              </div>
            </div>

            {/* Selected slots review */}
            {selectedSlots.length > 0 && (
              <div style={{ background: "#f8fafc", padding: "14px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                <strong style={{ fontSize: "13px", color: "#0f172a", display: "block", marginBottom: "8px" }}>
                  Selected Slots for {selectedDate} ({selectedSlots.length}):
                </strong>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {selectedSlots.map((s) => (
                    <span
                      key={s}
                      style={{
                        background: "#dcfce7",
                        color: "#15803d",
                        padding: "4px 10px",
                        borderRadius: "100px",
                        fontSize: "12px",
                        fontWeight: "700",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      {s}
                      <button
                        type="button"
                        onClick={() => toggleSlotSelection(s)}
                        style={{ background: "none", border: "none", color: "#15803d", cursor: "pointer", padding: 0 }}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            <button
              type="button"
              className="dd-btn-action dd-btn-action--approve"
              onClick={handleSaveTimeslots}
              disabled={saving}
              style={{ padding: "12px", justifyContent: "center", fontSize: "14px", borderRadius: "12px" }}
            >
              <FiSave size={16} /> {saving ? "Publishing Slots..." : `Publish ${selectedSlots.length} Slots`}
            </button>
          </div>
        </div>

        {/* Right: Existing Published Availability */}
        <div className="dd-panel-card">
          <div className="dd-panel-header">
            <h3>Currently Published Schedule</h3>
          </div>

          {loading ? (
            <p style={{ color: "#64748b", fontSize: "13px" }}>Loading published timeslots...</p>
          ) : publishedTimeslots.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 20px" }}>
              <div style={{ fontSize: "36px", marginBottom: "10px" }}>📅</div>
              <strong style={{ fontSize: "14px", color: "#0f172a", display: "block", marginBottom: "4px" }}>
                No Availability Configured
              </strong>
              <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>
                Publish timeslots so patients can discover and book sessions with you.
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {publishedTimeslots.map((record) => (
                <div
                  key={record._id || record.date}
                  style={{
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: "14px",
                    padding: "14px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <strong style={{ fontSize: "13.5px", color: "#0f172a", display: "flex", alignItems: "center", gap: "6px" }}>
                      <FiCalendar size={13} color="#16a34a" /> {record.date}
                    </strong>
                    <span className="dd-badge dd-badge--confirmed">
                      {record.slots?.length || 0} Slots
                    </span>
                  </div>

                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                    {record.slots?.map((slot, idx) => (
                      <span
                        key={idx}
                        style={{
                          background: slot.booked ? "#fee2e2" : "#ffffff",
                          color: slot.booked ? "#dc2626" : "#334155",
                          border: slot.booked ? "1px solid #fecaca" : "1px solid #e2e8f0",
                          padding: "3px 8px",
                          borderRadius: "8px",
                          fontSize: "11.5px",
                          fontWeight: "600",
                        }}
                      >
                        {slot.time} {slot.booked ? "(Booked)" : ""}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
