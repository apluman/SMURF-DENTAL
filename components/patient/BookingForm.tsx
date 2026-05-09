"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format, addDays } from "date-fns";
import { toast } from "sonner";
import type { Dentist, Service } from "@/types";

type Step = 1 | 2 | 3 | 4;

interface Props {
  dentists: (Dentist & { profile: { id: string; full_name: string } | null })[];
  services: Service[];
  maxBookingDays: number;
}

const STEPS = ["Dentist", "Service", "Date & Time", "Review"];

function getInitials(name: string) {
  return name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();
}

function formatTime(t: string) {
  const [h, m] = t.split(":");
  const hour = Number(h);
  return `${hour % 12 || 12}:${m} ${hour >= 12 ? "PM" : "AM"}`;
}

function formatDateDisplay(d: string) {
  return format(new Date(d + "T00:00:00"), "EEEE, MMMM d, yyyy");
}

const checkIcon = (
  <svg width="8" height="7" viewBox="0 0 8 7" fill="none">
    <path d="M1 3.5L3 5.5L7 1.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.625rem 0.875rem",
  borderRadius: "0.75rem",
  border: "1px solid var(--border)",
  background: "var(--bg)",
  color: "var(--ink)",
  fontSize: "0.875rem",
  outline: "none",
};

export default function BookingForm({ dentists, services, maxBookingDays }: Props) {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [selectedDentist, setSelectedDentist] = useState<Props["dentists"][number] | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [date, setDate] = useState("");
  const [slots, setSlots] = useState<string[]>([]);
  const [selectedTime, setSelectedTime] = useState("");
  const [notes, setNotes] = useState("");
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const today = format(new Date(), "yyyy-MM-dd");
  const maxDate = format(addDays(new Date(), maxBookingDays), "yyyy-MM-dd");

  async function fetchSlots(dentistId: string, d: string) {
    if (!dentistId || !d) return;
    setLoadingSlots(true);
    setSlots([]);
    setSelectedTime("");
    const res = await fetch(`/api/slots?dentist_id=${dentistId}&date=${d}`);
    const json = await res.json() as { slots: string[] };
    setSlots(json.slots);
    setLoadingSlots(false);
  }

  async function handleSubmit() {
    if (!selectedDentist || !selectedService || !date || !selectedTime) return;
    setSubmitting(true);
    const res = await fetch("/api/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        dentist_id: selectedDentist.id,
        service_id: selectedService.id,
        scheduled_date: date,
        scheduled_time: selectedTime,
        notes: notes || undefined,
      }),
    });
    if (!res.ok) {
      const data = await res.json() as { error: string };
      toast.error(typeof data.error === "string" ? data.error : "Booking failed.");
      setSubmitting(false);
      return;
    }
    const appt = await res.json() as { id: string };
    router.push(`/patient/book/success?id=${appt.id}`);
  }

  /* ── Step indicator ── */
  const stepBar = (
    <div style={{ display: "flex", alignItems: "flex-start", marginBottom: "2rem" }}>
      {STEPS.map((label, i) => {
        const n = i + 1;
        const done = step > n;
        const active = step === n;
        return (
          <div key={label} style={{ display: "flex", alignItems: "flex-start", flex: i < STEPS.length - 1 ? 1 : "none" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.3rem", flexShrink: 0 }}>
              <div style={{
                width: "1.75rem", height: "1.75rem", borderRadius: "50%",
                background: done || active ? "var(--accent)" : "var(--border)",
                color: "white",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "0.7rem", fontWeight: 700,
                transition: "background 0.2s",
              }}>
                {done ? checkIcon : n}
              </div>
              <span style={{ fontSize: "0.6rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: active ? "var(--ink)" : "var(--ink-muted)", whiteSpace: "nowrap" }}>
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div style={{ flex: 1, height: "1px", background: done ? "var(--accent)" : "var(--border)", margin: "0.875rem 0.375rem 0" }} />
            )}
          </div>
        );
      })}
    </div>
  );

  /* ── Shared back/continue buttons ── */
  const renderNav = (canContinue: boolean, onContinue: () => void, continueLabel = "Continue") => (
    <div style={{ display: "flex", justifyContent: "space-between", marginTop: "1.5rem", gap: "0.75rem" }}>
      {step > 1 ? (
        <button
          type="button"
          onClick={() => setStep(s => (s - 1) as Step)}
          style={{ padding: "0.625rem 1.25rem", borderRadius: "0.75rem", border: "1px solid var(--border)", background: "transparent", color: "var(--ink-muted)", fontSize: "0.875rem", fontWeight: 500, cursor: "pointer" }}
        >
          Back
        </button>
      ) : <span />}
      <button
        type="button"
        onClick={onContinue}
        disabled={!canContinue}
        style={{ padding: "0.625rem 1.5rem", borderRadius: "0.75rem", border: "none", background: canContinue ? "var(--accent)" : "var(--border)", color: "white", fontSize: "0.875rem", fontWeight: 600, cursor: canContinue ? "pointer" : "not-allowed", opacity: canContinue ? 1 : 0.7, transition: "background 0.15s" }}
      >
        {continueLabel}
      </button>
    </div>
  );

  /* ── Step 1: Dentist ── */
  if (step === 1) return (
    <div>
      {stepBar}
      <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--ink-muted)" }}>Choose your dentist</p>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
        {dentists.map(d => {
          const sel = selectedDentist?.id === d.id;
          return (
            <button
              key={d.id}
              type="button"
              onClick={() => setSelectedDentist(d)}
              style={{
                display: "flex", alignItems: "flex-start", gap: "0.875rem",
                padding: "1rem", borderRadius: "0.875rem", textAlign: "left", width: "100%", cursor: "pointer",
                border: `2px solid ${sel ? "var(--accent)" : "var(--border)"}`,
                background: sel ? "var(--accent-subtle)" : "var(--surface)",
                transition: "all 0.15s",
              }}
            >
              <div style={{ width: "2.5rem", height: "2.5rem", borderRadius: "50%", flexShrink: 0, background: sel ? "var(--accent)" : "#E5E7EB", display: "flex", alignItems: "center", justifyContent: "center", color: sel ? "white" : "var(--ink-muted)", fontWeight: 700, fontSize: "0.8rem" }}>
                {getInitials(d.profile?.full_name ?? "?")}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--ink)" }}>Dr. {d.profile?.full_name}</p>
                <p style={{ fontSize: "0.72rem", fontWeight: 600, color: "var(--accent)", marginTop: "0.125rem" }}>{d.specialization}</p>
                {d.bio && <p style={{ fontSize: "0.75rem", color: "var(--ink-muted)", marginTop: "0.375rem", lineHeight: 1.5 }}>{d.bio.length > 110 ? d.bio.slice(0, 110) + "…" : d.bio}</p>}
              </div>
              {sel && (
                <div style={{ width: "1.25rem", height: "1.25rem", borderRadius: "50%", background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: "0.125rem" }}>
                  {checkIcon}
                </div>
              )}
            </button>
          );
        })}
      </div>
      {renderNav(!!selectedDentist, () => setStep(2))}
    </div>
  );

  /* ── Step 2: Service ── */
  if (step === 2) return (
    <div>
      {stepBar}
      <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--ink-muted)" }}>Choose a service</p>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
        {services.map(s => {
          const sel = selectedService?.id === s.id;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => setSelectedService(s)}
              style={{
                display: "flex", alignItems: "center", gap: "0.875rem",
                padding: "1rem", borderRadius: "0.875rem", textAlign: "left", width: "100%", cursor: "pointer",
                border: `2px solid ${sel ? "var(--accent)" : "var(--border)"}`,
                background: sel ? "var(--accent-subtle)" : "var(--surface)",
                transition: "all 0.15s",
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--ink)" }}>{s.name}</p>
                {s.description && <p style={{ fontSize: "0.75rem", color: "var(--ink-muted)", marginTop: "0.25rem", lineHeight: 1.5 }}>{s.description}</p>}
                <div style={{ display: "flex", gap: "1rem", marginTop: "0.5rem" }}>
                  <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--accent)" }}>₱{Number(s.price).toLocaleString()}</span>
                  <span style={{ fontSize: "0.78rem", color: "var(--ink-muted)" }}>{s.duration_minutes} min</span>
                </div>
              </div>
              {sel && (
                <div style={{ width: "1.25rem", height: "1.25rem", borderRadius: "50%", background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {checkIcon}
                </div>
              )}
            </button>
          );
        })}
      </div>
      {renderNav(!!selectedService, () => setStep(3))}
    </div>
  );

  /* ── Step 3: Date & Time ── */
  if (step === 3) return (
    <div>
      {stepBar}
      <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        <div>
          <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--ink-muted)", marginBottom: "0.5rem" }}>
            Select a date
          </label>
          <input
            type="date"
            value={date}
            min={today}
            max={maxDate}
            onChange={e => { setDate(e.target.value); fetchSlots(selectedDentist!.id, e.target.value); }}
            style={inputStyle}
          />
          <p style={{ fontSize: "0.7rem", color: "var(--ink-muted)", marginTop: "0.375rem" }}>
            Available up to {maxBookingDays} days ahead
          </p>
        </div>

        {date && (
          <div>
            <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--ink-muted)", marginBottom: "0.5rem" }}>
              Available time slots
            </label>
            {loadingSlots && (
              <p style={{ fontSize: "0.875rem", color: "var(--ink-muted)" }}>Loading slots…</p>
            )}
            {!loadingSlots && slots.length === 0 && (
              <div style={{ padding: "1.25rem", borderRadius: "0.75rem", background: "#FEF2F2", border: "1px solid #FECACA", textAlign: "center" }}>
                <p style={{ fontSize: "0.875rem", color: "#DC2626", fontWeight: 500 }}>No available slots on this date</p>
                <p style={{ fontSize: "0.75rem", color: "#DC2626", marginTop: "0.25rem", opacity: 0.8 }}>Try a different date</p>
              </div>
            )}
            {slots.length > 0 && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.5rem" }}>
                {slots.map(slot => {
                  const sel = selectedTime === slot;
                  return (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setSelectedTime(slot)}
                      style={{
                        padding: "0.5rem 0.25rem", borderRadius: "0.625rem", fontSize: "0.8rem", fontWeight: 600,
                        border: `2px solid ${sel ? "var(--accent)" : "var(--border)"}`,
                        background: sel ? "var(--accent)" : "var(--surface)",
                        color: sel ? "white" : "var(--ink)",
                        cursor: "pointer", transition: "all 0.12s",
                      }}
                    >
                      {formatTime(slot)}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
      {renderNav(!!date && !!selectedTime, () => setStep(4))}
    </div>
  );

  /* ── Step 4: Review ── */
  return (
    <div>
      {stepBar}

      {/* Summary card */}
      <div style={{ borderRadius: "0.875rem", border: "1px solid var(--border)", overflow: "hidden", marginBottom: "1.25rem" }}>
        <div style={{ padding: "0.75rem 1rem", background: "var(--bg)", borderBottom: "1px solid var(--border)" }}>
          <p style={{ fontSize: "0.7rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--ink-muted)" }}>Appointment Summary</p>
        </div>
        {[
          { label: "Dentist", value: `Dr. ${selectedDentist?.profile?.full_name}` },
          { label: "Specialization", value: selectedDentist?.specialization ?? "" },
          { label: "Service", value: selectedService?.name ?? "" },
          { label: "Price", value: `₱${Number(selectedService?.price ?? 0).toLocaleString()}` },
          { label: "Duration", value: `${selectedService?.duration_minutes} min` },
          { label: "Date", value: formatDateDisplay(date) },
          { label: "Time", value: formatTime(selectedTime) },
        ].map((row, i, arr) => (
          <div
            key={row.label}
            style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem 1rem", borderBottom: i < arr.length - 1 ? "1px solid var(--border)" : "none", gap: "1rem" }}
          >
            <span style={{ fontSize: "0.8rem", color: "var(--ink-muted)", flexShrink: 0 }}>{row.label}</span>
            <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--ink)", textAlign: "right" }}>{row.value}</span>
          </div>
        ))}
      </div>

      {/* Notes */}
      <div style={{ marginBottom: "1.25rem" }}>
        <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--ink-muted)", marginBottom: "0.5rem" }}>
          Notes <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(optional)</span>
        </label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={3}
          maxLength={500}
          placeholder="Any concerns or special requests…"
          style={{ ...inputStyle, resize: "vertical", lineHeight: 1.5 }}
        />
        <p style={{ fontSize: "0.7rem", color: "var(--ink-muted)", marginTop: "0.25rem", textAlign: "right" }}>{notes.length}/500</p>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem" }}>
        <button
          type="button"
          onClick={() => setStep(3)}
          style={{ padding: "0.625rem 1.25rem", borderRadius: "0.75rem", border: "1px solid var(--border)", background: "transparent", color: "var(--ink-muted)", fontSize: "0.875rem", fontWeight: 500, cursor: "pointer" }}
        >
          Back
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          style={{ padding: "0.625rem 1.75rem", borderRadius: "0.75rem", border: "none", background: "var(--accent)", color: "white", fontSize: "0.875rem", fontWeight: 700, cursor: submitting ? "not-allowed" : "pointer", opacity: submitting ? 0.7 : 1, transition: "opacity 0.15s" }}
        >
          {submitting ? "Booking…" : "Confirm Appointment"}
        </button>
      </div>
    </div>
  );
}
