"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface Patient { id: string; full_name: string; email: string; }
interface Dentist { id: string; profile: { full_name: string }; }
interface Service { id: string; name: string; price: number; duration_minutes: number; }

interface Props {
  patients: Patient[];
  dentists: Dentist[];
  services: Service[];
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "0.5rem 0.75rem",
  borderRadius: "8px", border: "1px solid var(--border)",
  background: "var(--bg)", color: "var(--ink)",
  fontSize: "0.875rem", outline: "none",
};

const labelStyle: React.CSSProperties = {
  display: "block", fontSize: "0.75rem", fontWeight: 600,
  textTransform: "uppercase", letterSpacing: "0.05em",
  color: "var(--ink-muted)", marginBottom: "0.375rem",
};

export default function AddAppointmentModal({ patients, dentists, services }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [patientId, setPatientId] = useState("");
  const [dentistId, setDentistId] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [notes, setNotes] = useState("");
  const [slots, setSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [patientSearch, setPatientSearch] = useState("");

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    setTime("");
    setSlots([]);
    if (!dentistId || !date) return;
    setLoadingSlots(true);
    fetch(`/api/slots?dentist_id=${dentistId}&date=${date}`)
      .then(r => r.json())
      .then((d: { slots?: string[] }) => setSlots(d.slots ?? []))
      .catch(() => setSlots([]))
      .finally(() => setLoadingSlots(false));
  }, [dentistId, date]);

  function reset() {
    setPatientId(""); setDentistId(""); setServiceId("");
    setDate(""); setTime(""); setNotes("");
    setSlots([]); setPatientSearch("");
  }

  function close() { setOpen(false); reset(); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!patientId || !dentistId || !serviceId || !date || !time) {
      toast.error("Please fill in all required fields.");
      return;
    }
    setSubmitting(true);
    const res = await fetch("/api/receptionist/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ patient_id: patientId, dentist_id: dentistId, service_id: serviceId, scheduled_date: date, scheduled_time: time, notes: notes || undefined }),
    });
    const data = await res.json() as { error?: string };
    setSubmitting(false);
    if (!res.ok) {
      toast.error(data.error ?? "Failed to book appointment.");
      return;
    }
    toast.success("Appointment booked and confirmed.");
    close();
    router.refresh();
  }

  function formatTime(t: string) {
    const [h, m] = t.split(":");
    const hour = Number(h);
    return `${hour % 12 || 12}:${m} ${hour >= 12 ? "PM" : "AM"}`;
  }

  const filteredPatients = patients.filter(p =>
    p.full_name.toLowerCase().includes(patientSearch.toLowerCase()) ||
    p.email.toLowerCase().includes(patientSearch.toLowerCase())
  );

  const today = new Date().toISOString().split("T")[0];

  const modal = open && (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}
      onClick={close}
    >
      <div
        style={{ background: "var(--surface)", borderRadius: "1rem", width: "100%", maxWidth: "32rem", maxHeight: "90vh", overflowY: "auto", boxShadow: "var(--shadow-md)" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--border)" }}>
          <div>
            <h2 style={{ fontSize: "1.125rem", fontWeight: 600, color: "var(--ink)", margin: 0 }}>Book Appointment</h2>
            <p style={{ fontSize: "0.8rem", color: "var(--ink-muted)", marginTop: "2px" }}>Walk-in or phone booking</p>
          </div>
          <button onClick={close} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ink-muted)", padding: "4px" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.125rem" }}>

          {/* Patient */}
          <div>
            <label style={labelStyle}>Patient <span style={{ color: "#DC2626" }}>*</span></label>
            <input
              type="text"
              placeholder="Search by name or email…"
              value={patientSearch}
              onChange={e => { setPatientSearch(e.target.value); setPatientId(""); }}
              style={{ ...inputStyle, marginBottom: "0.375rem" }}
            />
            {patientSearch && !patientId && (
              <div style={{ border: "1px solid var(--border)", borderRadius: "8px", background: "var(--surface)", maxHeight: "160px", overflowY: "auto" }}>
                {filteredPatients.length === 0 ? (
                  <p style={{ padding: "0.75rem", fontSize: "0.8125rem", color: "var(--ink-muted)" }}>No patients found.</p>
                ) : filteredPatients.slice(0, 8).map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => { setPatientId(p.id); setPatientSearch(p.full_name); }}
                    style={{
                      width: "100%", textAlign: "left", padding: "0.625rem 0.875rem",
                      background: "none", border: "none", cursor: "pointer",
                      borderBottom: "1px solid var(--border)",
                    }}
                  >
                    <p style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--ink)" }}>{p.full_name}</p>
                    <p style={{ fontSize: "0.75rem", color: "var(--ink-muted)" }}>{p.email}</p>
                  </button>
                ))}
              </div>
            )}
            {patientId && (
              <p style={{ fontSize: "0.75rem", color: "var(--accent)", marginTop: "4px" }}>✓ Selected</p>
            )}
          </div>

          {/* Dentist + Service */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <label style={labelStyle}>Dentist <span style={{ color: "#DC2626" }}>*</span></label>
              <select value={dentistId} onChange={e => { setDentistId(e.target.value); setDate(""); }} style={inputStyle}>
                <option value="">Select dentist</option>
                {dentists.map(d => (
                  <option key={d.id} value={d.id}>Dr. {d.profile.full_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Service <span style={{ color: "#DC2626" }}>*</span></label>
              <select value={serviceId} onChange={e => setServiceId(e.target.value)} style={inputStyle}>
                <option value="">Select service</option>
                {services.map(s => (
                  <option key={s.id} value={s.id}>{s.name} — ₱{s.price}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Date */}
          <div>
            <label style={labelStyle}>Date <span style={{ color: "#DC2626" }}>*</span></label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              min={today}
              disabled={!dentistId}
              style={{ ...inputStyle, opacity: dentistId ? 1 : 0.5 }}
            />
            {!dentistId && <p style={{ fontSize: "0.75rem", color: "var(--ink-muted)", marginTop: "4px" }}>Select a dentist first.</p>}
          </div>

          {/* Time slots */}
          <div>
            <label style={labelStyle}>Time Slot <span style={{ color: "#DC2626" }}>*</span></label>
            {!date || !dentistId ? (
              <p style={{ fontSize: "0.8125rem", color: "var(--ink-muted)" }}>Select a dentist and date first.</p>
            ) : loadingSlots ? (
              <p style={{ fontSize: "0.8125rem", color: "var(--ink-muted)" }}>Loading slots…</p>
            ) : slots.length === 0 ? (
              <p style={{ fontSize: "0.8125rem", color: "#DC2626" }}>No available slots on this date.</p>
            ) : (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem" }}>
                {slots.map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setTime(s)}
                    style={{
                      padding: "0.375rem 0.75rem", borderRadius: "8px",
                      border: `1px solid ${time === s ? "var(--accent)" : "var(--border)"}`,
                      background: time === s ? "var(--accent)" : "var(--bg)",
                      color: time === s ? "white" : "var(--ink)",
                      fontSize: "0.8125rem", fontWeight: 500, cursor: "pointer",
                    }}
                  >
                    {formatTime(s)}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label style={labelStyle}>Notes <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(optional)</span></label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Any special instructions or concerns…"
              rows={2}
              style={{ ...inputStyle, resize: "vertical" }}
            />
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", paddingTop: "0.5rem" }}>
            <button type="button" onClick={close} style={{ padding: "0.5rem 1.25rem", borderRadius: "8px", border: "1px solid var(--border)", background: "transparent", color: "var(--ink)", fontSize: "0.875rem", cursor: "pointer" }}>
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !patientId || !dentistId || !serviceId || !date || !time}
              style={{
                padding: "0.5rem 1.5rem", borderRadius: "8px",
                background: "var(--accent)", color: "white",
                border: "none", fontSize: "0.875rem", fontWeight: 600,
                cursor: submitting ? "not-allowed" : "pointer",
                opacity: submitting || !patientId || !dentistId || !serviceId || !date || !time ? 0.5 : 1,
              }}
            >
              {submitting ? "Booking…" : "Confirm Booking"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          display: "inline-flex", alignItems: "center", gap: "0.5rem",
          padding: "0.5rem 1.125rem", borderRadius: "10px",
          background: "var(--accent)", color: "white",
          border: "none", fontSize: "0.875rem", fontWeight: 600,
          cursor: "pointer", whiteSpace: "nowrap",
        }}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M12 5v14M5 12h14"/>
        </svg>
        Add Appointment
      </button>
      {mounted && createPortal(modal, document.body)}
    </>
  );
}
