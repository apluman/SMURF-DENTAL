"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface Dentist {
  id: string;
  profile: { id: string; full_name: string };
}

interface Schedule {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

interface BlockedDate {
  id: string;
  date: string;
  reason: string | null;
}

interface DayState {
  active: boolean;
  start: string;
  end: string;
  saving: boolean;
}

interface Props {
  dentists: Dentist[];
  initialBlockedDates: BlockedDate[];
}

const inputStyle: React.CSSProperties = {
  padding: "0.4rem 0.6rem",
  borderRadius: "8px",
  border: "1px solid var(--border)",
  background: "var(--bg)",
  color: "var(--ink)",
  fontSize: "0.8rem",
  width: "100%",
};

function buildDayStates(schedules: Schedule[]): DayState[] {
  return Array.from({ length: 7 }, (_, i) => {
    const s = schedules.find(s => s.day_of_week === i);
    return {
      active: s?.is_active ?? false,
      start: s?.start_time?.slice(0, 5) ?? "09:00",
      end: s?.end_time?.slice(0, 5) ?? "17:00",
      saving: false,
    };
  });
}

export default function AdminScheduleManager({ dentists, initialBlockedDates }: Props) {
  const [selectedId, setSelectedId] = useState<string>(dentists[0]?.id ?? "");
  const [days, setDays] = useState<DayState[]>(buildDayStates([]));
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>(initialBlockedDates);
  const [blockDate, setBlockDate] = useState("");
  const [blockReason, setBlockReason] = useState("");
  const [blocking, setBlocking] = useState(false);

  const loadSchedule = useCallback(async (dentistId: string) => {
    if (!dentistId) return;
    setLoadingSchedule(true);
    try {
      const res = await fetch(`/api/admin/schedule?dentist_id=${dentistId}`);
      const data = await res.json() as Schedule[];
      setDays(buildDayStates(Array.isArray(data) ? data : []));
    } catch {
      toast.error("Failed to load schedule.");
    } finally {
      setLoadingSchedule(false);
    }
  }, []);

  useEffect(() => {
    if (selectedId) loadSchedule(selectedId);
  }, [selectedId, loadSchedule]);

  function update(i: number, patch: Partial<DayState>) {
    setDays(prev => prev.map((d, idx) => idx === i ? { ...d, ...patch } : d));
  }

  async function toggleDay(i: number) {
    const d = days[i];
    if (!d || !selectedId) return;
    if (d.active) {
      update(i, { saving: true });
      const res = await fetch("/api/admin/schedule", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dentist_id: selectedId, day_of_week: i }),
      });
      if (res.ok) {
        update(i, { active: false, saving: false });
        toast.success(`${DAYS[i]} removed.`);
      } else {
        toast.error(`Failed to remove ${DAYS[i]}.`);
        update(i, { saving: false });
      }
    } else {
      update(i, { active: true });
    }
  }

  async function saveDay(i: number) {
    const d = days[i];
    if (!d || !selectedId) return;
    update(i, { saving: true });
    const res = await fetch("/api/admin/schedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        dentist_id: selectedId,
        day_of_week: i,
        start_time: d.start,
        end_time: d.end,
      }),
    });
    if (res.ok) {
      toast.success(`${DAYS[i]} saved.`);
    } else {
      toast.error(`Failed to save ${DAYS[i]}.`);
    }
    update(i, { saving: false });
  }

  async function handleBlockClinic(e: React.FormEvent) {
    e.preventDefault();
    setBlocking(true);
    const res = await fetch("/api/admin/blocked-dates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: blockDate, reason: blockReason || undefined }),
    });
    if (res.ok) {
      toast.success(`${blockDate} blocked clinic-wide.`);
      setBlockedDates(prev => [...prev, { id: Date.now().toString(), date: blockDate, reason: blockReason || null }].sort((a, b) => a.date.localeCompare(b.date)));
      setBlockDate("");
      setBlockReason("");
    } else {
      toast.error("Failed to block date.");
    }
    setBlocking(false);
  }

  async function handleUnblock(id: string) {
    const res = await fetch("/api/admin/blocked-dates", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      setBlockedDates(prev => prev.filter(d => d.id !== id));
      toast.success("Date unblocked.");
    } else {
      toast.error("Failed to unblock date.");
    }
  }

  const selectedDentist = dentists.find(d => d.id === selectedId);

  if (dentists.length === 0) {
    return (
      <div className="card p-10 text-center">
        <p style={{ color: "var(--ink-muted)", fontSize: "0.9rem" }}>
          No dentists registered yet. Add a dentist first to manage their schedule.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>

      {/* ── Dentist Selector ── */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--ink-muted)" }}>
          Select Dentist
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
          {dentists.map(d => (
            <button
              key={d.id}
              onClick={() => setSelectedId(d.id)}
              style={{
                padding: "0.5rem 1.125rem",
                borderRadius: "999px",
                border: `1px solid ${selectedId === d.id ? "var(--accent)" : "var(--border)"}`,
                background: selectedId === d.id ? "var(--accent)" : "var(--surface)",
                color: selectedId === d.id ? "white" : "var(--ink)",
                fontSize: "0.8125rem",
                fontWeight: selectedId === d.id ? 600 : 400,
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              Dr. {d.profile.full_name}
            </button>
          ))}
        </div>
      </div>

      {/* ── Weekly Schedule ── */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--ink-muted)" }}>
          Working Hours — Dr. {selectedDentist?.profile.full_name}
        </p>
        <div className="card overflow-hidden" style={{ opacity: loadingSchedule ? 0.5 : 1, transition: "opacity 0.2s" }}>
          {loadingSchedule ? (
            <div style={{ padding: "2rem", textAlign: "center", color: "var(--ink-muted)", fontSize: "0.875rem" }}>
              Loading schedule…
            </div>
          ) : (
            DAYS.map((day, i) => {
              const d = days[i]!;
              const isWeekend = i === 0 || i === 6;
              return (
                <div
                  key={day}
                  className="flex flex-wrap items-center gap-3 px-5 py-3.5"
                  style={{
                    borderBottom: i < 6 ? "1px solid var(--border)" : "none",
                    opacity: !d.active && isWeekend ? 0.55 : 1,
                  }}
                >
                  {/* Toggle */}
                  <div className="flex items-center gap-3 flex-shrink-0" style={{ width: "7.5rem" }}>
                    <button
                      type="button"
                      onClick={() => toggleDay(i)}
                      disabled={d.saving}
                      style={{
                        width: "36px", height: "20px", borderRadius: "10px",
                        background: d.active ? "var(--accent)" : "var(--border)",
                        border: "none", cursor: "pointer", flexShrink: 0,
                        position: "relative", transition: "background 0.2s",
                      }}
                    >
                      <span style={{
                        position: "absolute", top: "2px",
                        left: d.active ? "18px" : "2px",
                        width: "16px", height: "16px", borderRadius: "50%",
                        background: "white", boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                        transition: "left 0.2s",
                      }} />
                    </button>
                    <span className="text-sm font-medium" style={{ color: d.active ? "var(--ink)" : "var(--ink-muted)" }}>
                      <span className="hidden sm:inline">{day}</span>
                      <span className="sm:hidden">{SHORT[i]}</span>
                    </span>
                  </div>

                  {/* Times */}
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <input
                      type="time"
                      value={d.start}
                      onChange={e => update(i, { start: e.target.value })}
                      disabled={!d.active}
                      style={{ ...inputStyle, maxWidth: "110px", opacity: d.active ? 1 : 0.35 }}
                    />
                    <span className="text-xs flex-shrink-0" style={{ color: "var(--ink-muted)" }}>to</span>
                    <input
                      type="time"
                      value={d.end}
                      onChange={e => update(i, { end: e.target.value })}
                      disabled={!d.active}
                      style={{ ...inputStyle, maxWidth: "110px", opacity: d.active ? 1 : 0.35 }}
                    />
                  </div>

                  {/* Save */}
                  <button
                    type="button"
                    onClick={() => saveDay(i)}
                    disabled={d.saving || !d.active}
                    style={{
                      padding: "0.375rem 0.875rem", borderRadius: "8px",
                      background: "var(--accent-subtle)", color: "var(--accent)",
                      border: "none", fontSize: "0.75rem", fontWeight: 600,
                      cursor: d.saving || !d.active ? "not-allowed" : "pointer",
                      opacity: d.saving || !d.active ? 0.4 : 1,
                      flexShrink: 0,
                    }}
                  >
                    {d.saving ? "Saving…" : "Save"}
                  </button>
                </div>
              );
            })
          )}
        </div>
        <p className="text-xs mt-2" style={{ color: "var(--ink-muted)" }}>
          Toggle a day on to enable it, set the hours, then click Save.
        </p>
      </div>

      {/* ── Clinic-Wide Closures ── */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--ink-muted)" }}>
          Clinic-Wide Closures
        </p>
        <p className="text-sm mb-4" style={{ color: "var(--ink-muted)" }}>
          Blocks all bookings on the selected date — applies to every dentist.
        </p>

        <div className="card p-5 mb-4">
          <form onSubmit={handleBlockClinic}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "var(--ink-muted)" }}>
                  Date
                </label>
                <input
                  type="date"
                  value={blockDate}
                  onChange={e => setBlockDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  required
                  style={inputStyle}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "var(--ink-muted)" }}>
                  Reason <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(optional)</span>
                </label>
                <input
                  type="text"
                  value={blockReason}
                  onChange={e => setBlockReason(e.target.value)}
                  placeholder="e.g. Holiday, Renovation, Emergency"
                  style={inputStyle}
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={blocking || !blockDate}
              style={{
                padding: "0.5rem 1.25rem", borderRadius: "10px",
                background: "#DC2626", color: "white",
                border: "none", fontSize: "0.875rem", fontWeight: 500,
                cursor: blocking || !blockDate ? "not-allowed" : "pointer",
                opacity: blocking || !blockDate ? 0.5 : 1,
              }}
            >
              {blocking ? "Blocking…" : "Block Clinic"}
            </button>
          </form>
        </div>

        {/* List of blocked dates */}
        {blockedDates.length === 0 ? (
          <div className="card p-6 text-center">
            <p style={{ color: "var(--ink-muted)", fontSize: "0.875rem" }}>No upcoming clinic closures.</p>
          </div>
        ) : (
          <div className="card overflow-hidden">
            {blockedDates.map((bd, i) => {
              const parsed = parseISO(bd.date);
              return (
                <div
                  key={bd.id}
                  style={{
                    display: "flex", alignItems: "center", gap: "1rem",
                    padding: "0.875rem 1.25rem",
                    borderBottom: i < blockedDates.length - 1 ? "1px solid var(--border)" : "none",
                  }}
                >
                  <div style={{
                    width: "44px", height: "44px", borderRadius: "10px", flexShrink: 0,
                    background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.15)",
                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                  }}>
                    <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "#DC2626", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      {format(parsed, "MMM")}
                    </span>
                    <span style={{ fontSize: "1rem", fontWeight: 700, color: "#DC2626", lineHeight: 1 }}>
                      {format(parsed, "d")}
                    </span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--ink)" }}>
                      {format(parsed, "EEEE, MMMM d, yyyy")}
                    </p>
                    {bd.reason && (
                      <p style={{ fontSize: "0.75rem", color: "var(--ink-muted)", marginTop: "2px" }}>
                        {bd.reason}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handleUnblock(bd.id)}
                    style={{
                      padding: "0.375rem 0.75rem", borderRadius: "8px",
                      border: "1px solid var(--border)", background: "transparent",
                      color: "var(--ink-muted)", fontSize: "0.75rem", cursor: "pointer",
                      flexShrink: 0,
                    }}
                  >
                    Unblock
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
