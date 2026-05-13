"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";

interface Appointment {
  id: string;
  scheduled_date: string;
  scheduled_time: string;
  status: string;
  notes: string | null;
  patient: { full_name: string; email: string; phone: string | null } | null;
  service: { name: string; duration_minutes: number } | null;
}

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  confirmed: { bg: "rgba(16,185,129,0.12)",  color: "#10B981" },
  pending:   { bg: "rgba(245,158,11,0.12)",  color: "#F59E0B" },
  cancelled: { bg: "rgba(220,38,38,0.12)",   color: "#DC2626" },
  completed: { bg: "rgba(107,114,128,0.12)", color: "#6B7280" },
};

const ALL_FILTERS = ["all", "pending", "confirmed", "completed", "cancelled"] as const;

function formatTime(t: string) {
  const [h, m] = t.split(":");
  const hour = Number(h);
  return `${hour % 12 || 12}:${m} ${hour >= 12 ? "PM" : "AM"}`;
}

export default function DentistAppointmentsTable({ appointments }: { appointments: Appointment[] }) {
  const router = useRouter();
  const [filter, setFilter] = useState("all");
  const [statuses, setStatuses] = useState<Record<string, string>>(
    Object.fromEntries(appointments.map((a) => [a.id, a.status]))
  );
  const [notes, setNotes] = useState<Record<string, string>>(
    Object.fromEntries(appointments.map((a) => [a.id, a.notes ?? ""]))
  );
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [savingNotes, setSavingNotes] = useState<string | null>(null);
  const [updatingStatus, startStatusTransition] = useTransition();
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const filtered = filter === "all"
    ? appointments
    : appointments.filter((a) => (statuses[a.id] ?? a.status) === filter);

  function updateStatus(id: string, status: string) {
    const prev = statuses[id];
    setUpdatingId(id);
    setStatuses((s) => ({ ...s, [id]: status }));
    startStatusTransition(async () => {
      const res = await fetch(`/api/appointments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        setStatuses((s) => ({ ...s, [id]: prev ?? status }));
      } else {
        router.refresh();
      }
      setUpdatingId(null);
    });
  }

  async function saveNotes(id: string) {
    setSavingNotes(id);
    const currentStatus = statuses[id] ?? appointments.find(a => a.id === id)?.status ?? "pending";
    await fetch(`/api/appointments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: currentStatus, notes: notes[id] }),
    });
    setSavingNotes(null);
    setEditingNotes(null);
    router.refresh();
  }

  return (
    <div>
      {/* Filter tabs */}
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1rem" }}>
        {ALL_FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: "0.375rem 0.875rem", borderRadius: "0.5rem",
              fontSize: "0.8125rem", fontWeight: 500, textTransform: "capitalize",
              cursor: "pointer", border: "1px solid",
              background: filter === f ? "var(--accent)" : "transparent",
              borderColor: filter === f ? "var(--accent)" : "var(--border)",
              color: filter === f ? "white" : "var(--ink-muted)",
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "0.875rem", overflow: "hidden" }}>
        {!filtered.length ? (
          <div style={{ textAlign: "center", padding: "4rem 1rem", color: "var(--ink-muted)", fontSize: "0.875rem" }}>
            No appointments found.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem", minWidth: "700px" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--bg)" }}>
                  {["Patient", "Service", "Date & Time", "Treatment Notes", "Status", "Action"].map((h) => (
                    <th key={h} style={{
                      padding: "0.625rem 1rem", textAlign: "left",
                      fontSize: "0.75rem", fontWeight: 600, color: "var(--ink-muted)",
                      textTransform: "uppercase", letterSpacing: "0.04em",
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((appt, i) => {
                  const currentStatus = statuses[appt.id] ?? appt.status;
                  const statusColor = STATUS_COLORS[currentStatus] ?? STATUS_COLORS.completed;
                  const isDone = currentStatus === "cancelled" || currentStatus === "completed";
                  const isEditingNote = editingNotes === appt.id;
                  const d = new Date(appt.scheduled_date + "T00:00:00");

                  return (
                    <tr
                      key={appt.id}
                      style={{ borderBottom: i < filtered.length - 1 ? "1px solid var(--border)" : "none" }}
                    >
                      {/* Patient */}
                      <td style={{ padding: "0.875rem 1rem" }}>
                        <p style={{ fontWeight: 600, color: "var(--ink)" }}>{appt.patient?.full_name}</p>
                        <p style={{ fontSize: "0.75rem", color: "var(--ink-muted)", marginTop: "2px" }}>{appt.patient?.phone ?? appt.patient?.email}</p>
                      </td>

                      {/* Service */}
                      <td style={{ padding: "0.875rem 1rem" }}>
                        <p style={{ color: "var(--ink)" }}>{appt.service?.name}</p>
                        <p style={{ fontSize: "0.75rem", color: "var(--ink-muted)", marginTop: "2px" }}>{appt.service?.duration_minutes} min</p>
                      </td>

                      {/* Date & Time */}
                      <td style={{ padding: "0.875rem 1rem", whiteSpace: "nowrap" }}>
                        <p style={{ color: "var(--ink)", fontWeight: 500 }}>{format(d, "MMM d, yyyy")}</p>
                        <p style={{ fontSize: "0.75rem", color: "var(--ink-muted)", marginTop: "2px" }}>{formatTime(appt.scheduled_time)}</p>
                      </td>

                      {/* Treatment Notes */}
                      <td style={{ padding: "0.875rem 1rem", maxWidth: "220px" }}>
                        {isEditingNote ? (
                          <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                            <textarea
                              value={notes[appt.id] ?? ""}
                              onChange={(e) => setNotes((n) => ({ ...n, [appt.id]: e.target.value }))}
                              rows={3}
                              maxLength={500}
                              style={{
                                width: "100%", padding: "0.375rem 0.5rem", fontSize: "0.8125rem",
                                borderRadius: "0.375rem", border: "1px solid var(--border)",
                                background: "var(--bg)", color: "var(--ink)", resize: "vertical",
                              }}
                            />
                            <div style={{ display: "flex", gap: "0.375rem" }}>
                              <button
                                onClick={() => saveNotes(appt.id)}
                                disabled={savingNotes === appt.id}
                                style={{
                                  padding: "0.25rem 0.625rem", borderRadius: "0.375rem", fontSize: "0.75rem",
                                  background: "var(--accent)", color: "white", border: "none",
                                  cursor: savingNotes === appt.id ? "not-allowed" : "pointer",
                                  opacity: savingNotes === appt.id ? 0.7 : 1, fontWeight: 500,
                                }}
                              >
                                {savingNotes === appt.id ? "Saving…" : "Save"}
                              </button>
                              <button
                                onClick={() => { setEditingNotes(null); setNotes((n) => ({ ...n, [appt.id]: appt.notes ?? "" })); }}
                                style={{
                                  padding: "0.25rem 0.625rem", borderRadius: "0.375rem", fontSize: "0.75rem",
                                  background: "transparent", color: "var(--ink-muted)",
                                  border: "1px solid var(--border)", cursor: "pointer",
                                }}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div
                            onClick={() => setEditingNotes(appt.id)}
                            style={{
                              cursor: "pointer", padding: "0.375rem 0.5rem", borderRadius: "0.375rem",
                              border: "1px dashed var(--border)", minHeight: "2rem",
                              fontSize: "0.8125rem", color: notes[appt.id] ? "var(--ink-muted)" : "var(--ink-muted)",
                              opacity: notes[appt.id] ? 1 : 0.5,
                            }}
                            title="Click to edit notes"
                          >
                            {notes[appt.id] || "Click to add notes…"}
                          </div>
                        )}
                      </td>

                      {/* Status badge */}
                      <td style={{ padding: "0.875rem 1rem", whiteSpace: "nowrap" }}>
                        <span style={{
                          background: statusColor?.bg ?? "rgba(107,114,128,0.12)", color: statusColor?.color ?? "#6B7280",
                          padding: "3px 10px", borderRadius: "999px",
                          fontSize: "0.75rem", fontWeight: 600, textTransform: "capitalize",
                        }}>
                          {currentStatus}
                        </span>
                      </td>

                      {/* Action */}
                      <td style={{ padding: "0.875rem 1rem" }}>
                        {isDone ? (
                          <span style={{ fontSize: "0.75rem", color: "var(--ink-muted)" }}>—</span>
                        ) : (
                          <select
                            value={currentStatus}
                            disabled={updatingStatus && updatingId === appt.id}
                            onChange={(e) => updateStatus(appt.id, e.target.value)}
                            style={{
                              padding: "0.375rem 0.625rem", borderRadius: "0.5rem", fontSize: "0.8125rem",
                              border: "1px solid var(--border)", background: "var(--bg)", color: "var(--ink)",
                              cursor: "pointer",
                            }}
                          >
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="completed">Completed</option>
                          </select>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
