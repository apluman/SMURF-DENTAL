"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface Schedule {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

interface Props {
  dentistId: string;
  schedules: Schedule[];
}

interface DayState {
  active: boolean;
  start: string;
  end: string;
  saving: boolean;
}

const inputStyle: React.CSSProperties = {
  padding: "0.4rem 0.5rem",
  borderRadius: "8px",
  border: "1px solid var(--border)",
  background: "var(--bg)",
  color: "var(--ink)",
  fontSize: "0.8rem",
  width: "100%",
};

export default function ScheduleManager({ dentistId, schedules }: Props) {
  const router = useRouter();

  const [days, setDays] = useState<DayState[]>(() =>
    Array.from({ length: 7 }, (_, i) => {
      const s = schedules.find(s => s.day_of_week === i);
      return {
        active: s?.is_active ?? false,
        start: s?.start_time?.slice(0, 5) ?? "09:00",
        end: s?.end_time?.slice(0, 5) ?? "17:00",
        saving: false,
      };
    })
  );

  const [blockDate, setBlockDate] = useState("");
  const [blockReason, setBlockReason] = useState("");
  const [blocking, setBlocking] = useState(false);

  function update(i: number, patch: Partial<DayState>) {
    setDays(prev => prev.map((d, idx) => idx === i ? { ...d, ...patch } : d));
  }

  async function toggleDay(i: number) {
    const current = days[i];
    if (!current) return;
    if (current.active) {
      // Deactivating: remove from server (DELETE is a no-op if row doesn't exist)
      update(i, { saving: true });
      const res = await fetch("/api/dentist/schedule", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dentist_id: dentistId, day_of_week: i }),
      });
      if (res.ok) {
        update(i, { active: false, saving: false });
        router.refresh();
      } else {
        toast.error(`Failed to deactivate ${DAYS[i]}.`);
        update(i, { saving: false });
      }
    } else {
      update(i, { active: true });
    }
  }

  async function saveDay(i: number) {
    const day = days[i];
    if (!day) return;
    update(i, { saving: true });
    const res = await fetch("/api/dentist/schedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        dentist_id: dentistId,
        day_of_week: i,
        start_time: day.start,
        end_time: day.end,
      }),
    });
    if (res.ok) {
      toast.success(`${DAYS[i]} schedule saved.`);
      router.refresh();
    } else {
      toast.error(`Failed to save ${DAYS[i]}.`);
    }
    update(i, { saving: false });
  }

  async function handleBlockDate(e: React.FormEvent) {
    e.preventDefault();
    setBlocking(true);
    const res = await fetch("/api/dentist/blocked-dates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dentist_id: dentistId, date: blockDate, reason: blockReason || undefined }),
    });
    if (res.ok) {
      toast.success(`${blockDate} blocked.`);
      setBlockDate("");
      setBlockReason("");
      router.refresh();
    } else {
      toast.error("Failed to block date.");
    }
    setBlocking(false);
  }

  return (
    <div className="space-y-6">

      {/* Weekly schedule grid */}
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--ink-muted)" }}>
          Edit Working Hours
        </h2>
        <div className="card overflow-hidden">
          {DAYS.map((day, i) => {
            const d = days[i]!;
            const isWeekend = i === 0 || i === 6;
            return (
              <div
                key={day}
                className="flex flex-wrap items-center gap-3 px-5 py-3.5"
                style={{
                  borderBottom: i < 6 ? "1px solid var(--border)" : "none",
                  background: d.active ? "var(--surface)" : isWeekend ? "rgba(0,0,0,0.01)" : "var(--surface)",
                  opacity: !d.active && isWeekend ? 0.6 : 1,
                }}
              >
                {/* Day toggle */}
                <div className="flex items-center gap-3 w-28 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => toggleDay(i)}
                    className="relative flex-shrink-0 transition-colors duration-200"
                    style={{
                      width: "36px",
                      height: "20px",
                      borderRadius: "10px",
                      background: d.active ? "var(--accent)" : "var(--border)",
                    }}
                    aria-label={`Toggle ${day}`}
                  >
                    <span
                      className="absolute top-0.5 transition-transform duration-200"
                      style={{
                        left: d.active ? "18px" : "2px",
                        width: "16px",
                        height: "16px",
                        borderRadius: "50%",
                        background: "white",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                      }}
                    />
                  </button>
                  <span className="text-sm font-medium" style={{ color: d.active ? "var(--ink)" : "var(--ink-muted)" }}>
                    <span className="hidden sm:inline">{day}</span>
                    <span className="sm:hidden">{SHORT[i]}</span>
                  </span>
                </div>

                {/* Time inputs */}
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <input
                    type="time"
                    value={d.start}
                    onChange={e => update(i, { start: e.target.value })}
                    disabled={!d.active}
                    style={{ ...inputStyle, maxWidth: "110px", opacity: d.active ? 1 : 0.4 }}
                  />
                  <span className="text-xs flex-shrink-0" style={{ color: "var(--ink-muted)" }}>to</span>
                  <input
                    type="time"
                    value={d.end}
                    onChange={e => update(i, { end: e.target.value })}
                    disabled={!d.active}
                    style={{ ...inputStyle, maxWidth: "110px", opacity: d.active ? 1 : 0.4 }}
                  />
                </div>

                {/* Save button */}
                <button
                  type="button"
                  onClick={() => saveDay(i)}
                  disabled={d.saving || !d.active}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold transition hover:opacity-80 disabled:opacity-40 flex-shrink-0"
                  style={{ background: "var(--accent-subtle)", color: "var(--accent)" }}
                >
                  {d.saving ? "Saving…" : "Save"}
                </button>
              </div>
            );
          })}
        </div>
        <p className="text-xs mt-2" style={{ color: "var(--ink-muted)" }}>
          Toggle a day on to set hours, then click Save for that day.
        </p>
      </div>

      {/* Block a date */}
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--ink-muted)" }}>
          Block a Date
        </h2>
        <div className="card p-5">
          <form onSubmit={handleBlockDate} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  placeholder="e.g. Holiday, Conference, Personal"
                  style={inputStyle}
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={blocking || !blockDate}
              className="px-5 py-2.5 rounded-xl text-sm font-medium transition hover:opacity-90 disabled:opacity-50"
              style={{ background: "#DC2626", color: "white" }}
            >
              {blocking ? "Blocking…" : "Block This Date"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
